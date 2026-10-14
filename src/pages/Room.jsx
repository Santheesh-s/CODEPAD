import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, setDoc, getDoc, deleteField } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import { db, auth } from '../firebase';
import CodeEditor from '../components/CodeEditor';
import Toolbar from '../components/Toolbar';
import OutputPanel from '../components/OutputPanel';
import WebPreview from '../components/WebPreview';
import StatusBar from '../components/StatusBar';
import { executeCode } from '../utils/codeRunner';
import { TEMPLATES, FILE_EXTENSIONS } from '../utils/templates';

export default function Room() {
    const { roomId } = useParams();
    const location = useLocation();

    const [user, setUser] = useState(null);

    const [userId] = useState(() => {
        let id = localStorage.getItem('codeplaces_userId');
        if (!id) {
            id = uuidv4();
            localStorage.setItem('codeplaces_userId', id);
        }
        return id;
    });

    const [teacherId, setTeacherId] = useState(null);
    const [language, setLanguage] = useState('text');
    const [isPermanentRoom, setIsPermanentRoom] = useState(false);
    const [expiresAt, setExpiresAt] = useState(null);

    // Editor settings
    const [fontSize, setFontSize] = useState(() => {
        const saved = localStorage.getItem('codeplaces_fontSize');
        return saved ? Number(saved) : 14;
    });

    const [lineWrapping, setLineWrapping] = useState(() => {
        const saved = localStorage.getItem('codeplaces_lineWrapping');
        return saved !== null ? saved === 'true' : true;
    });

    // Side-by-side web preview state
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Terminal output & execution states
    const [isOutputOpen, setIsOutputOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('output');
    const [isRunning, setIsRunning] = useState(false);
    const [outputResult, setOutputResult] = useState(null);
    const [stdin, setStdin] = useState('');
    const [currentCode, setCurrentCode] = useState('');

    // Cursor & stats state
    const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
    const [editorStats, setEditorStats] = useState({ lines: 1, chars: 0, words: 0, selected: 0 });
    const [collaborators, setCollaborators] = useState([]);

    // Toast notification state
    const [toastMessage, setToastMessage] = useState('');

    // Reference to the CodeMirror instance
    const editorRef = useRef(null);

    const hasTeacher = !!teacherId;
    const isTeacher = teacherId === userId;
    const canEdit = !hasTeacher || isTeacher;

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    // Track user authentication
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Save editor settings to localStorage
    useEffect(() => {
        localStorage.setItem('codeplaces_fontSize', String(fontSize));
    }, [fontSize]);

    useEffect(() => {
        localStorage.setItem('codeplaces_lineWrapping', String(lineWrapping));
    }, [lineWrapping]);

    // Room synchronization with Firebase Firestore
    useEffect(() => {
        if (!roomId) return;

        const roomDocRef = doc(db, 'rooms', roomId);

        // Initial setup for expiration if it doesn't exist
        getDoc(roomDocRef).then((docSnap) => {
            const isCreatorPermanent = location.state?.isPermanent;

            if (!docSnap.exists() || (docSnap.data().expiresAt === undefined && !docSnap.data().isPermanent)) {
                const dataToSet = {};
                if (isCreatorPermanent) {
                    dataToSet.isPermanent = true;
                } else {
                    // Set expiration to 24 hours from now
                    const exp = Date.now() + 24 * 60 * 60 * 1000;
                    dataToSet.expiresAt = exp;
                    setExpiresAt(exp);
                }
                setDoc(roomDocRef, dataToSet, { merge: true }).catch(console.error);
            }
        });

        // Realtime Firestore synchronization
        const unsubscribe = onSnapshot(roomDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.language) {
                    setLanguage(data.language);
                    if (data.language === 'html') {
                        setIsPreviewOpen(true);
                    }
                }
                if (data.isPermanent) {
                    setIsPermanentRoom(true);
                    setExpiresAt(null);
                } else if (data.expiresAt) {
                    setExpiresAt(data.expiresAt);
                }

                if ('teacherId' in data && data.teacherId) {
                    setTeacherId(data.teacherId);
                } else {
                    setTeacherId(null);
                }
            }
        });

        return () => {
            unsubscribe();
        };
    }, [roomId, location.state]);

    const handleClaimTeacher = async () => {
        if (!roomId) return;
        const roomDocRef = doc(db, 'rooms', roomId);

        try {
            const docSnap = await getDoc(roomDocRef);
            if (!docSnap.exists()) {
                await setDoc(roomDocRef, { teacherId: userId }, { merge: true });
            } else {
                const data = docSnap.data();
                if (!data.teacherId) {
                    await updateDoc(roomDocRef, { teacherId: userId });
                }
            }
            showToast("You are now the Teacher! Editing is locked for other participants.");
        } catch (err) {
            console.error("Failed to claim teacher role:", err);
            showToast("Failed to claim teacher role. Please try again.");
        }
    };

    const handleResignTeacher = async () => {
        if (!roomId || !isTeacher) return;
        const roomDocRef = doc(db, 'rooms', roomId);

        try {
            await updateDoc(roomDocRef, { teacherId: deleteField() });
            setTeacherId(null);
            showToast("Resigned Teacher role. All participants can now edit.");
        } catch (err) {
            console.error("Failed to resign teacher role:", err);
        }
    };

    const handleLanguageChange = (newLanguage) => {
        if (!canEdit) return;

        setLanguage(newLanguage);
        if (newLanguage === 'html') {
            setIsPreviewOpen(true);
        }

        const roomDocRef = doc(db, 'rooms', roomId);
        setDoc(roomDocRef, { language: newLanguage }, { merge: true }).catch(err => {
            console.error("Failed to sync language:", err);
        });
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        showToast("URL copied to clipboard! Anyone with this link can collaborate.");
    };

    const handleCopyAll = async () => {
        const content = editorRef.current?.getValue?.() ?? '';
        try {
            await navigator.clipboard.writeText(content);
            showToast("All code copied to clipboard!");
        } catch (err) {
            console.error('Failed to copy content:', err);
        }
    };

    const handleDownload = () => {
        const content = editorRef.current?.getValue?.() ?? '';
        const ext = FILE_EXTENSIONS[language] || 'txt';
        const filename = `${roomId}.${ext}`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`Downloaded ${filename}!`);
    };

    const handleInsertTemplate = () => {
        if (!canEdit) return;
        const template = TEMPLATES[language];
        if (!template) return;

        const currentVal = editorRef.current?.getValue?.() || '';
        if (currentVal.trim().length > 0) {
            if (!window.confirm("Replace current editor contents with starter template?")) {
                return;
            }
        }
        editorRef.current?.insertTemplate?.(template);
        if (language === 'html' || language === 'css') {
            setIsPreviewOpen(true);
        }
        showToast(`Inserted starter template for ${language}!`);
    };

    // Run Code Dispatch
    const handleRunCode = useCallback(async () => {
        const code = editorRef.current?.getValue?.() ?? currentCode;

        if (['html', 'css'].includes(language)) {
            setIsPreviewOpen(true);
            return;
        }

        setIsOutputOpen(true);
        setActiveTab('output');
        setIsRunning(true);
        setOutputResult(null);

        try {
            const res = await executeCode(language, code, stdin);
            setOutputResult(res);
        } catch (err) {
            setOutputResult({
                success: false,
                stdout: '',
                stderr: err.message || 'Execution error',
                time: '0.000s',
                memory: 'N/A',
                status: 'Error'
            });
        } finally {
            setIsRunning(false);
        }
    }, [language, currentCode, stdin]);

    const handleTogglePreview = () => {
        setIsPreviewOpen(prev => !prev);
    };

    const handleCodeChange = (newCode) => {
        setCurrentCode(newCode);

        // Auto-switch to HTML mode if user begins writing full HTML document
        if (language !== 'html' && canEdit) {
            const trimmed = newCode.trim();
            if (
                trimmed.startsWith('<!DOCTYPE html') ||
                trimmed.startsWith('<!doctype html') ||
                trimmed.startsWith('<html') ||
                /^\s*<(!DOCTYPE\s+html|html|body|head)/i.test(newCode)
            ) {
                handleLanguageChange('html');
                setIsPreviewOpen(true);
            }
        }
    };

    const handleClaimRoom = async () => {
        if (!user || !roomId) return;
        try {
            const roomDocRef = doc(db, 'rooms', roomId);
            await setDoc(roomDocRef, {
                ownerId: user.uid,
                isPermanent: true,
                expiresAt: deleteField()
            }, { merge: true });
            setIsPermanentRoom(true);
            setExpiresAt(null);
            showToast("Saved room to your Google account! This room will never expire.");
        } catch (err) {
            console.error("Failed to claim room:", err);
            showToast("Failed to save room. Please try again.");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden relative">
            {/* Toast notification */}
            {toastMessage && (
                <div className="fixed top-16 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-gray-700/80 text-xs font-semibold flex items-center gap-2 animate-bounce">
                    <span className="text-blue-400">ℹ️</span>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Teacher Announcement Banner */}
            {hasTeacher && (
                <div className={`px-4 py-1.5 text-xs font-medium flex items-center justify-between transition-colors z-20 ${isTeacher
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-amber-500 text-gray-950 font-semibold'
                    }`}>
                    <div className="flex items-center gap-2">
                        <span>🎓</span>
                        <span>
                            {isTeacher
                                ? 'Teacher Mode is Active: You have exclusive editing rights in this session.'
                                : 'Teacher Mode is Active: You are in read-only student mode.'}
                        </span>
                    </div>
                    {isTeacher && (
                        <button
                            onClick={handleResignTeacher}
                            className="text-[11px] underline hover:no-underline font-bold"
                        >
                            Resign Role
                        </button>
                    )}
                </div>
            )}

            {/* Top Toolbar */}
            <Toolbar
                language={language}
                setLanguage={handleLanguageChange}
                onShare={handleShare}
                onCopyAll={handleCopyAll}
                onDownload={handleDownload}
                onInsertTemplate={handleInsertTemplate}
                onRun={handleRunCode}
                isRunning={isRunning}
                onTogglePreview={handleTogglePreview}
                isPreviewOpen={isPreviewOpen}
                fontSize={fontSize}
                setFontSize={setFontSize}
                lineWrapping={lineWrapping}
                setLineWrapping={setLineWrapping}
                collaborators={collaborators}
                isTeacher={isTeacher}
                hasTeacher={hasTeacher}
                canEdit={canEdit}
                onClaimTeacher={handleClaimTeacher}
                onResignTeacher={handleResignTeacher}
                isPermanentRoom={isPermanentRoom}
                onClaimRoom={handleClaimRoom}
            />

            {/* Main Area: CodeMirror on Left, WebPreview on Right (Side-by-side in same tab!) */}
            <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
                <div className="flex-1 flex flex-row min-h-0 relative overflow-hidden">
                    {/* Left Pane: Code Editor */}
                    <div className={`h-full overflow-hidden relative transition-all duration-200 ${isPreviewOpen
                        ? 'w-full md:w-1/2 border-r border-gray-200 dark:border-gray-700/80'
                        : 'w-full'
                        }`}>
                        <CodeEditor
                            roomId={roomId}
                            language={language}
                            canEdit={canEdit}
                            editorRef={editorRef}
                            fontSize={fontSize}
                            lineWrapping={lineWrapping}
                            user={user}
                            onCollaboratorsChange={setCollaborators}
                            onCursorChange={({ cursorPos, stats }) => {
                                setCursorPos(cursorPos);
                                setEditorStats(stats);
                            }}
                            onCodeChange={handleCodeChange}
                            onRun={handleRunCode}
                        />
                    </div>

                    {/* Right Pane: Live Web Preview (Desktop Split View) */}
                    {isPreviewOpen && (
                        <div className="hidden md:flex md:w-1/2 h-full overflow-hidden relative">
                            <WebPreview
                                code={currentCode}
                                language={language}
                                isOpen={isPreviewOpen}
                                onClose={() => setIsPreviewOpen(false)}
                                editorRef={editorRef}
                            />
                        </div>
                    )}

                    {/* Mobile Fullscreen Live Web Preview Overlay */}
                    {isPreviewOpen && (
                        <div className="flex md:hidden w-full h-full overflow-hidden absolute inset-0 z-20 bg-white dark:bg-gray-900">
                            <WebPreview
                                code={currentCode}
                                language={language}
                                isOpen={isPreviewOpen}
                                onClose={() => setIsPreviewOpen(false)}
                                editorRef={editorRef}
                            />
                        </div>
                    )}
                </div>

                {/* Bottom Output / Console Panel (for Python, C++, Java, JS, Stdin) */}
                <OutputPanel
                    isOpen={isOutputOpen}
                    onClose={() => setIsOutputOpen(false)}
                    language={language}
                    code={currentCode}
                    isRunning={isRunning}
                    outputResult={outputResult}
                    stdin={stdin}
                    setStdin={setStdin}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onRun={handleRunCode}
                />
            </div>

            {/* Bottom Status Bar */}
            <StatusBar
                cursorPos={cursorPos}
                stats={editorStats}
                language={language}
                fontSize={fontSize}
                lineWrapping={lineWrapping}
                isPermanentRoom={isPermanentRoom}
                expiresAt={expiresAt}
                hasTeacher={hasTeacher}
                isTeacher={isTeacher}
                collaboratorsCount={collaborators.length || 1}
                onClaimRoom={handleClaimRoom}
                isLoggedIn={!!user}
            />
        </div>
    );
}
