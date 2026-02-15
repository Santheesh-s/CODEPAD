import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/new-room')
            .then(res => res.json())
            .then(data => {
                navigate(`/${data.roomId}`);
            })
            .catch(err => {
                console.error("Failed to create room:", err);
                // Fallback or error state
            });
    }, [navigate]);

    return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
            <p>Creating a new session...</p>
        </div>
    );
}
