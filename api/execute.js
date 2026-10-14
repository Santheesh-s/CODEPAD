const JUDGE0_LANGUAGE_IDS = {
    python: 71,       // Python (3.8.1)
    cpp: 54,          // C++ (GCC 9.2.0)
    java: 62,         // Java (OpenJDK 13.0.1)
    typescript: 74,   // TypeScript (3.7.4)
    javascript: 63    // JavaScript (Node.js 12.14.0)
};

const ALLOWED_ORIGINS = new Set([
    'https://codeplaces.web.app',
    'https://codeplaces.web.app/',
    'https://codeplaces.firebaseapp.com',
    'https://codeplaces.firebaseapp.com/',
    'http://localhost:5173',
    'http://localhost:5173/',
    'http://localhost:4173',
    'http://localhost:4173/'
]);

function setCorsHeaders(req, res) {
    const origin = req.headers.origin;
    const cleanOrigin = origin ? origin.replace(/\/$/, '') : '';

    if (origin && (ALLOWED_ORIGINS.has(origin) || ALLOWED_ORIGINS.has(cleanOrigin) || cleanOrigin.endsWith('.web.app') || cleanOrigin.endsWith('.firebaseapp.com'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept');
}

export default async function handler(req, res) {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed. Use POST.' });
        return;
    }

    try {
        let payload = req.body;
        if (typeof payload === 'string') {
            try {
                payload = JSON.parse(payload);
            } catch {
                payload = {};
            }
        }

        const { language, code, stdin } = payload || {};

        if (!code || !code.trim()) {
            res.status(200).json({
                success: true,
                stdout: 'No code provided to execute.',
                stderr: '',
                time: '0.000s',
                memory: '0 MB',
                status: 'Empty'
            });
            return;
        }

        const langId = JUDGE0_LANGUAGE_IDS[language];
        if (!langId) {
            res.status(400).json({
                success: false,
                stdout: '',
                stderr: `Execution not supported for language: ${language}`,
                time: '0.000s',
                memory: '0 MB',
                status: 'Unsupported Language'
            });
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        try {
            const judgeRes = await fetch('https://ce.judge0.com/submissions?wait=true', {
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

            if (!judgeRes.ok) {
                throw new Error(`Judge0 service returned status ${judgeRes.status}`);
            }

            const data = await judgeRes.json();
            const stdout = data.stdout || '';
            const stderr = data.stderr || data.compile_output || '';
            const isSuccess = data.status?.id === 3;

            res.status(200).json({
                success: isSuccess,
                stdout: stdout || (isSuccess ? '(Execution finished with no output)' : ''),
                stderr: stderr || (isSuccess ? '' : data.status?.description || 'Error during execution'),
                time: data.time ? `${data.time}s` : 'N/A',
                memory: data.memory ? `${(data.memory / 1024).toFixed(1)} MB` : 'N/A',
                status: data.status?.description || (isSuccess ? 'Success' : 'Failed')
            });
        } catch (fetchErr) {
            clearTimeout(timeout);
            if (fetchErr.name === 'AbortError') {
                res.status(200).json({
                    success: false,
                    stdout: '',
                    stderr: 'Execution timed out after 12 seconds.',
                    time: '> 12s',
                    memory: 'N/A',
                    status: 'Time Limit Exceeded'
                });
                return;
            }
            throw fetchErr;
        }
    } catch (err) {
        console.error('Execution API error:', err);
        res.status(500).json({
            success: false,
            stdout: '',
            stderr: err.message || 'Internal server error while executing code',
            time: '0.000s',
            memory: 'N/A',
            status: 'Server Error'
        });
    }
}
