import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in the environment variables");
}

declare module "express-serve-static-core" {
    interface Request {
        userId?: string;
    }
}

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers["authorization"];
    if (!header) {
        res.status(403).json({
            message: "You are not logged in"
        });
        return;
    }
    try {
        const token = header.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(403).json({
            message: "You are not logged in"
        });
        return;
    }
};