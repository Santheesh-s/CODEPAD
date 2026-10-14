import { useState, useEffect, useRef } from 'react';

export default function OutputPanel({
    isOpen,
    onClose,
    language,
    code,
    isRunning,
    outputResult,
    stdin,
    setStdin,
    activeTab,
    setActiveTab,
    onRun
}) {
    const [copied, setCopied] = useState(false);
    const [previewKey, setPreviewKey] = useState(0);
    const iframeRef = useRef(null);

    // Auto-select preview tab when language is html
    useEffect(() => {
        if (language === 'html' && activeTab !== 'preview') {
            setActiveTab('preview');
        }
    }, [language, activeTab, setActiveTab]);

    const handleCopyOutput = async () => {
        const text = outputResult?.stdout || outputResult?.stderr || '';
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy output:', err);
        }
    };

    const handleRefreshPreview = () => {
        setPreviewKey(prev => prev + 1);
    };

    const handleOpenPreviewNewTab = () => {
        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    if (!isOpen) return null;

    const isPreviewCapable = ['html', 'javascript', 'css'].includes(language);

    return (
        <div className="flex flex-col bg-gray-900 border-t border-gray-700/80 text-white shadow-2xl transition-all duration-200 h-64 md:h-72 w-full shrink-0 z-20">
            {/* Panel Header & Tabs */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-950/80 border-b border-gray-800 text-xs font-semibold select-none">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('output')}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'output'
                            ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 shadow-sm'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                            }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Terminal Output
                        {outputResult && !isRunning && (
                            <span className={`w-2 h-2 rounded-full ${outputResult.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('input')}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'input'
                            ? 'bg-purple-600/30 text-purple-400 border border-purple-500/40 shadow-sm'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                            }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Standard Input (stdin)
                        {stdin && <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>}
                    </button>

                    {isPreviewCapable && (
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'preview'
                                ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 shadow-sm'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                                }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                            Web Live Preview
                        </button>
                    )}
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3">
                    {activeTab === 'output' && outputResult && (
                        <div className="hidden sm:flex items-center gap-3 text-gray-400 text-[11px]">
                            {outputResult.time && <span>⏱️ {outputResult.time}</span>}
                            {outputResult.memory && outputResult.memory !== 'N/A' && <span>💾 {outputResult.memory}</span>}
                            <button
                                onClick={handleCopyOutput}
                                title="Copy output to clipboard"
                                className="text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-800/80 hover:bg-gray-700 transition-colors"
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'preview' && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefreshPreview}
                                title="Refresh Preview"
                                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                            </button>
                            <button
                                onClick={handleOpenPreviewNewTab}
                                title="Open Preview in New Tab"
                                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                </svg>
                            </button>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        title="Close panel"
                        className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-800 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-auto bg-gray-900/95 font-mono text-xs p-3">
                {isRunning ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Executing code...</span>
                    </div>
                ) : activeTab === 'output' ? (
                    outputResult ? (
                        <div className="space-y-2 select-text">
                            {outputResult.stderr && (
                                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 whitespace-pre-wrap">
                                    <div className="font-semibold text-red-300 mb-1 flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        Error / Stderr:
                                    </div>
                                    {outputResult.stderr}
                                </div>
                            )}

                            {outputResult.stdout && (
                                <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                                    {outputResult.stdout}
                                </div>
                            )}

                            {!outputResult.stdout && !outputResult.stderr && (
                                <span className="text-gray-500 italic">No output produced.</span>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                            <span>Press <kbd className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300 font-semibold">Ctrl+Enter</kbd> or click <button onClick={onRun} className="text-blue-400 hover:text-blue-300 font-bold underline">Run</button> to execute code.</span>
                        </div>
                    )
                ) : activeTab === 'input' ? (
                    <div className="h-full flex flex-col">
                        <label className="text-gray-400 mb-1.5 text-[11px]">
                            Custom Standard Input (passed to program via stdin):
                        </label>
                        <textarea
                            value={stdin}
                            onChange={(e) => setStdin(e.target.value)}
                            placeholder="Enter input values here (one per line)..."
                            className="flex-1 w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-purple-500 font-mono resize-none"
                        />
                    </div>
                ) : activeTab === 'preview' ? (
                    <div className="h-full w-full bg-white rounded-lg overflow-hidden border border-gray-700">
                        <iframe
                            key={previewKey}
                            ref={iframeRef}
                            srcDoc={
                                language === 'html'
                                    ? code
                                    : language === 'css'
                                        ? `<!DOCTYPE html><html><head><style>${code}</style></head><body><div class="glass-card"><h1>CSS Preview</h1><p>Your styles are active!</p></div></body></html>`
                                        : `<!DOCTYPE html><html><head><title>JS Preview</title></head><body><div id="output"></div><script>try { ${code} } catch(e) { document.body.innerHTML = '<pre style="color:red">'+e+'</pre>'; }</script></body></html>`
                            }
                            title="Code Preview"
                            sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups"
                            className="w-full h-full border-0"
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
}
