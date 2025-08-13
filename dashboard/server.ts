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
    const tracePath = path.join(__dirname, 'data', 'traceability-matrix.json');
    if (fs.existsSync(tracePath)) {
      const data = JSON.parse(fs.readFileSync(tracePath, 'utf-8'));
      res.json(data);
    } else {
      res.json({ message: 'No traceability data available' });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// New API endpoints for Petstore requirements tracking
app.get('/api/petstore/requirements', (req, res) => {
  try {
    const reqPath = path.join(process.cwd(), 'requirements', 'generated-requirements.json');
    if (fs.existsSync(reqPath)) {
      const data = JSON.parse(fs.readFileSync(reqPath, 'utf-8'));
      res.json(data);
    } else {
      res.json({ message: 'No Petstore requirements available' });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/petstore/test-cases', (req, res) => {
  try {
    const tcPath = path.join(process.cwd(), 'test-cases', 'generated-test-cases.json');
    if (fs.existsSync(tcPath)) {
      const data = JSON.parse(fs.readFileSync(tcPath, 'utf-8'));
      res.json(data);
    } else {
      res.json({ message: 'No Petstore test cases available' });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/petstore/test-history', (req, res) => {
  try {
    const historyPath = path.join(__dirname, 'data', 'test-history.json');
    if (fs.existsSync(historyPath)) {
      const data = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
      res.json(data);
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/petstore/latest-results', (req, res) => {
  try {
    const latestPath = path.join(__dirname, 'data', 'latest-results.json');
    if (fs.existsSync(latestPath)) {
      const data = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
      res.json(data);
    } else {
      res.json({ message: 'No latest results available' });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/petstore/cycles', (req, res) => {
  try {
    const historyDir = path.join(process.cwd(), 'test-history');
    if (fs.existsSync(historyDir)) {
      const files = fs.readdirSync(historyDir);
      const cycles = files
        .filter(file => file.endsWith('.jsonl') && file !== 'master-history.jsonl')
        .map(file => {
          const parts = file.replace('.jsonl', '').split('-');
          const environment = parts.pop();
          const cycle = parts.join('-');
          return { cycle, environment, file };
        });
      res.json(cycles);
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/petstore/cycle/:cycle/:environment', (req, res) => {
  try {
    const { cycle, environment } = req.params;
    const filePath = path.join(process.cwd(), 'test-history', `${cycle}-${environment}.jsonl`);
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const results = data.split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
      
      const passed = results.filter(r => r.status === 'PASS').length;
      const failed = results.filter(r => r.status === 'FAIL').length;
      const skipped = results.filter(r => r.status === 'SKIP').length;
      
      const summary = {
        cycle,
        environment,
        totalTests: results.length,
        passed,
        failed,
        skipped,
        passRate: results.length > 0 ? Math.round((passed / results.length) * 100) : 0,
        results: results.slice(-50)
      };
      
      res.json(summary);
    } else {
      res.status(404).json({ error: 'Cycle data not found' });
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
