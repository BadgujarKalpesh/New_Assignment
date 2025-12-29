**Real-Time Telemetry Data Ingestion & Visualization**
This project is a full-stack application designed to ingest structured telemetry data from a log file in real-time, store it in a PostgreSQL database, and visualize the live updates on a React dashboard with millisecond-level latency.
+2

🚀 Features

Real-Time Ingestion: "Watches" a local text file for new lines (simulating a live sensor feed) without needing to restart the server.
+1


Live Visualization: Pushes updates to the React frontend instantly using WebSockets (Socket.io).
+1


Data Persistence: Efficiently inserts or updates records in PostgreSQL to prevent duplicates.
+1


Control System: Start/Stop ingestion process via API endpoints.
+1


Modular Architecture: Separation of concerns between Backend (Node/Express) and Frontend (React).

🛠️ Tech Stack
Frontend: React.js, Socket.io-client, Axios, CSS3

Backend: Node.js, Express.js, Socket.io, fs (File System Watcher)

Database: PostgreSQL (pg-pool)

📋 Prerequisites
Before running the project, ensure you have the following installed:

Node.js (v14 or higher)

PostgreSQL

Git

⚙️ Installation & Setup
1. Database Setup
Create the database and table in PostgreSQL.

SQL

CREATE DATABASE telemetry_db;

-- Connect to telemetry_db and run:
CREATE TABLE telemetry_data (
    id INTEGER PRIMARY KEY,
    timestamp TIMESTAMP,
    temperature DECIMAL,
    position VARCHAR(50),
    pressure DECIMAL,
    humidity DECIMAL,
    velocity DECIMAL,
    status VARCHAR(20),
    battery_level DECIMAL
);
2. Backend Setup
Navigate to the backend folder and install dependencies.

Bash

cd backend
npm install
Configuration: Open backend/db.js and update the password field with your PostgreSQL password.

3. Frontend Setup
Navigate to the frontend folder and install dependencies.

Bash

cd frontend
npm install
🏃‍♂️ How to Run
You need to run the Backend and Frontend in two separate terminals.

Terminal 1: Start Backend

Bash

cd backend
node server.js
# Output: Backend Server running on port 5000
Terminal 2: Start Frontend

Bash

cd frontend
npm start
# Opens http://localhost:3000 in your browser
🧪 How to Test (Real-Time Updates)
Open the dashboard at http://localhost:3000.

Click the Start Ingestion button. You will see existing data load.

Open the backend/telemetry_data.txt file in your code editor.

Add a new line at the bottom of the file and save it:

Plaintext

999,2025-12-29T12:00:00,50.5,N-999,1020,55,20.5,CRITICAL,5
Watch the Dashboard: The new row (ID 999) will appear instantly without refreshing the page or restarting the server.

📂 Project Structure
telemetry-assignment/
├── backend/
│   ├── db.js                # Database connection config
│   ├── server.js            # Main server logic (API + WebSockets + File Watcher)
│   ├── telemetry_data.txt   # Data source file
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js           # Main React component
│   │   ├── App.css          # Styling
│   │   └── index.js
│   └── package.json
└── README.md



🛡️ API Endpoints
Method Endpoint      Description
POST   /startStarts  the file watcher and ingestion process
POST   /stopStops    the file watcher
GET    /dataFetches  all existing data from the database
