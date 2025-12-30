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
    cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

let isRunning = false;
let fsWatcher = null;

// --- API ROUTES ---

app.post('/start', (req, res) => {
    if (!isRunning) {
        isRunning = true;
        console.log("Process Started... Syncing file state.");
        
        // Initial Sync
        syncFileToDatabase();

        // Watch for ANY change (edit, delete, append)
        fsWatcher = fs.watch('telemetry_data.txt', (eventType) => {
            if (eventType === 'change' && isRunning) {
                // Debounce slightly to avoid reading while file is being written
                setTimeout(syncFileToDatabase, 100); 
            }
        });

        res.json({ message: "Telemetry started (Sync Mode)" });
    } else {
        res.json({ message: "Already running" });
    }
});

app.post('/stop', (req, res) => {
    isRunning = false;
    if (fsWatcher) {
        fsWatcher.close();
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

// --- NEW SYNC LOGIC (Handles Deletions & Updates) ---

function syncFileToDatabase() {
    fs.readFile('telemetry_data.txt', 'utf8', async (err, data) => {
        if (err) return console.error("Error reading file:", err);

        const lines = data.split('\n');
        const fileData = [];
        const fileIds = [];

        // 1. Parse the entire file into memory
        lines.forEach(line => {
            if (line.trim()) {
                const parsed = parseLine(line);
                if (parsed) {
                    fileData.push(parsed);
                    fileIds.push(parsed.id);
                }
            }
        });

        try {
            // 2. DELETE Logic: Remove IDs from DB that are NOT present in the file
            let deleteQuery;
            let deleteValues = [];

            if (fileIds.length > 0) {
                // Creates a string like "$1, $2, $3" based on array length
                const placeholders = fileIds.map((_, i) => `$${i + 1}`).join(',');
                deleteQuery = `DELETE FROM telemetry_data WHERE id NOT IN (${placeholders}) RETURNING id`;
                deleteValues = fileIds;
            } else {
                // If file is empty, delete everything
                deleteQuery = `DELETE FROM telemetry_data RETURNING id`;
            }

            const deleteResult = await pool.query(deleteQuery, deleteValues);

            // 3. Emit DELETE event to frontend if rows were removed
            if (deleteResult.rows.length > 0) {
                const deletedIds = deleteResult.rows.map(row => row.id);
                console.log(`Synced: Deleted IDs [${deletedIds.join(', ')}]`);
                io.emit('telemetry_delete', deletedIds);
            }

            // 4. UPSERT Logic: Update or Insert valid rows from file
            for (const item of fileData) {
                await upsertDatabaseRow(item);
            }

        } catch (dbErr) {
            console.error("Database Sync Error:", dbErr);
        }
    });
}

// Helper to parse a CSV line into an object
function parseLine(line) {
    const parts = line.split(',');
    if (parts.length < 9) return null;

    const [id, timestamp, temp, position, pressure, humidity, velocity, status, battery] = parts;
    return {
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
}

// Helper to Upsert a single row
async function upsertDatabaseRow(data) {
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
        data.id, data.timestamp, data.temperature, 
        data.position, data.pressure, data.humidity, 
        data.velocity, data.status, data.battery_level
    ];

    await pool.query(query, values);
    io.emit('telemetry_update', data); // Emit update to frontend
}

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Backend Server running on port ${PORT}`);
});