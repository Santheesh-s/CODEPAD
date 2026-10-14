import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from '../hooks/useTheme';

export default function Home() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [userRooms, setUserRooms] = useState([]);
    const [isDark, setIsDark] = useTheme();

    // Quick join input state
    const [joinInput, setJoinInput] = useState('');

    // Search/filter rooms state
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [modalConfig, setModalConfig] = useState(null);
    const [modalInput, setModalInput] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState('');

    // Toast feedback state
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 2500);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) {
            setUserRooms([]);
            return;
        }

        const q = query(collection(db, 'rooms'), where('ownerId', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            rooms.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setUserRooms(rooms);
        });

        return () => unsubscribe();
    }, [user]);

    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            showToast("Logged in successfully!");
        } catch (error) {
            console.error('Error logging in:', error);
            showToast("Login failed. Please check popup permissions.");
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            showToast("Logged out successfully.");
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const openDeleteModal = (room) => {
        setModalConfig({ type: 'delete', room });
        setModalError('');
    };

    const openRenameModal = (room) => {
        setModalConfig({ type: 'rename', room });
        setModalInput(room.id);
        setModalError('');
    };

    const handleQuickJoin = (e) => {
        e.preventDefault();
        const raw = joinInput.trim();
        if (!raw) return;

        // Support full URLs or room IDs
        let cleaned = raw;
        if (cleaned.includes('/')) {
            const parts = cleaned.split('/');
            cleaned = parts[parts.length - 1] || parts[parts.length - 2];
        }
        cleaned = cleaned.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();

        if (cleaned) {
            navigate(`/${cleaned}`);
        }
    };

    const handleModalSubmit = async () => {
        setModalError('');
        setModalLoading(true);

        try {
            if (modalConfig.type === 'delete') {
                await deleteDoc(doc(db, 'rooms', modalConfig.room.id));
                setModalConfig(null);
                showToast("Session deleted permanently.");
            } else if (modalConfig.type === 'rename') {
                const newId = modalInput.trim().replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();

                if (!newId || newId === modalConfig.room.id) {
                    setModalConfig(null);
                    return;
                }

                const newRef = doc(db, 'rooms', newId);
                const oldRef = doc(db, 'rooms', modalConfig.room.id);

                const snap = await getDoc(newRef);
                if (snap.exists() && snap.data().isPermanent) {
                    setModalError("A permanent session with that exact URL already exists!");
                    setModalLoading(false);
                    return;
                }

                const oldSnap = await getDoc(oldRef);
                if (oldSnap.exists()) {
                    await setDoc(newRef, oldSnap.data());
                    await deleteDoc(oldRef);
                }
                setModalConfig(null);
                showToast(`Session renamed to /${newId}!`);
            } else if (modalConfig.type === 'create') {
                const newId = modalInput.trim() ? modalInput.trim().replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase() : uuidv4();

                const newRef = doc(db, 'rooms', newId);
                const snap = await getDoc(newRef);

                if (snap.exists() && snap.data().isPermanent) {
                    setModalError("A permanent session with that custom URL already exists!");
                    setModalLoading(false);
                    return;
                }

                if (snap.exists()) {
                    await deleteDoc(newRef);
                }

                await setDoc(newRef, {
                    ownerId: user ? user.uid : null,
                    language: 'javascript',
                    isPermanent: !!user,
                    createdAt: Date.now()
                });

                setModalConfig(null);
                navigate(`/${newId}`, { state: { isPermanent: !!user } });
            }
        } catch (err) {
            console.error("Modal action failed:", err);
            setModalError("An error occurred. Please try again.");
        } finally {
            setModalLoading(false);
        }
    };

    const createRoom = () => {
        if (user && userRooms.length >= 20) {
            alert("Maximum limit of 20 permanent rooms reached. Please delete some previously created permanent rooms to create new ones.");
            return;
        }

        setModalConfig({ type: 'create' });
        setModalInput('');
        setModalError('');
    };

    const copyRoomLink = (roomId) => {
        const fullUrl = `${window.location.origin}/${roomId}`;
        navigator.clipboard.writeText(fullUrl);
        showToast("Room URL copied to clipboard!");
    };

    const filteredRooms = userRooms.filter(r =>
        r.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white lg:p-12 p-6 font-sans flex flex-col items-center relative transition-colors duration-300">
            {/* Toast notification */}
            {toastMessage && (
                <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-gray-700/80 text-xs font-semibold flex items-center gap-2">
                    <span className="text-blue-400">✓</span>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Custom Modal */}
            {modalConfig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                            {modalConfig.type === 'delete' ? 'Delete Session' : modalConfig.type === 'create' ? 'Create New Session' : 'Rename URL'}
                        </h2>

                        {modalConfig.type === 'delete' ? (
                            <p className="text-gray-600 dark:text-gray-300 mb-6 font-medium">
                                Are you sure you want to delete the room <span className="text-red-500 dark:text-red-400 font-mono">/{modalConfig.room.id}</span>? This action cannot be undone.
                            </p>
                        ) : (
                            <div className="mb-6">
                                <label className="block text-gray-500 dark:text-gray-400 text-sm mb-2">
                                    {modalConfig.type === 'create' ? 'Session Name / URL slug (optional, letters & numbers)' : 'New URL slug (letters, numbers, hyphens)'}
                                </label>
                                <div className="flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-3">
                                    <span className="text-gray-400 dark:text-gray-500 mr-1">/</span>
                                    <input
                                        type="text"
                                        value={modalInput}
                                        onChange={(e) => setModalInput(e.target.value)}
                                        className="bg-transparent text-gray-900 dark:text-white w-full focus:outline-none placeholder-gray-400 dark:placeholder-gray-600 font-mono text-sm"
                                        placeholder={modalConfig.type === 'create' ? 'leave blank for random ID' : 'custom-room-name'}
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleModalSubmit()}
                                    />
                                </div>
                                {modalError && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{modalError}</p>}
                            </div>
                        )}

                        <div className="flex gap-3 justify-end items-center mt-2">
                            <button
                                onClick={() => setModalConfig(null)}
                                disabled={modalLoading}
                                title="Cancel this action"
                                className="px-5 py-2.5 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleModalSubmit}
                                disabled={modalLoading}
                                title="Confirm this action"
                                className={`px-5 py-2.5 rounded-lg font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-2 text-sm ${modalConfig.type === 'delete' ? 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {modalLoading ? 'Processing...' : modalConfig.type === 'delete' ? 'Delete' : modalConfig.type === 'create' ? 'Create Session' : 'Save URL'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`max-w-5xl w-full transition-opacity duration-200 ${modalConfig ? 'opacity-30 blur-sm pointer-events-none' : ''}`}>
                {/* Header */}
                <header className="flex flex-col sm:flex-row justify-between items-center mb-14 gap-6">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">⚡</span>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Codeplaces
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsDark(!isDark)}
                            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            className="p-2 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-amber-500 transition-colors shadow-sm flex items-center justify-center w-10 h-10"
                        >
                            {isDark ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            ) : (
                                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                            )}
                        </button>

                        {user ? (
                            <div className="flex items-center gap-3">
                                {user.photoURL && (
                                    <img src={user.photoURL} alt={user.displayName} className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-600" />
                                )}
                                <span className="text-gray-700 dark:text-gray-200 hidden md:inline font-semibold text-sm">
                                    {user.displayName}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    title="Sign out of your account"
                                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl transition-colors text-sm font-semibold shadow-sm"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleLogin}
                                title="Sign in to create permanent sessions"
                                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl transition-colors shadow-sm font-semibold flex items-center gap-2 text-sm"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Login with Google
                            </button>
                        )}
                    </div>
                </header>

                <main className={`w-full ${user && userRooms.length > 0 ? 'flex flex-col xl:flex-row gap-8 xl:gap-12 items-start' : 'flex flex-col items-center gap-14'}`}>
                    <div className={`${user && userRooms.length > 0 ? 'flex-1 min-w-0 w-full flex flex-col gap-12' : 'w-full flex flex-col items-center gap-12'}`}>
                        {/* Hero Section */}
                        <div className={`max-w-2xl flex flex-col ${user && userRooms.length > 0 ? 'items-start text-left' : 'items-center text-center'}`}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-6">
                                <span>🚀</span>
                                <span>Real-time Multi-User Collaboration & Code Runner</span>
                            </div>

                            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight text-gray-900 dark:text-white">
                                Code Together, <br />
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">Execute Instantly.</span>
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 text-base md:text-lg leading-relaxed">
                                Share and edit code in real-time with remote cursors, teacher mode, live HTML preview, and built-in multi-language execution.
                            </p>

                            {/* Status Pill */}
                            {user ? (
                                <span className={`text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2 mb-8 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 rounded-full border border-emerald-200 dark:border-emerald-800/50 text-sm ${user && userRooms.length > 0 ? 'justify-start' : 'justify-center'}`}>
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Logged in: your sessions are saved permanently ({userRooms.length}/20 used)
                                </span>
                            ) : (
                                <span className={`text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2 mb-8 bg-amber-50 dark:bg-amber-950/40 px-4 py-2 rounded-full border border-amber-200 dark:border-amber-800/50 text-sm ${user && userRooms.length > 0 ? 'justify-start' : 'justify-center'}`}>
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Anonymous sessions expire after 24 hours. Sign in to keep them forever.
                                </span>
                            )}

                            {/* Action Buttons & Quick Join */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full max-w-md">
                                <button
                                    onClick={createRoom}
                                    title="Generate a brand new collaborative code session"
                                    className={`px-8 py-3.5 rounded-xl font-bold text-base shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${user && userRooms.length >= 20
                                        ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400 border border-gray-400 dark:border-gray-600'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 dark:shadow-blue-900/30'
                                        }`}
                                >
                                    <span>+</span>
                                    <span>Create New Session</span>
                                </button>

                                <form onSubmit={handleQuickJoin} className="flex-1 flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50">
                                    <input
                                        type="text"
                                        value={joinInput}
                                        onChange={(e) => setJoinInput(e.target.value)}
                                        placeholder="Enter room ID..."
                                        className="w-full bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 font-mono"
                                    />
                                    <button
                                        type="submit"
                                        title="Join room"
                                        className="px-3.5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold transition-colors shrink-0"
                                    >
                                        Join
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Feature Cards */}
                        <div className="w-full">
                            <h3 className={`text-2xl font-bold mb-6 flex items-center gap-2.5 text-gray-900 dark:text-white ${user && userRooms.length > 0 ? 'justify-start' : 'justify-center'}`}>
                                <span>✨</span> Features & Capabilities
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="bg-white dark:bg-gray-800/60 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm flex flex-col items-start">
                                    <span className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg mb-4">1</span>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1.5">Live CRDT Collaboration</h4>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                                        Multi-user simultaneous editing with conflict-free CRDT sync, remote cursor visibility, and color-coded collaborator badges.
                                    </p>
                                </div>

                                <div className="bg-white dark:bg-gray-800/60 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm flex flex-col items-start">
                                    <span className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg mb-4">2</span>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1.5">Code Execution & Live Preview</h4>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                                        Execute Python, C++, Java, JS, and TypeScript with stdin support. Instant sandboxed iframe preview for HTML/CSS.
                                    </p>
                                </div>

                                <div className="bg-white dark:bg-gray-800/60 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm flex flex-col items-start">
                                    <span className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg mb-4">3</span>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1.5">Teacher & Classroom Mode</h4>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                                        Claim the Teacher role to lock editor permissions so students can follow along in a distraction-free read-only view.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Permanent Rooms Sidebar for Logged in Users */}
                    {user && userRooms.length > 0 && (
                        <div className="w-full xl:w-[440px] shrink-0 xl:sticky xl:top-8 bg-white dark:bg-gray-800/60 p-6 rounded-3xl border border-gray-200 dark:border-gray-700/60 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                    <span>📋</span> Your Permanent Rooms
                                </h3>
                                <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
                                    {userRooms.length}/20
                                </span>
                            </div>

                            {/* Search Filter */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Filter rooms..."
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                />
                            </div>

                            {/* Rooms List */}
                            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                                {filteredRooms.length > 0 ? (
                                    filteredRooms.map(room => (
                                        <div key={room.id} className="bg-gray-50 dark:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-700/70 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col gap-3 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-900 dark:text-white font-mono font-bold text-sm truncate max-w-[240px]" title={room.id}>
                                                    /{room.id}
                                                </span>
                                                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                                    {room.createdAt ? new Date(room.createdAt).toLocaleDateString() : 'Active'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 pt-1 border-t border-gray-200 dark:border-gray-600/50">
                                                <button
                                                    onClick={() => navigate(`/${room.id}`)}
                                                    title="Open session in editor"
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors text-center"
                                                >
                                                    Open
                                                </button>
                                                <button
                                                    onClick={() => copyRoomLink(room.id)}
                                                    title="Copy room link to clipboard"
                                                    className="p-1.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg text-xs transition-colors"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                                </button>
                                                <button
                                                    onClick={() => openRenameModal(room)}
                                                    title="Rename custom room URL"
                                                    className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                                >
                                                    Rename
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(room)}
                                                    title="Delete session permanently"
                                                    className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800/60 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-400 text-xs italic py-4 text-center">
                                        No rooms found matching "{searchQuery}"
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
