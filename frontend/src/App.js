import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const socket = io(API_URL);

function App() {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('Idle');
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    fetchInitialData();

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('telemetry_update', (newData) => {
      setData((prevData) => {
        const index = prevData.findIndex(item => item.id === newData.id);
        if (index !== -1) {
          const updatedData = [...prevData];
          updatedData[index] = newData;
          return updatedData;
        } else {
          return [...prevData, newData];
        }
      });
    });

    socket.on('telemetry_delete', (deletedIds) => {
      setData((prevData) => {
        return prevData.filter(item => !deletedIds.includes(item.id));
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('telemetry_update');
      socket.off('telemetry_delete');
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const response = await axios.get(`${API_URL}/data`);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleStart = async () => {
    try {
      await axios.post(`${API_URL}/start`);
      setStatus('Running');
    } catch (error) {
      console.error("Start failed:", error);
    }
  };

  const handleStop = async () => {
    try {
      await axios.post(`${API_URL}/stop`);
      setStatus('Stopped');
    } catch (error) {
      console.error("Stop failed:", error);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const getStatusClass = (statusStr) => {
    if (!statusStr) return '';
    const s = statusStr.toLowerCase();
    if (s.includes('critical')) return 'badge-critical';
    if (s.includes('warn')) return 'badge-warning';
    return 'badge-ok';
  };

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="logo">
          <span className="logo-icon">📡</span> 
          <h1>Telemetry<span className="highlight">Live</span></h1>
        </div>
        <div className="connection-status">
          <span className={`dot ${isConnected ? 'online' : 'offline'}`}></span>
          {isConnected ? 'Server Connected' : 'Disconnected'}
        </div>
      </header>

      <main className="main-content">
        <div className="card control-panel">
          <div className="status-display">
            <p>System Status</p>
            <h2 className={status === 'Running' ? 'text-green' : 'text-gray'}>
              {status}
            </h2>
          </div>
          <div className="button-group">
            <button 
              className="btn btn-primary" 
              onClick={handleStart} 
              disabled={status === 'Running'}
            >
              ▶  Start Ingestion
            </button>
            <button 
              className="btn btn-danger" 
              onClick={handleStop}
              disabled={status === 'Stopped' || status === 'Idle'}
            >
              ⏹ Stop Ingestion
            </button>
          </div>
        </div>

        <div className="card table-container">
          <div className="table-header">
            <h3>Live Sensor Data</h3>
            <span className="row-count">{data.length} records</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Time</th>
                  <th>Temp (°C)</th>
                  <th>Position</th>
                  <th>Pressure</th>
                  <th>Humidity</th>
                  <th>Velocity</th>
                  <th>Status</th>
                  <th>Battery</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id}>
                    <td className="font-bold">#{row.id}</td>
                    <td>{formatTime(row.timestamp)}</td>
                    <td>{row.temperature}</td>
                    <td>{row.position}</td>
                    <td>{row.pressure}</td>
                    <td>{row.humidity}%</td>
                    <td>{row.velocity} m/s</td>
                    <td>
                      <span className={`badge ${getStatusClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <div className="battery-wrapper">
                        <div 
                          className="battery-fill" 
                          style={{ 
                            width: `${row.battery_level}%`,
                            backgroundColor: row.battery_level < 20 ? '#ef4444' : '#10b981'
                          }}
                        ></div>
                        <span className="battery-text">{row.battery_level}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;