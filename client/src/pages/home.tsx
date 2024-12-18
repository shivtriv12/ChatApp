import { useNavigate } from "react-router-dom";
import { Button } from "../components/button";

export function HomePage() {
    const navigate = useNavigate();

    return (
        <div className="h-screen w-screen bg-gray-100 flex flex-col justify-center items-center">

        <h1 className="text-4xl font-bold text-blue-700 mb-8">Welcome to Chat App</h1>

            
            <div className="flex gap-4">
            
                <Button
                    variant="primary"
                    text="Register"
                    onClick={() => navigate("/register")}
                />
                
                
                <Button
                    variant="secondary"
                    text="Login"
                    onClick={() => navigate("/login")}
                />
            </div>
        </div>
    );
}
