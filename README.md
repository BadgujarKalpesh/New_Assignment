

# 📡 TelemetryLive - Real-Time Data Ingestion & Visualization

A full-stack application that simulates real-time telemetry data ingestion from a file, synchronizes it with a PostgreSQL database, and visualizes the live data on a React frontend using WebSockets.

## 🚀 Features

* **Real-Time Visualization**: Live updates of sensor data (Temperature, Pressure, Velocity, etc.) using Socket.io.
* **Data Synchronization**: Watches a local file (`telemetry_data.txt`) for changes and automatically syncs (Insert/Update/Delete) with PostgreSQL.
* **Control Panel**: Start and Stop the data ingestion process via API.
* **Live Status**: Visual indicators for system status (Running/Stopped) and connection health.
* **Responsive UI**: Clean dashboard with color-coded status badges and battery level indicators.

## 🛠️ Tech Stack

* **Frontend**: React.js, Socket.io-client, Axios
* **Backend**: Node.js, Express, Socket.io, PostgreSQL (pg)
* **Database**: PostgreSQL

## 📋 Prerequisites

Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v14 or higher)
* [PostgreSQL](https://www.postgresql.org/)

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd <your-repo-folder>


### 2. Database Setup

1. Open your PostgreSQL tool (pgAdmin or command line).
2. Create a database named `telemetry_db`.
3. Run the following SQL query to create the table:

```sql
CREATE TABLE telemetry_data (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP,
    temperature DECIMAL,
    position VARCHAR(50),
    pressure DECIMAL,
    humidity DECIMAL,
    velocity DECIMAL,
    status VARCHAR(50),
    battery_level DECIMAL
);

```

### 3. Backend Setup

Navigate to the backend folder, install dependencies, and configure the environment.

```bash
cd backend
npm install

```

**Create a `.env` file in the `backend` folder:**

```env
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=telemetry_db
DB_PASSWORD=root
DB_PORT=5432
FRONTEND_URL=http://localhost:3000

```

*(Note: Replace `DB_PASSWORD` with your actual PostgreSQL password)*

**Add the Data File:**
Ensure `telemetry_data.txt` exists in the `backend/` root directory.

### 4. Frontend Setup

Navigate to the frontend folder, install dependencies, and configure the environment.

```bash
cd ../frontend
npm install

```

**Create a `.env` file in the `frontend` folder:**

```env
REACT_APP_API_URL=http://localhost:5000

```

## 🚀 Running the Application

### Start the Backend

```bash
# In the backend terminal
npm run dev
# OR
node server.js

```

*The server will start on port 5000.*

### Start the Frontend

```bash
# In the frontend terminal
npm start

```

*The application will open at `http://localhost:3000`.*

## 📂 Project Structure

```text
/backend
│── config/db.js             # Database connection
│── controllers/             # Logic for file watching & DB sync
│── routes/                  # API endpoints
│── server.js                # Entry point & Socket.io setup
│── telemetry_data.txt       # Source file for simulation
│── .env                     # Backend config

/frontend
│── src/
│   ├── App.js               # Main Dashboard UI
│   ├── App.css              # Styles
│── .env                     # Frontend config

```

## 🧪 Usage

1. Open the Dashboard in your browser.
2. Click **▶ Start Ingestion**.
3. Modify `backend/telemetry_data.txt` (edit values, add lines, or remove lines) and save.
4. Observe the changes reflecting instantly on the dashboard.
5. Click **⏹ Stop Ingestion** to halt the file watcher.

```

```
