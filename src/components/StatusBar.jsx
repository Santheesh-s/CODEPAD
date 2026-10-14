import React, { useState, useEffect } from 'react';

export default function StatusBar({
    cursorPos = { line: 1, col: 1 },
    stats = { lines: 1, chars: 0, words: 0, selected: 0 },
    language = 'text',
    fontSize = 14,
    lineWrapping = true,
    isPermanentRoom = false,
    expiresAt = null,
    hasTeacher = false,
    isTeacher = false,
    collaboratorsCount = 1,
    onClaimRoom = null,
    isLoggedIn = false
}) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (isPermanentRoom || !expiresAt) return;

        const updateTimer = () => {
            const diff = expiresAt - Date.now();
            if (diff <= 0) {
                setTimeLeft('Expired');
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${hours}h ${mins}m`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, [isPermanentRoom, expiresAt]);

    return (
        <footer className="flex items-center justify-between px-3 py-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700/80 text-[11px] text-gray-600 dark:text-gray-400 select-none z-10 transition-colors">
            {/* Left section: Editor position & stats */}
            <div className="flex items-center gap-3">
                <span className="font-mono">
                    Ln {cursorPos.line}, Col {cursorPos.col}
                </span>

                {stats.selected > 0 && (
                    <span className="text-blue-500 dark:text-blue-400 font-mono">
                        ({stats.selected} selected)
                    </span>
                )}

                <span className="hidden sm:inline border-l border-gray-300 dark:border-gray-700 h-3"></span>

                <span className="hidden sm:inline">
                    {stats.lines} lines · {stats.words} words · {stats.chars} chars
                </span>

                <span className="hidden md:inline border-l border-gray-300 dark:border-gray-700 h-3"></span>

                <span className="hidden md:inline uppercase font-semibold text-gray-500 dark:text-gray-400">
                    {language}
                </span>
            </div>

            {/* Right section: Room status, mode, and options */}
            <div className="flex items-center gap-3">
                {hasTeacher && (
                    <span className={`px-2 py-0.5 rounded font-semibold text-[10px] flex items-center gap-1 ${isTeacher
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                        }`}>
                        {isTeacher ? '🎓 Teacher (Editing)' : '🔒 Read-Only Student'}
                    </span>
                )}

                <span className="hidden lg:inline text-gray-400 dark:text-gray-500">
                    {fontSize}px · {lineWrapping ? 'Wrap: On' : 'Wrap: Off'}
                </span>

                <span className="hidden sm:inline border-l border-gray-300 dark:border-gray-700 h-3"></span>

                {isPermanentRoom ? (
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Permanent
                    </span>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium" title="Anonymous session expires after 24 hours">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            {timeLeft ? `Expires: ${timeLeft}` : 'Expiring (24h)'}
                        </span>

                        {isLoggedIn && onClaimRoom && (
                            <button
                                onClick={onClaimRoom}
                                title="Save this session permanently to your Google account"
                                className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 transition-colors font-semibold"
                            >
                                Save to Account
                            </button>
                        )}
                    </div>
                )}

                <span className="border-l border-gray-300 dark:border-gray-700 h-3"></span>

                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium" title="Connected to Real-time Collaboration Engine">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="hidden xs:inline">{collaboratorsCount} {collaboratorsCount === 1 ? 'peer' : 'peers'}</span>
                </span>
            </div>
        </footer>
    );
}
