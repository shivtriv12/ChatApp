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
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use((0, cookie_parser_1.default)());
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
                    sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
                    secure: process.env.NODE_ENV === "development" ? false : true,
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
app.post("/api/v1/rooms", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.body;
    const createdBy = req.userId;
    if (!name) {
        res.status(400).json({ message: "Room name is required" });
        return;
    }
    try {
        const room = yield db_1.roomModel.create({
            name,
            createdBy,
        });
        res.status(201).json({ message: "Room created successfully", room });
        return;
    }
    catch (error) {
        console.error("Error creating room:", error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
}));
app.get("/api/v1/rooms", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rooms = yield db_1.roomModel.find({}, "name createdBy").populate("createdBy", "username").sort({ createdAt: -1 });
        res.json({ rooms, userId: req.userId });
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
app.delete("/api/v1/rooms/:roomId", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomId } = req.params;
    try {
        // Delete all messages related to the room
        yield db_1.messageModel.deleteMany({ roomId });
        // Delete the room
        const room = yield db_1.roomModel.findByIdAndDelete(roomId);
        if (!room) {
            res.status(404).json({ message: "Room not found" });
            return;
        }
        res.status(200).json({ message: "Room and related messages deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting room:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
const server = (0, http_1.createServer)(app);
const wss = new ws_1.WebSocketServer({ server });
const rooms = {};
wss.on("connection", (socket, req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let cookies = req.headers.cookie;
    if (cookies === null || cookies === void 0 ? void 0 : cookies.includes("token=")) {
        cookies = cookies.replace("token=", "");
    }
    if (!cookies) {
        socket.send(JSON.stringify({ message: "You are not logged in" }));
        socket.close();
        return;
    }
    const urlParams = new URLSearchParams((_a = req.url) === null || _a === void 0 ? void 0 : _a.split("?")[1]);
    const roomId = urlParams.get("roomId") || "someRandomRoomId";
    if (!roomId) {
        socket.send(JSON.stringify({ message: "No roomId provided" }));
        socket.close();
        return;
    }
    try {
        const { id, username } = jsonwebtoken_1.default.verify(cookies, JWT_SECRET);
        yield db_1.roomModel.findById(roomId);
        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }
        rooms[roomId].push(socket);
        function notifyAboutOnlinePeople() {
            const activeSockets = rooms[roomId].filter(ws => ws.readyState === ws_1.WebSocket.OPEN);
            rooms[roomId] = activeSockets;
            const totalConnections = activeSockets.length;
            activeSockets.forEach((client) => {
                client.send(JSON.stringify({ totalConnections }));
            });
        }
        notifyAboutOnlinePeople();
        socket.on("close", () => {
            notifyAboutOnlinePeople();
        });
        socket.on("message", (data) => __awaiter(void 0, void 0, void 0, function* () {
            const parsedData = JSON.parse(data.toString());
            const message = parsedData.message;
            ;
            const payload = JSON.stringify({ sender: username, content: message, timestamp: new Date().toISOString() });
            const socketsInRoom = rooms[roomId] || [];
            socketsInRoom.forEach((ws, index) => {
                if (ws.readyState !== ws_1.WebSocket.OPEN) {
                    // Remove the offline WebSocket from the array
                    socketsInRoom.splice(index, 1);
                    console.log(`Removed inactive WebSocket at index ${index}`);
                }
            });
            // After removing inactive WebSockets, send the payload to active ones
            socketsInRoom.forEach((ws) => {
                if (ws.readyState === ws_1.WebSocket.OPEN) {
                    ws.send(payload);
                    console.log(`Sent payload to WebSocket: ${payload}`);
                }
            });
            const newMessage = new db_1.messageModel({
                senderId: id, // The authenticated user ID
                roomId: roomId, // The current room ID
                content: message,
                timestamp: new Date(),
            });
            yield newMessage.save();
            console.log("Message saved to database:", newMessage);
        }));
    }
    catch (error) {
        socket.send(JSON.stringify({ message: "You are not logged in or invalid roomId" }));
        socket.close();
        return;
    }
}));
server.listen(3000, () => {
    console.log("Server is running on port 3000");
});
