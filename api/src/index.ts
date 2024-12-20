import express,{ Request, Response } from "express";
import z, { ZodError } from "zod";
import bcrypt from "bcrypt";
import { userModel,messageModel,roomModel } from "./db";
import jwt,{JwtPayload} from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import {WebSocketServer,WebSocket} from "ws";
import { userMiddleware } from "./middleware";
import { Document} from "mongoose";
import cookieParser from "cookie-parser";


const app = express();
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in the environment variables");
}
const signupSchema = z.object({
    username:z.string().min(3,{message:"Username must be atleast 3 characters long."}),
    password:z.string().min(8,{message:"Password must be atleast 8 characters long."})
});
interface PopulatedMessage extends Document {
    senderId: {
        username: string;
    };
    content: string;
    timestamp: Date;
}
interface CustomWebSocket extends WebSocket {
    userId?: string;
    currentRoom?: string;
}

app.post("/api/v1/register",async(req,res)=>{
    try{
        const {username,password}=signupSchema.parse(req.body);
        const hashedPassword = await bcrypt.hash(password,10);

        await userModel.create({
            username:username,
            password:hashedPassword
        });
        res.status(201).json({
            message:"User Registered Successfully"
        });
    }catch(error){
        if (error instanceof ZodError) {
            res.status(400).json({
                message: "Validation error.",
                errors: error.errors, 
            });
        } else if ((error as any).code === 11000) {
            res.status(409).json({
                message: "User already exists.",
            });
        } else {
            res.status(500).json({
                message: "Internal server error.",
            });
        }
    }
});


app.post("/api/v1/login", async (req, res) => {
    try{
        const {username,password}=signupSchema.parse(req.body);
        const user = (await userModel.findOne({ username }));
        if (user) {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if(isPasswordValid){
                const token = jwt.sign({
                    id: user._id,
                    username: user.username,
                }, JWT_SECRET, { expiresIn: '12h' })
        
                res.cookie("token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "strict",
                    maxAge: 12 * 60 * 60 * 1000
                });

                res.json({ message: "Login successful" });
                return;
            }
            else {
                res.status(403).json({
                    message: "Incorrrect credentials"
                });
            } 
        }
        else{
            res.status(403).json({
                message: "Incorrrect credentials"
            });
        }
    }catch(error){
        if (error instanceof z.ZodError) {
            res.status(400).json({
                message: "Validation error.",
                errors: error.errors,
            });
        } else {
            res.status(500).json({
                message: "Internal server error.",
            });
        }
    }
});


app.post("/api/v1/rooms", userMiddleware, async (req, res) => {
    const { name } = req.body;
    const createdBy = req.userId;

    if (!name) {
        res.status(400).json({ message: "Room name is required" });
        return;
    }

    try {
        const room = await roomModel.create({
            name,
            createdBy,
        });

        res.status(201).json({ message: "Room created successfully", room });
        return;
    } catch (error) {
        console.error("Error creating room:", error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
});

app.get("/api/v1/rooms", userMiddleware, async (req, res) => {
    try {
        const rooms = await roomModel.find({}, "name createdBy").populate("createdBy", "username").sort({ createdAt: -1 });
        res.json({ rooms, userId: req.userId });
    } catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).send("Internal server error");
    }
});

function isPopulatedMessage(message: any): message is PopulatedMessage {
    return message.senderId && typeof message.senderId.username === 'string';
}

app.get("/api/v1/rooms/:roomId/messages",userMiddleware, async (req: Request, res: Response) => {
    const { roomId } = req.params;

    try {
        const room = await roomModel.findById(roomId);
        if (!room) {
            res.status(404).send("Room not found");
            return;
        }

        const messages = await messageModel
            .find({ roomId: room._id })
            .populate("senderId", "username")
            .sort({ timestamp: 1 });

        const responseMessages = messages.map(message => {
            if (isPopulatedMessage(message)) {
                return {
                    sender: message.senderId.username,
                    content: message.content,
                    timestamp: message.timestamp,
                };
            } else {
                return {
                    sender: "Unknown",
                    content: message.content,
                    timestamp: message.timestamp,
                };
            }
        });
        res.json(responseMessages);
        return;
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).send("Internal server error");
    }
});

app.delete("/api/v1/rooms/:roomId", userMiddleware, async (req, res) => {
    const { roomId } = req.params;

    try {
        // Delete all messages related to the room
        await messageModel.deleteMany({ roomId });

        // Delete the room
        const room = await roomModel.findByIdAndDelete(roomId);

        if (!room) {
            res.status(404).json({ message: "Room not found" });
            return;
        }

        res.status(200).json({ message: "Room and related messages deleted successfully" });
    } catch (error) {
        console.error("Error deleting room:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

const server = createServer(app);
const wss = new WebSocketServer({ server });
const rooms: { [roomId: string]: Set<WebSocket> } = {};

wss.on("connection", (ws: CustomWebSocket, req) => {
    const token = req.headers["authorization"];
    if (!token) {
        ws.close(1008, "Unauthorized");
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded) {
            ws.userId = (decoded as JwtPayload).id; // Attach userId to the socket
        }
    } catch (err) {
        ws.close(1008, "Unauthorized");
        return;
    }

    console.log("connected");

    ws.on("message", async (data) => {
        const message = JSON.parse(data.toString());
        try {
            if (message.type === "join_room") {
                // Remove the user from any existing rooms
                if (ws.currentRoom) {
                    rooms[ws.currentRoom].delete(ws);
                }

                const room = message.room;
                if (!rooms[room]) {
                    rooms[room] = new Set();
                }
                rooms[room].add(ws);
                ws.currentRoom = room; // Track the current room the user is in
                ws.send(JSON.stringify({ type: "join_success", room }));
            } else if (message.type === "send_message") {
                const room = ws.currentRoom;
                const content = message.content;
                if (room && rooms[room]) {
                    const newMessage = await messageModel.create({
                        senderId: ws.userId,
                        roomId: room,
                        content: content
                    });

                    rooms[room].forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: "message",
                                sender: newMessage.senderId,
                                content: newMessage.content,
                                timestamp: newMessage.timestamp
                            }));
                        }
                    });
                } else {
                    ws.send(JSON.stringify({ type: "error", message: "You must join a room first" }));
                }
            } else {
                ws.close(4001, "Invalid message type");
            }
        } catch (error) {
            ws.close(4003, "Invalid message format");
        }
    });

    ws.on("close", () => {
        if (ws.currentRoom) {
            rooms[ws.currentRoom].delete(ws);
        }
        console.log("disconnected");
    });
});

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});