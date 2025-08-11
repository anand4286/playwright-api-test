import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.DASHBOARD_PORT || 5000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API Routes
app.get('/api/test-results', (req, res) => {
  try {
    const reportPath = path.join(process.cwd(), 'reports', 'detailed-test-report.json');
    if (fs.existsSync(reportPath)) {
      const data = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      res.json(data);
    } else {
      res.json({ message: 'No test results available' });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/api-logs', (req, res) => {
  try {
    const logsPath = path.join(process.cwd(), 'reports', 'api-logs-report.json');
    if (fs.existsSync(logsPath)) {
      const data = JSON.parse(fs.readFileSync(logsPath, 'utf-8'));
      res.json(data);
    } else {
      res.json({ message: 'No API logs available' });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/traceability', (req, res) => {
  try {
    const traceabilityPath = path.join(__dirname, 'data', 'traceability-matrix.json');
    if (fs.existsSync(traceabilityPath)) {
      const data = JSON.parse(fs.readFileSync(traceabilityPath, 'utf-8'));
      res.json(data);
    } else {
      res.json({ message: 'No traceability data available' });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/test-scenarios', (req, res) => {
  try {
    const scenariosPath = path.join(process.cwd(), 'test-data', 'test-scenarios.json');
    if (fs.existsSync(scenariosPath)) {
      const data = JSON.parse(fs.readFileSync(scenariosPath, 'utf-8'));
      res.json(data);
    } else {
      res.json({ message: 'No test scenarios available' });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// WebSocket for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected to dashboard');
  
  socket.on('request-update', () => {
    // Send latest test results
    socket.emit('test-results-update', getLatestTestResults());
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected from dashboard');
  });
});

function getLatestTestResults() {
  try {
    const reportPath = path.join(process.cwd(), 'reports', 'detailed-test-report.json');
    if (fs.existsSync(reportPath)) {
      return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    }
  } catch (error) {
    console.error('Error reading test results:', error);
  }
  return null;
}

// Watch for file changes to send real-time updates
if (process.env.ENABLE_REAL_TIME_UPDATES === 'true') {
  const reportsDir = path.join(process.cwd(), 'reports');
  if (fs.existsSync(reportsDir)) {
    fs.watchFile(path.join(reportsDir, 'detailed-test-report.json'), () => {
      io.emit('test-results-update', getLatestTestResults());
    });
  }
}

// Serve the main dashboard page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Dashboard server running on http://localhost:${PORT}`);
});

export default app;
