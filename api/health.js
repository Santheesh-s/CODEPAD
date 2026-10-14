import process from 'node:process';

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

export default function handler(req, res) {
    const origin = req.headers.origin;
    const cleanOrigin = origin ? origin.replace(/\/$/, '') : '';

    if (origin && (ALLOWED_ORIGINS.has(origin) || ALLOWED_ORIGINS.has(cleanOrigin) || cleanOrigin.endsWith('.web.app') || cleanOrigin.endsWith('.firebaseapp.com'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    res.status(200).json({
        status: 'ok',
        service: 'Codeplaces Backend API',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
}
