"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = __importStar(require("zod"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("./db");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const ws_1 = require("ws");
const middleware_1 = require("./middleware");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in the environment variables");
}
const signupSchema = zod_1.default.object({
    username: zod_1.default.string().min(3, { message: "Username must be atleast 3 characters long." }),
    password: zod_1.default.string().min(8, { message: "Password must be atleast 8 characters long." })
});
app.post("/api/v1/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = signupSchema.parse(req.body);
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        yield db_1.userModel.create({
            username: username,
            password: hashedPassword
        });
        res.status(201).json({
            message: "User Registered Successfully"
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(400).json({
                message: "Validation error.",
                errors: error.errors,
            });
        }
        else if (error.code === 11000) {
            res.status(409).json({
                message: "User already exists.",
            });
        }
        else {
            res.status(500).json({
                message: "Internal server error.",
            });
        }
    }
}));
app.post("/api/v1/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = signupSchema.parse(req.body);
        const user = (yield db_1.userModel.findOne({ username }));
        if (user) {
            const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
            if (isPasswordValid) {
                const token = jsonwebtoken_1.default.sign({
                    id: user._id,
                    username: user.username,
                }, JWT_SECRET, { expiresIn: '12h' });
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
        else {
            res.status(403).json({
                message: "Incorrrect credentials"
            });
        }
    }
    catch (error) {
        if (error instanceof zod_1.default.ZodError) {
            res.status(400).json({
                message: "Validation error.",
                errors: error.errors,
            });
        }
        else {
            res.status(500).json({
                message: "Internal server error.",
            });
        }
    }
}));
app.post("/api/v1/rooms", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.body;
    const header = req.headers["authorization"];
    try {
        if (!header) {
            res.status(403).json({
                message: "You are not logged in"
            });
            return;
        }
        const token = header.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const createdBy = decoded.id;
        if (!name) {
            res.status(400).json({ message: "Room name is required" });
            return;
        }
        const room = yield db_1.roomModel.create({
            name,
            createdBy,
        });
        res.status(201).json({ message: "Room created successfully", room });
        return;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(403).json({
                message: "You are not logged in"
            });
            return;
        }
        console.error("Error creating room:", error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
}));
app.get("/api/v1/rooms", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rooms = yield db_1.roomModel.find({}, "name").sort({ createdAt: -1 });
        res.json(rooms.map((room) => room.name));
    }
    catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).send("Internal server error");
    }
}));
function isPopulatedMessage(message) {
    return message.senderId && typeof message.senderId.username === 'string';
}
app.get("/api/v1/rooms/:roomId/messages", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomId } = req.params;
    try {
        const room = yield db_1.roomModel.findById(roomId);
        if (!room) {
            res.status(404).send("Room not found");
            return;
        }
        const messages = yield db_1.messageModel
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
            }
            else {
                return {
                    sender: "Unknown",
                    content: message.content,
                    timestamp: message.timestamp,
                };
            }
        });
        res.json(responseMessages);
        return;
    }
    catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).send("Internal server error");
    }
}));
const server = (0, http_1.createServer)(app);
const wss = new ws_1.WebSocketServer({ server });
const rooms = {};
wss.on("connection", (ws, req) => {
    const token = req.headers["authorization"];
    if (!token) {
        ws.close(1008, "Unauthorized");
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded) {
            ws.userId = decoded.id; // Attach userId to the socket
        }
    }
    catch (err) {
        ws.close(1008, "Unauthorized");
        return;
    }
    console.log("connected");
    ws.on("message", (data) => __awaiter(void 0, void 0, void 0, function* () {
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
            }
            else if (message.type === "send_message") {
                const room = ws.currentRoom;
                const content = message.content;
                if (room && rooms[room]) {
                    const newMessage = yield db_1.messageModel.create({
                        senderId: ws.userId,
                        roomId: room,
                        content: content
                    });
                    rooms[room].forEach((client) => {
                        if (client.readyState === ws_1.WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: "message",
                                sender: newMessage.senderId,
                                content: newMessage.content,
                                timestamp: newMessage.timestamp
                            }));
                        }
                    });
                }
                else {
                    ws.send(JSON.stringify({ type: "error", message: "You must join a room first" }));
                }
            }
            else {
                ws.close(4001, "Invalid message type");
            }
        }
        catch (error) {
            ws.close(4003, "Invalid message format");
        }
    }));
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
