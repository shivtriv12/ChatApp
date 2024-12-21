import { useState, useEffect } from "react";
import axios from "axios";
import { TrashIcon } from "../icons/Trash"; // Import the TrashIcon component
import { useNavigate } from "react-router-dom";

const BACKEND_URL = "http://localhost:3000";

interface Room {
    _id: string;
    name: string;
    createdBy: {
        _id: string;
        username: string;
    };
}

export function RoomPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [newRoomName, setNewRoomName] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchRooms() {
            try {
                const response = await axios.get(`${BACKEND_URL}/api/v1/rooms`, { withCredentials: true });
                setRooms(response.data.rooms);
                setUserId(response.data.userId);
            } catch (error) {
                console.error("Error fetching rooms:", error);
            }
        }

        fetchRooms();
    }, []);

    async function createRoom() {
        if (!newRoomName) {
            alert("Please enter a room name.");
            return;
        }

        try {
            const response = await axios.post(`${BACKEND_URL}/api/v1/rooms`, { name: newRoomName }, { withCredentials: true });
            setRooms([...rooms, response.data.room]);
            setNewRoomName("");
            alert("Room created successfully!");
        } catch (error) {
            console.error("Error creating room:", error);
            alert("Failed to create room. Please try again.");
        }
    }

    async function deleteRoom(roomId: string) {
        try {
            await axios.delete(`${BACKEND_URL}/api/v1/rooms/${roomId}`, { withCredentials: true });
            setRooms(rooms.filter(room => room._id !== roomId));
            alert("Room deleted successfully!");
        } catch (error) {
            console.error("Error deleting room:", error);
            alert("Failed to delete room. Please try again.");
        }
    }

    const joinRoom = (roomId: string) => {
        navigate(`/chat/${roomId}`);
    };

    return (
        <div className="h-screen w-screen bg-gradient-to-r from-gray-800 to-gray-900 flex flex-col items-center p-8">
            <h1 className="text-4xl font-bold text-white mb-8">Rooms</h1>
            <div className="w-full max-w-4xl bg-gray-700 rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-4">Available Rooms</h2>
                <ul className="mb-8">
                    {rooms.length > 0 ? (
                        rooms.map((room) => (
                            <li key={room._id} className="flex justify-between items-center text-lg text-gray-300 mb-4">
                                <span>
                                    {room.name}{" "}
                                    {room.createdBy._id === userId ? (
                                        <button
                                            className="text-red-600 hover:text-red-800 transition"
                                            onClick={() => deleteRoom(room._id)}
                                        >
                                            <TrashIcon />
                                        </button>
                                    ) : (
                                        `(Created by: ${room.createdBy.username})`
                                    )}
                                </span>
                                <button
                                    className="bg-green-600 text-white px-3 py-1 rounded-md shadow-md hover:bg-green-700 transition transform hover:scale-105"
                                    onClick={() => joinRoom(room._id)}
                                >
                                    Join Room
                                </button>
                            </li>
                        ))
                    ) : (
                        <li className="text-lg text-gray-300">No rooms available</li>
                    )}
                </ul>
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Enter room name"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        className="w-full md:w-auto p-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={createRoom}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700 transition transform hover:scale-105"
                    >
                        Create Room
                    </button>
                </div>
            </div>
        </div>
    );
}