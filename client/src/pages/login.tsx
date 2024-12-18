import axios from "axios";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { useRef } from "react";
//import { useNavigate } from "react-router-dom";

const BACKEND_URL = "http://localhost:3000";

export function Login(){
    const usernameRef = useRef<HTMLInputElement>();
    const passwordRef = useRef<HTMLInputElement>();
    //const navigate = useNavigate();

    async function login(){
        const username = usernameRef.current?.value;
        const password = passwordRef.current?.value;
        if (!username || !password) {
            alert("Please enter both username and password.");
            return;
        }
        try {
            const response = await axios.post(BACKEND_URL+"/api/v1/login",{
                username,
                password
            });
            const jwt=response.data.token;
            localStorage.setItem("token",jwt); 
            //navigate("/dashboard");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert("Wrong credentials");
            } else {
                alert("An unexpected error occurred.");
            }
        }
    }
    return <div className="h-screen w-screen bg-gray-200 flex justify-center items-center">
        <div className="bg-white rounded-xl border min-w-48 p-4">
            <Input reference={usernameRef} placeholder="Username" />
            <Input reference={passwordRef} placeholder="Password" />
            <div className="flex justify-center my-2"> 
                <Button onClick = {login} loading={false} fullWidth={true} variant="primary" text="Login"/>
            </div>
        </div>
    </div>
}