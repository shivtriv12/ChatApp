import mongoose, { model, Schema } from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const DB_URL = process.env.DB_URL;
if (!DB_URL) {
    throw new Error("Missing DB_URL in environment variables");
}
mongoose.connect(DB_URL);

const userSchema = new Schema({
    username:{type:String,unique:true},
    password: String
});
export const userModel = model("User",userSchema);

const messageSchema = new Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roomId: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});
export const messageModel= mongoose.model('Message', messageSchema);