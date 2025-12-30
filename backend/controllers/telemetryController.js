const fs = require('fs');
const pool = require('../config/db');

let isRunning = false;
let fsWatcher = null;
let ioInstance = null;

// Initialize Socket.IO instance from server.js
const setIo = (io) => {
    ioInstance = io;
};

const startProcess = (req, res) => {
    if (!isRunning) {
        isRunning = true;
        console.log("Process Started... Syncing file state.");
        
        syncFileToDatabase();

        fsWatcher = fs.watch('telemetry_data.txt', (eventType) => {
            if (eventType === 'change' && isRunning) {
                setTimeout(syncFileToDatabase, 100); 
            }
        });

        res.json({ message: "Telemetry started (Sync Mode)" });
    } else {
        res.json({ message: "Already running" });
    }
};

const stopProcess = (req, res) => {
    isRunning = false;
    if (fsWatcher) {
        fsWatcher.close();
        fsWatcher = null;
    }
    console.log("Process Stopped.");
    res.json({ message: "Telemetry stopped" });
};

const getData = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM telemetry_data ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};


function syncFileToDatabase() {
    fs.readFile('telemetry_data.txt', 'utf8', async (err, data) => {
        if (err) return console.error("Error reading file:", err);

        const lines = data.split('\n');
        const fileData = [];
        const fileIds = [];

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
            // DELETE Logic
            let deleteQuery;
            let deleteValues = [];

            if (fileIds.length > 0) {
                const placeholders = fileIds.map((_, i) => `$${i + 1}`).join(',');
                deleteQuery = `DELETE FROM telemetry_data WHERE id NOT IN (${placeholders}) RETURNING id`;
                deleteValues = fileIds;
            } else {
                deleteQuery = `DELETE FROM telemetry_data RETURNING id`;
            }

            const deleteResult = await pool.query(deleteQuery, deleteValues);

            if (deleteResult.rows.length > 0 && ioInstance) {
                const deletedIds = deleteResult.rows.map(row => row.id);
                console.log(`Synced: Deleted IDs [${deletedIds.join(', ')}]`);
                ioInstance.emit('telemetry_delete', deletedIds);
            }

            // UPSERT Logic
            for (const item of fileData) {
                await upsertDatabaseRow(item);
            }

        } catch (dbErr) {
            console.error("Database Sync Error:", dbErr);
        }
    });
}

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
    if (ioInstance) {
        ioInstance.emit('telemetry_update', data);
    }
}

module.exports = {
    setIo,
    startProcess,
    stopProcess,
    getData
};