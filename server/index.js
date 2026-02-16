import express from 'express';
import { createServer } from 'http';
import { Server } from "socket.io";
import { YSocketIO } from "y-socket.io/dist/server";
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

app.use(cors());

// Serve static files from the React app
// Assuming 'dist' is in the project root, which is one level up from 'server'
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity in dev
        methods: ["GET", "POST"]
    }
});

// Initialize YSocketIO
const ysocketio = new YSocketIO(io);
ysocketio.initialize();

// Redis Persistence (Optional but recommended)
// In a real production app, we would use y-redis or save to DB on update
// For this demo, we can just keep it in memory or add simple logging
// To add Redis:
// import { createClient } from 'redis';
// const client = createClient();
// client.on('error', (err) => console.log('Redis Client Error', err));
// await client.connect();

// Setup document updates if needed for persistence
ysocketio.on('document-update', async (docName, update) => {
    // Here we would save 'update' to Redis or MongoDB associated with 'docName'
    console.log(`Document ${docName} updated`);
    // Example: await client.set(docName, update);
});

// Create a simple API to generate room IDs
app.get('/api/new-room', (req, res) => {
    res.json({ roomId: uuidv4() });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
