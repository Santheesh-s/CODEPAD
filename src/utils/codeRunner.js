// Code execution engine supporting JavaScript, Python, TypeScript, C++, and Java

const JUDGE0_LANGUAGE_IDS = {
    python: 71,       // Python (3.8.1)
    cpp: 54,          // C++ (GCC 9.2.0)
    java: 62,         // Java (OpenJDK 13.0.1)
    typescript: 74,   // TypeScript (3.7.4)
    javascript: 63    // JavaScript (Node.js 12.14.0)
};

/**
 * Execute JavaScript in the browser with captured console output
 */
function runClientJavaScript(code) {
    return new Promise((resolve) => {
        const logs = [];
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        const originalInfo = console.info;

        const startTime = performance.now();

        const capture = (type, args) => {
            const formatted = args.map(arg => {
                if (typeof arg === 'object' && arg !== null) {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ');
            logs.push({ type, text: formatted });
        };

        console.log = (...args) => capture('log', args);
        console.warn = (...args) => capture('warn', args);
        console.error = (...args) => capture('error', args);
        console.info = (...args) => capture('info', args);

        let executionError = null;
        let result = undefined;

        try {
            // Run inside Function wrapper
            const runner = new Function(code);
            result = runner();
            if (result !== undefined) {
                capture('result', ['=>', result]);
            }
        } catch (err) {
            executionError = err.toString();
        } finally {
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
            console.info = originalInfo;
        }

        const duration = ((performance.now() - startTime) / 1000).toFixed(3);

        const stdout = logs.map(l => l.text).join('\n');

        resolve({
            success: !executionError,
            stdout: stdout || (executionError ? '' : '(Code executed with no output)'),
            stderr: executionError || '',
            time: `${duration}s`,
            memory: 'Browser Client',
            status: executionError ? 'Runtime Error' : 'Success'
        });
    });
}

/**
 * Execute code via Judge0 CE API
 */
async function runWithJudge0(language, code, stdin = '') {
    const langId = JUDGE0_LANGUAGE_IDS[language];
    if (!langId) {
        throw new Error(`Execution not supported for language: ${language}`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
        const res = await fetch('https://ce.judge0.com/submissions?wait=true', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            signal: controller.signal,
            body: JSON.stringify({
                language_id: langId,
                source_code: code,
                stdin: stdin || ''
            })
        });

        clearTimeout(timeout);

        if (!res.ok) {
            throw new Error(`Execution service returned status ${res.status}`);
        }

        const data = await res.json();

        const stdout = data.stdout || '';
        const stderr = data.stderr || data.compile_output || '';
        const isSuccess = data.status?.id === 3; // 3 = Accepted in Judge0

        return {
            success: isSuccess,
            stdout: stdout || (isSuccess ? '(Execution finished with no output)' : ''),
            stderr: stderr || (isSuccess ? '' : data.status?.description || 'Error during execution'),
            time: data.time ? `${data.time}s` : 'N/A',
            memory: data.memory ? `${(data.memory / 1024).toFixed(1)} MB` : 'N/A',
            status: data.status?.description || (isSuccess ? 'Success' : 'Failed')
        };
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            return {
                success: false,
                stdout: '',
                stderr: 'Execution timed out after 12 seconds.',
                time: '> 12s',
                memory: 'N/A',
                status: 'Time Limit Exceeded'
            };
        }
        throw err;
    }
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function runWithBackendApi(language, code, stdin = '') {
    const res = await fetch(`${API_BASE_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, stdin })
    });
    if (!res.ok) {
        throw new Error(`Backend API returned ${res.status}`);
    }
    return await res.json();
}

/**
 * Main execution dispatch
 */
export async function executeCode(language, code, stdin = '') {
    if (!code || !code.trim()) {
        return {
            success: true,
            stdout: 'No code to execute. Type some code and press Run!',
            stderr: '',
            time: '0.000s',
            memory: '0 MB',
            status: 'Empty'
        };
    }

    // Direct browser execution for JavaScript for instant feedback
    if (language === 'javascript') {
        try {
            return await runClientJavaScript(code);
        } catch {
            // fallback below
        }
    }

    // Try Vercel backend API if API_BASE_URL is provided
    if (API_BASE_URL) {
        try {
            return await runWithBackendApi(language, code, stdin);
        } catch (apiErr) {
            console.warn('Vercel backend execution failed, falling back to direct runner:', apiErr);
        }
    }

    return await runWithJudge0(language, code, stdin);
}
