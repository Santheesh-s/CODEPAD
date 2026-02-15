import React from 'react';

const languages = [
    'javascript',
    'python',
    'html',
    'css',
    'typescript',
    'java',
    'cpp'
];

export default function Toolbar({ language, setLanguage, onShare }) {
    return (
        <div className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-white">CodeShare</h1>
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                >
                    {languages.map(lang => (
                        <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                    ))}
                </select>
            </div>
            <button
                onClick={onShare}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded transition-colors"
            >
                Share
            </button>
        </div>
    );
}
