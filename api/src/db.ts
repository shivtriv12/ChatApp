import mongoose, { model, Schema } from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const DB_URL = process.env.DB_URL;
if (!DB_URL) {
    throw new Error("Missing DB_URL in environment variables");
}
mongoose.connect(DB_URL);

const userSchema = new Schema({
    username:{type:String,unique:true,required:true},
    password: {type:String,required:true}
});
export const userModel = model("User",userSchema);

const messageSchema = new Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});
export const messageModel= mongoose.model('Message', messageSchema);

const roomSchema = new Schema({
    name: { type: String, unique: true, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User",required:true },
    createdAt: { type: Date, default: Date.now },
});
export const roomModel = model("Room", roomSchema);