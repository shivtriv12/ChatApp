import express from "express";
import z, { ZodError } from "zod";
import bcrypt from "bcrypt";
import { userModel } from "./db";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";

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

app.listen(3000,()=>{
    console.log("Listening");
});