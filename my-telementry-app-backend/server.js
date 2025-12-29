const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const pool = require('./db');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

let isRunning = false;
let currentBytePosition = 0; // Tracks where we stopped reading
let fsWatcher = null; // Holds the watcher reference

// --- API ROUTES ---

app.post('/start', (req, res) => {
    if (!isRunning) {
        isRunning = true;
        console.log("Process Started... Watching for changes.");
        
        // 1. Process any existing data first
        processNewData();

        // 2. Start watching the file for NEW additions
        fsWatcher = fs.watch('telemetry_data.txt', (eventType) => {
            if (eventType === 'change' && isRunning) {
                processNewData();
            }
        });

        res.json({ message: "Telemetry started (Watching Mode)" });
    } else {
        res.json({ message: "Already running" });
    }
});

app.post('/stop', (req, res) => {
    isRunning = false;
    if (fsWatcher) {
        fsWatcher.close(); // Stop watching the file
        fsWatcher = null;
    }
    console.log("Process Stopped.");
    res.json({ message: "Telemetry stopped" });
});

app.get('/data', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM telemetry_data ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// --- NEW FILE READING LOGIC ---

function processNewData() {
    // Get the current size of the file
    fs.stat('telemetry_data.txt', (err, stats) => {
        if (err) {
            console.error("Error reading file stats:", err);
            return;
        }

        // If file is smaller than before, user might have deleted it. Reset position.
        if (stats.size < currentBytePosition) {
            currentBytePosition = 0;
        }

        // If no new data, return
        if (stats.size === currentBytePosition) return;

        const sizeToRead = stats.size - currentBytePosition;
        const buffer = Buffer.alloc(sizeToRead);

        // Open file and read ONLY the new chunk
        fs.open('telemetry_data.txt', 'r', (err, fd) => {
            if (err) return console.error(err);

            fs.read(fd, buffer, 0, sizeToRead, currentBytePosition, (err, bytesRead, buff) => {
                if (err) return console.error(err);

                // Update our position marker so we don't read this again
                currentBytePosition += bytesRead;

                // Convert new bytes to text and split by new line
                const newContent = buff.toString();
                const lines = newContent.split('\n');

                lines.forEach(async (line) => {
                    if (line.trim()) { // Ignore empty lines
                        await processLine(line.trim());
                    }
                });
                
                fs.close(fd, () => {});
            });
        });
    });
}

async function processLine(line) {
    const parts = line.split(',');
    if (parts.length < 9) return; // Skip invalid lines

    const [id, timestamp, temp, position, pressure, humidity, velocity, status, battery] = parts;

    const dataObject = {
        id: parseInt(id),
        timestamp,
        temperature: parseFloat(temp),
        position,
        pressure: parseFloat(pressure),
        humidity: parseFloat(humidity),
        velocity: parseFloat(velocity),
        status,
        battery_level: parseFloat(battery)
    };

    // Database Upsert
    const query = `
        INSERT INTO telemetry_data (id, timestamp, temperature, position, pressure, humidity, velocity, status, battery_level)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) 
        DO UPDATE SET 
            timestamp = EXCLUDED.timestamp,
            temperature = EXCLUDED.temperature,
            position = EXCLUDED.position,
            pressure = EXCLUDED.pressure,
            humidity = EXCLUDED.humidity,
            velocity = EXCLUDED.velocity,
            status = EXCLUDED.status,
            battery_level = EXCLUDED.battery_level;
    `;

    const values = [
        dataObject.id, dataObject.timestamp, dataObject.temperature, 
        dataObject.position, dataObject.pressure, dataObject.humidity, 
        dataObject.velocity, dataObject.status, dataObject.battery_level
    ];

    try {
        await pool.query(query, values);
        io.emit('telemetry_update', dataObject);
        console.log(`New Data Ingested: ID ${dataObject.id}`);
    } catch (err) {
        console.error("DB Error:", err);
    }
}

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Backend Server running on port ${PORT}`);
});

