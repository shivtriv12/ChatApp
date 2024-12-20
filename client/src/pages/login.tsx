import axios from "axios";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = "http://localhost:3000";

export function Login() {
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    async function login() {
        const username = usernameRef.current?.value;
        const password = passwordRef.current?.value;
        if (!username || !password) {
            alert("Please enter both username and password.");
            return;
        }
        try {
            await axios.post(`${BACKEND_URL}/api/v1/login`, {
                username,
                password,
            }, { withCredentials: true });
            alert("You have logged in successfully!");
            navigate("/rooms");
        } catch (error) {
            alert("Login failed. Please try again.");
        }
    }

    return (
        <div className="h-screen w-screen bg-gradient-to-r from-gray-800 to-gray-900 flex flex-col justify-center items-center">
            <div className="w-full max-w-md p-8 bg-gray-700 rounded-lg shadow-lg">
                <h1 className="text-4xl font-bold text-white mb-8 text-center">Login</h1>
                <div className="mb-4">
                    <input
                        ref={usernameRef}
                        type="text"
                        placeholder="Username"
                        className="w-full p-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="mb-6">
                    <input
                        ref={passwordRef}
                        type="password"
                        placeholder="Password"
                        className="w-full p-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    onClick={login}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700 transition transform hover:scale-105"
                >
                    Login
                </button>
                <p className="text-gray-300 mt-4 text-center">
                    New here?{" "}
                    <span
                        onClick={() => navigate("/register")}
                        className="text-blue-500 cursor-pointer hover:underline"
                    >
                        Register
                    </span>
                </p>
            </div>
        </div>
    );
}