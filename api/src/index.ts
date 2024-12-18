import express from "express";
import z, { ZodError } from "zod";
import bcrypt from "bcrypt";
import { userModel,messageModel } from "./db";
import jwt,{JwtPayload} from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import {WebSocketServer,WebSocket} from "ws";

const app = express();
app.use(cors());
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
interface User{
    _id:string;
    username:string;
    password:string;
}
interface CustomWebSocket extends WebSocket {
    userId?: string;
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
            message:"User Signed In"
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
        const user = (await userModel.findOne({ username })) as User;
        if (user) {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if(isPasswordValid){
                const token = jwt.sign({
                    id: user._id
                }, JWT_SECRET)
        
                res.json({
                    token
                });
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

const server = createServer(app);
const wss = new WebSocketServer({ server });

const rooms: { [roomId: string]: Set<WebSocket> } = {};

wss.on("connection", (ws:CustomWebSocket,req) => {
    const token = req.headers["authorization"];
    if (!token) {
        ws.close(1008, "Unauthorized");
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded) {
            (ws as any).userId = (decoded as JwtPayload).id;
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
                for (const r in rooms) {
                    rooms[r].delete(ws);
                }
                const room = message.room;
                if (!rooms[room]) {
                    rooms[room] = new Set();
                }
                rooms[room].add(ws);
                ws.send(JSON.stringify({ type: "join_success", room }));
            } else if (message.type === "send_message") {
                const room = message.room;
                const content = message.content;
                if (rooms[room]) {
                    rooms[room].forEach(async (client) => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: "message", content }));
                            await messageModel.create({
                                senderId: ws['userId'],
                                roomId: room,
                                content: content
                            });
                        }
                    });
                }
            }
        } catch (error) {
            ws.close(4003, "Invalid message format");
        }
        
    });

    ws.on("close", () => {
        for (const room in rooms) {
            rooms[room].delete(ws);
        }
        console.log("disconnected");
    });
});

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});