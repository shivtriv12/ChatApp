import { useNavigate } from "react-router-dom";

export function HomePage() {
    const navigate = useNavigate();

    return (
        <div className="h-screen w-screen bg-gradient-to-r from-gray-800 to-gray-900 flex flex-col justify-center items-center">
            <div className="w-full max-w-4xl p-8 bg-gray-700 rounded-lg shadow-lg flex flex-col md:flex-row justify-between items-center">
                <div className="text-left mb-8 md:mb-0">
                    <h1 className="text-5xl font-bold text-white mb-4">Chat App</h1>
                    <p className="text-lg text-gray-300 mb-8 max-w-md">
                        Have a chat with the world on various topics. Create rooms and discuss anything you like. Register now to get started or log in if you already have an account.
                    </p>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col items-center">
                        <p className="text-lg text-gray-300 mb-2">New here?</p>
                        <button
                            className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-700 transition transform hover:scale-105"
                            onClick={() => navigate("/register")}
                        >
                            Register
                        </button>
                    </div>
                    <div className="flex flex-col items-center">
                        <p className="text-lg text-gray-300 mb-2">Already a user?</p>
                        <button
                            className="bg-green-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-green-700 transition transform hover:scale-105"
                            onClick={() => navigate("/login")}
                        >
                            Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}