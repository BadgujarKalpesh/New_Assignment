require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const telemetryRoutes = require('./routes/telemetryRoutes');
const { setIo } = require('./controllers/telemetryController');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io Setup
const io = new Server(server, {
    cors: { 
        origin: process.env.FRONTEND_URL || "http://localhost:3000", 
        methods: ["GET", "POST"] 
    }
});

// Pass IO instance to controller so it can emit events
setIo(io);

// Routes
app.use('/', telemetryRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Backend Server running on port ${PORT}`);
});