import { useState, useEffect, useRef, useMemo } from 'react';

export default function WebPreview({
    code = '',
    language = 'html',
    isOpen = true,
    onClose = () => { },
    editorRef = null
}) {
    const [debouncedCode, setDebouncedCode] = useState(code);
    const [reloadKey, setReloadKey] = useState(0);
    const [deviceMode, setDeviceMode] = useState('full'); // 'full' | 'tablet' | 'mobile'
    const [consoleLogs, setConsoleLogs] = useState([]);
    const [isConsoleOpen, setIsConsoleOpen] = useState(false);
    const iframeRef = useRef(null);

    // Debounce code updates so typing does not cause the iframe to flash on every keystroke
    useEffect(() => {
        const timer = setTimeout(() => {
            // Prefer reading directly from editor instance if available to avoid any state delay
            const latest = editorRef?.current?.getValue?.() ?? code;
            setDebouncedCode(latest);
        }, 300);

        return () => clearTimeout(timer);
    }, [code, editorRef]);

    // Listen for console logs forwarded from the preview iframe
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'CODEPLACES_PREVIEW_LOG') {
                const { logType, message } = event.data;
                setConsoleLogs(prev => [
                    ...prev.slice(-99), // keep last 100 logs
                    { id: Date.now() + Math.random(), type: logType, message }
                ]);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Construct the complete, executable HTML document
    const assembledHtml = useMemo(() => {
        const raw = debouncedCode || '';

        // Logger script injected into preview to intercept and forward console messages
        const loggerScript = `
<script>
  (function() {
    function serialize(arg) {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch(e) {
          return String(arg);
        }
      }
      return String(arg);
    }

    function forward(type, args) {
      try {
        var msg = Array.prototype.slice.call(args).map(serialize).join(' ');
        window.parent.postMessage({
          type: 'CODEPLACES_PREVIEW_LOG',
          logType: type,
          message: msg
        }, '*');
      } catch(e) {}
    }

    var _log = console.log;
    var _warn = console.warn;
    var _error = console.error;
    var _info = console.info;

    console.log = function() { _log.apply(console, arguments); forward('log', arguments); };
    console.warn = function() { _warn.apply(console, arguments); forward('warn', arguments); };
    console.error = function() { _error.apply(console, arguments); forward('error', arguments); };
    console.info = function() { _info.apply(console, arguments); forward('info', arguments); };

    window.onerror = function(message, source, lineno, colno, error) {
      var errStr = message + (lineno ? ' (Line ' + lineno + ')' : '');
      forward('error', [errStr]);
      return false;
    };
  })();
</script>
`;

        // Detect if content is HTML (either by selected language or by presence of HTML tags)
        const isHtml = language === 'html' ||
            /<\s*(!doctype|html|head|body|div|p|h[1-6]|span|button|form|input|style|script|main|section|header|footer|nav|article|table|ul|ol|li|img|a|svg|link|meta)/i.test(raw);

        if (isHtml) {
            const hasDocType = /<!doctype/i.test(raw);
            const hasHtmlTag = /<html/i.test(raw);
            const hasHeadTag = /<head[^>]*>/i.test(raw);
            const hasBodyTag = /<body[^>]*>/i.test(raw);

            // Full document with html/doctype/body
            if (hasDocType || hasHtmlTag || hasBodyTag) {
                if (hasHeadTag) {
                    return raw.replace(/<head[^>]*>/i, (match) => `${match}${loggerScript}`);
                }
                if (hasHtmlTag) {
                    return raw.replace(/<html[^>]*>/i, (match) => `${match}<head>${loggerScript}</head>`);
                }
                if (hasBodyTag) {
                    return `<head>${loggerScript}</head>${raw}`;
                }
                return `${loggerScript}${raw}`;
            }

            // HTML fragment (e.g. <p>hi</p> or <button>Click</button>)
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  ${loggerScript}
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 16px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  ${raw}
</body>
</html>`;
        }

        if (language === 'css') {
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Preview</title>
  ${loggerScript}
  <style>
    ${raw}
  </style>
</head>
<body>
  <div style="padding: 24px; max-width: 500px; margin: 40px auto; text-align: center; border: 1px solid #cbd5e1; border-radius: 12px; font-family: system-ui, sans-serif;">
    <h2 style="margin-top:0;">CSS Live Preview</h2>
    <p>Your custom CSS rules are loaded.</p>
    <button style="padding: 8px 16px; border-radius: 6px; cursor: pointer;">Sample Button</button>
  </div>
</body>
</html>`;
        }

        // Pure JavaScript (DOM & Execution testbench)
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JavaScript Preview</title>
  ${loggerScript}
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 16px;
      margin: 0;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="app"></div>
  <script>
    try {
      ${raw}
    } catch(err) {
      console.error(err.toString());
    }
  </script>
</body>
</html>`;
    }, [debouncedCode, language]);

    const handleForceRefresh = () => {
        const latest = editorRef?.current?.getValue?.() ?? code;
        setDebouncedCode(latest);
        setReloadKey(prev => prev + 1);
        setConsoleLogs([]);
    };

    const handleOpenInNewTab = () => {
        const content = editorRef?.current?.getValue?.() ?? debouncedCode;
        const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="flex flex-col h-full w-full bg-gray-100 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700/80 transition-colors select-none">
            {/* Top Browser Bar */}
            <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700/80 text-xs gap-2 shrink-0">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-gray-700 dark:text-gray-300 mr-2 shrink-0">
                        <span className="text-emerald-500">●</span>
                        <span>Live Web Preview</span>
                    </span>

                    {/* Fake Browser Address Bar */}
                    <div className="hidden sm:flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 dark:text-gray-400 font-mono flex-1 max-w-xs truncate">
                        <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                        </svg>
                        <span className="truncate">preview://localhost</span>
                    </div>
                </div>

                {/* Device Mode Switcher */}
                <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-700/60 p-0.5 rounded-lg border border-gray-200 dark:border-gray-600 shrink-0">
                    <button
                        onClick={() => setDeviceMode('full')}
                        title="Responsive Full Width"
                        className={`p-1 rounded ${deviceMode === 'full' ? 'bg-white dark:bg-gray-800 shadow-xs text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    </button>
                    <button
                        onClick={() => setDeviceMode('tablet')}
                        title="Tablet View (768px)"
                        className={`p-1 rounded ${deviceMode === 'tablet' ? 'bg-white dark:bg-gray-800 shadow-xs text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                    </button>
                    <button
                        onClick={() => setDeviceMode('mobile')}
                        title="Mobile View (375px)"
                        className={`p-1 rounded ${deviceMode === 'mobile' ? 'bg-white dark:bg-gray-800 shadow-xs text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                    </button>
                </div>

                {/* Action buttons: Refresh, Console toggle, Pop out, Close */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={handleForceRefresh}
                        title="Reload Preview"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                    </button>

                    <button
                        onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                        title="Toggle Preview Console"
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${isConsoleOpen
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        <span>Console</span>
                        {consoleLogs.length > 0 && (
                            <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                                {consoleLogs.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={handleOpenInNewTab}
                        title="Open Preview in a New Browser Tab"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                    </button>

                    <button
                        onClick={onClose}
                        title="Close Preview Panel"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main Iframe Canvas */}
            <div className="flex-1 overflow-auto bg-gray-200/70 dark:bg-gray-950 flex flex-col items-center justify-start p-2 sm:p-4 relative">
                <div
                    className={`h-full transition-all duration-300 flex flex-col bg-white shadow-xl rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 ${deviceMode === 'tablet'
                        ? 'w-[768px] max-w-full'
                        : deviceMode === 'mobile'
                            ? 'w-[375px] max-w-full'
                            : 'w-full'
                        }`}
                >
                    <iframe
                        key={reloadKey}
                        ref={iframeRef}
                        srcDoc={assembledHtml}
                        title="Live Web Preview"
                        sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups"
                        className="w-full flex-1 border-0 bg-white"
                    />
                </div>
            </div>

            {/* Collapsible Preview Console Drawer */}
            {isConsoleOpen && (
                <div className="h-44 bg-gray-950 border-t border-gray-800 text-gray-200 font-mono text-xs flex flex-col shrink-0 select-text">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800 text-[11px] font-semibold text-gray-400">
                        <span>Preview Console ({consoleLogs.length} messages)</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setConsoleLogs([])}
                                className="hover:text-white px-2 py-0.5 rounded bg-gray-800 transition-colors text-[10px]"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setIsConsoleOpen(false)}
                                className="hover:text-white p-0.5"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-2 space-y-1">
                        {consoleLogs.length > 0 ? (
                            consoleLogs.map((item) => (
                                <div
                                    key={item.id}
                                    className={`px-2 py-1 rounded text-[11px] leading-relaxed break-all ${item.type === 'error'
                                        ? 'bg-red-950/40 text-red-400 border-l-2 border-red-500'
                                        : item.type === 'warn'
                                            ? 'bg-amber-950/40 text-amber-300 border-l-2 border-amber-500'
                                            : 'text-gray-300'
                                        }`}
                                >
                                    <span className="text-gray-500 mr-2 select-none">
                                        {item.type === 'error' ? '✖' : item.type === 'warn' ? '▲' : '›'}
                                    </span>
                                    <span>{item.message}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-500 italic p-2 text-center">
                                Console is empty. Any console.log() or JavaScript errors in your code will appear here.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
