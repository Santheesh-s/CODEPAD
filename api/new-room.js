import { v4 as uuidv4 } from 'uuid';

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

export function setCorsHeaders(req, res) {
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

export default function handler(req, res) {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    try {
        const querySlug = req.query?.slug;
        let bodySlug;
        if (req.body) {
            try {
                const parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
                bodySlug = parsed?.slug;
            } catch {
                bodySlug = null;
            }
        }

        const customSlug = querySlug || bodySlug;

        let roomId;
        if (customSlug && typeof customSlug === 'string' && customSlug.trim()) {
            roomId = customSlug.trim().replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
        } else {
            roomId = uuidv4();
        }

        res.status(200).json({
            success: true,
            roomId,
            createdAt: Date.now()
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message || 'Internal server error'
        });
    }
}
