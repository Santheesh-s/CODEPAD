import { useState, useEffect, useRef } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { useParams, Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { FILE_EXTENSIONS } from '../utils/templates';

const languages = [
    { id: 'javascript', label: 'JavaScript' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'python', label: 'Python 3' },
    { id: 'html', label: 'HTML5' },
    { id: 'css', label: 'CSS3' },
    { id: 'cpp', label: 'C++ (GCC)' },
    { id: 'java', label: 'Java (OpenJDK)' },
    { id: 'text', label: 'Plain Text' }
];

export default function Toolbar({
    language,
    setLanguage,
    onShare,
    onCopyAll,
    onDownload,
    onInsertTemplate,
    onRun,
    isRunning = false,
    onTogglePreview,
    isPreviewOpen = false,
    fontSize,
    setFontSize,
    lineWrapping,
    setLineWrapping,
    collaborators = [],
    isTeacher,
    hasTeacher,
    canEdit,
    onClaimTeacher,
    onResignTeacher,
    isPermanentRoom,
    onClaimRoom = null
}) {
    const [user, setUser] = useState(null);
    const { roomId } = useParams();
    const [isDark, setIsDark] = useTheme();
    const [copied, setCopied] = useState(false);
    const [shared, setShared] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [collaboratorsOpen, setCollaboratorsOpen] = useState(false);
    const settingsRef = useRef(null);
    const collabRef = useRef(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target)) {
                setSettingsOpen(false);
            }
            if (collabRef.current && !collabRef.current.contains(e.target)) {
                setCollaboratorsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCopyAll = async () => {
        await onCopyAll?.();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = () => {
        onShare?.();
        setShared(true);
        setTimeout(() => setShared(false), 2500);
    };

    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error('Error logging in:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const isPreviewSupported = ['html', 'javascript', 'css'].includes(language);

    return (
        <header className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700/80 w-full gap-3 transition-colors duration-200 select-none z-30">
            {/* Left section: Logo/Room ID, Language Selector, Templates, Teacher Role */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                <Link
                    to="/"
                    title="Back to Dashboard"
                    className="flex items-center gap-1.5 text-sm font-bold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    <span className="text-blue-600 dark:text-blue-400">⚡</span>
                    <span className="hidden sm:inline font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">Codeplaces</span>
                    <span className="text-gray-400 dark:text-gray-500">/</span>
                    <span className="font-mono text-xs sm:text-sm font-semibold max-w-[120px] sm:max-w-[180px] truncate text-gray-700 dark:text-gray-200">
                        {roomId}
                    </span>
                </Link>

                {isPermanentRoom ? (
                    <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Permanent
                    </span>
                ) : (
                    <div className="hidden md:flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Expiring
                        </span>
                        {user && onClaimRoom && (
                            <button
                                onClick={onClaimRoom}
                                title="Save this session permanently to your Google account"
                                className="text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 font-bold transition-colors"
                            >
                                + Save
                            </button>
                        )}
                    </div>
                )}

                <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

                {/* Language dropdown */}
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={!canEdit}
                    title="Change Programming Language"
                    className={`bg-gray-100 dark:bg-gray-700/80 text-gray-900 dark:text-white text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                >
                    {languages.map(lang => (
                        <option key={lang.id} value={lang.id}>{lang.label}</option>
                    ))}
                </select>

                {/* Starter template button */}
                {canEdit && onInsertTemplate && (
                    <button
                        onClick={onInsertTemplate}
                        title={`Insert starter template for ${language}`}
                        className="text-xs bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors flex items-center gap-1 font-medium"
                    >
                        <span>📝</span>
                        <span className="hidden sm:inline">Template</span>
                    </button>
                )}

                {/* Teacher / Student Mode Controls */}
                {isTeacher ? (
                    <button
                        onClick={onResignTeacher}
                        title="Resign Teacher role: allow all participants to edit code"
                        className="bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 px-2.5 py-1.5 rounded-lg transition-colors font-medium text-xs flex items-center gap-1.5"
                    >
                        <span>🎓</span>
                        <span>Resign Teacher</span>
                    </button>
                ) : (
                    <div>
                        {hasTeacher ? (
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                                <span>🔒</span>
                                <span className="hidden sm:inline">Teacher mode active (View only)</span>
                                <span className="sm:hidden">View only</span>
                            </span>
                        ) : (
                            <button
                                onClick={onClaimTeacher}
                                title="Claim Teacher role to lock editor permissions for students"
                                className="bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2.5 py-1.5 rounded-lg transition-colors font-medium text-xs flex items-center gap-1"
                            >
                                <span>🎓</span>
                                <span className="hidden sm:inline">Become Teacher</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Right section: Run Button, Live Preview, Collaborators, Settings, Download, Theme, Auth */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
                {/* Run Code Button */}
                {onRun && (
                    <button
                        onClick={onRun}
                        disabled={isRunning}
                        title="Execute code (Ctrl+Enter / Cmd+Enter)"
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 ${isRunning
                            ? 'bg-emerald-700 text-white opacity-80 cursor-wait'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 shadow-emerald-600/20'
                            }`}
                    >
                        {isRunning ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Running...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                <span>Run</span>
                                <span className="hidden md:inline text-[10px] opacity-75 font-normal">(Ctrl+↵)</span>
                            </>
                        )}
                    </button>
                )}

                {/* Live Preview Button (for HTML/JS/CSS) */}
                {isPreviewSupported && onTogglePreview && (
                    <button
                        onClick={onTogglePreview}
                        title="Toggle Web Live Preview"
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${isPreviewOpen
                            ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border-blue-300 dark:border-blue-700 shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                            }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        <span className="hidden sm:inline">Preview</span>
                    </button>
                )}

                {/* Collaborators Online Indicator & Popover */}
                <div className="relative" ref={collabRef}>
                    <button
                        onClick={() => setCollaboratorsOpen(!collaboratorsOpen)}
                        title="View online collaborators in this session"
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>{Math.max(1, collaborators.length)}</span>
                        <span className="hidden sm:inline">online</span>
                    </button>

                    {collaboratorsOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 z-50 text-xs">
                            <div className="font-semibold text-gray-800 dark:text-gray-200 mb-2 pb-1.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <span>Active Collaborators</span>
                                <span className="text-[10px] text-gray-400 font-normal">{collaborators.length || 1} connected</span>
                            </div>
                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                                {collaborators.length > 0 ? (
                                    collaborators.map((c, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span
                                                className="w-4 h-4 rounded-full shrink-0 border border-white dark:border-gray-900"
                                                style={{ backgroundColor: c.color || '#3B82F6' }}
                                            />
                                            <span className="font-medium truncate text-gray-700 dark:text-gray-300">
                                                {c.name || 'Anonymous User'}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-400 italic">You are the only one here right now. Share the link to collaborate!</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Editor Settings (Font Size, Wrap) */}
                <div className="relative" ref={settingsRef}>
                    <button
                        onClick={() => setSettingsOpen(!settingsOpen)}
                        title="Editor Preferences"
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                    </button>

                    {settingsOpen && (
                        <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 z-50 text-xs">
                            <div className="font-semibold text-gray-800 dark:text-gray-200 mb-2 pb-1.5 border-b border-gray-100 dark:border-gray-700">
                                Editor Settings
                            </div>
                            <div className="flex flex-col gap-3">
                                <div>
                                    <label className="text-gray-500 dark:text-gray-400 block mb-1">Font Size: {fontSize}px</label>
                                    <div className="flex items-center gap-1">
                                        {[12, 14, 16, 18, 20].map(size => (
                                            <button
                                                key={size}
                                                onClick={() => setFontSize(size)}
                                                className={`flex-1 py-1 rounded text-center font-mono ${fontSize === size
                                                    ? 'bg-blue-600 text-white font-bold'
                                                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Word Wrap</span>
                                    <button
                                        onClick={() => setLineWrapping(!lineWrapping)}
                                        className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${lineWrapping ? 'bg-blue-600 justify-end' : 'bg-gray-300 dark:bg-gray-600 justify-start'
                                            }`}
                                    >
                                        <span className="bg-white w-3.5 h-3.5 rounded-full shadow-md"></span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Download Code Button */}
                {onDownload && (
                    <button
                        onClick={onDownload}
                        title={`Download code as .${FILE_EXTENSIONS[language] || 'txt'}`}
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                    </button>
                )}

                {/* Copy All Button */}
                <button
                    onClick={handleCopyAll}
                    title="Copy entire editor content to clipboard"
                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                >
                    {copied ? (
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                    )}
                </button>

                {/* Share URL Button */}
                <button
                    onClick={handleShare}
                    title="Copy room URL to share"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
                >
                    {shared ? (
                        <>
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                            </svg>
                            <span>Share</span>
                        </>
                    )}
                </button>

                {/* Dark / Light Mode Toggle */}
                <button
                    onClick={() => setIsDark(!isDark)}
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 text-amber-500 transition-colors"
                >
                    {isDark ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                        </svg>
                    )}
                </button>

                {/* Google Auth */}
                {user ? (
                    <div className="flex items-center gap-2">
                        {user.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user.displayName || 'User'}
                                className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600"
                                title={user.displayName || user.email}
                            />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs" title={user.displayName || user.email}>
                                {(user.displayName || user.email || 'U')[0].toUpperCase()}
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            title="Sign out of account"
                            className="text-xs bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleLogin}
                        title="Sign in with Google to save permanent rooms"
                        className="text-xs bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-2.5 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="hidden xs:inline">Login</span>
                    </button>
                )}
            </div>
        </header>
    );
}
