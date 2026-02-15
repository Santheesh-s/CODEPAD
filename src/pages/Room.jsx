import { useState } from 'react';
import { useParams } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import Toolbar from '../components/Toolbar';

export default function Room() {
    const { roomId } = useParams();
    const [language, setLanguage] = useState('javascript');

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('URL copied to clipboard!');
    };

    return (
        <div className="flex flex-col h-screen">
            <Toolbar
                language={language}
                setLanguage={setLanguage}
                onShare={handleShare}
            />
            <div className="flex-1 overflow-hidden">
                <CodeEditor roomId={roomId} language={language} />
            </div>
        </div>
    );
}
