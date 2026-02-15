const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { YSocketIO } = require("y-socket.io/dist/server");
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors());

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
// const { createClient } = require('redis');
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
    const { v4: uuidv4 } = require('uuid');
    res.json({ roomId: uuidv4() });
});

const PORT = 3001;

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
