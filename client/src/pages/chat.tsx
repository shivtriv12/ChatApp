import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from 'axios'; // Ensure axios is installed and imported

const BACKEND_WS_URL = "ws://localhost:3000"; // Adjust if your WS server is on a different port
const BACKEND_API_URL = "http://localhost:3000/api/v1";

interface Message {
    sender: string;
    content: string;
    timestamp: string;
}

export function Chat() {
    const { roomId } = useParams<{ roomId: string }>();

    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!roomId) {
            console.error("No roomId provided");
            navigate("/rooms");
            return;
        }

        const fetchMessages = async () => {
            try {
                const response = await fetch(`${BACKEND_API_URL}/rooms/${roomId}/messages`, {
                    credentials: 'include', // Ensure cookies are sent
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch messages");
                }
                const data = await response.json();
                setMessages(data);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMessages();

        // Establish WebSocket connection after fetching messages
        wsRef.current = new WebSocket(`${BACKEND_WS_URL}/?roomId=${roomId}`);
        
        wsRef.current.onopen = () => {
            console.log("WebSocket connection established");
        };

        wsRef.current.onmessage = (event) => {
            try {
                const message: Message = JSON.parse(event.data);
                setMessages((prev) => [...prev, message]);
            } catch (error) {
                console.error("Error parsing message:", error);
            }
        };

        wsRef.current.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        wsRef.current.onclose = () => {
            console.log("WebSocket connection closed");
        };

        // Clean up on component unmount
        return () => {
            wsRef.current?.close();
        };
    }, [roomId, navigate]);

    const sendMessage = () => {
        if (newMessage.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
            const messagePayload = {
                message: newMessage
                // Removed sender as it's handled by the backend
            };
            wsRef.current.send(JSON.stringify(messagePayload));
            setNewMessage("");
        } else {
            console.error("WebSocket is not open. ReadyState:", wsRef.current?.readyState);
        }
    };

    return (
        <div className="h-screen w-screen bg-gradient-to-r from-gray-800 to-gray-900 flex flex-col items-center p-8">
            <h1 className="text-4xl font-bold text-white mb-8">Chat Room</h1>
            <div className="w-full max-w-4xl bg-gray-700 rounded-lg shadow-lg p-8 flex flex-col">
                <div className="flex-1 overflow-y-auto mb-4">
                    {messages.map((message, index) => (
                        <div key={index} className="text-white mb-2">
                            <strong>{message.sender}: </strong>
                            <span>{message.content}</span>
                            <span className="text-gray-400 text-sm ml-2">
                                {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="flex">
                    <input
                        type="text"
                        placeholder="Enter your message"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                sendMessage();
                            }
                        }}
                        className="flex-1 p-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={sendMessage}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700 transition transform hover:scale-105 ml-2"
                    >
                        Send
                    </button>
                </div>
                {/* Removed Leave Room button */}
            </div>
        </div>
    );
}