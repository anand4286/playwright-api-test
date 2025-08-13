import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve the Petstore dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'petstore-dashboard.html'));
});

// API Routes for Petstore data
app.get('/api/petstore/requirements', (req, res) => {
    try {
        const requirementsPath = path.join(__dirname, '..', 'requirements', 'generated-requirements.json');
        if (fs.existsSync(requirementsPath)) {
            const data = fs.readFileSync(requirementsPath, 'utf8');
            res.json(JSON.parse(data));
        } else {
            res.json({ requirements: [] });
        }
    } catch (error) {
        console.error('Error loading requirements:', error);
        res.status(500).json({ error: 'Failed to load requirements' });
    }
});

app.get('/api/petstore/test-cases', (req, res) => {
    try {
        const testCasesPath = path.join(__dirname, '..', 'requirements', 'generated-test-cases.json');
        if (fs.existsSync(testCasesPath)) {
            const data = fs.readFileSync(testCasesPath, 'utf8');
            res.json(JSON.parse(data));
        } else {
            res.json({ testCases: [] });
        }
    } catch (error) {
        console.error('Error loading test cases:', error);
        res.status(500).json({ error: 'Failed to load test cases' });
    }
});

app.get('/api/petstore/latest-results', (req, res) => {
    try {
        const historyDir = path.join(__dirname, '..', 'test-history');
        if (!fs.existsSync(historyDir)) {
            return res.json({ passRate: 0, requirementCoverage: [], trends: [] });
        }

        const historyFiles = fs.readdirSync(historyDir)
            .filter(file => file.endsWith('.jsonl') && !file.includes('master'))
            .sort()
            .reverse()
            .slice(0, 10);

        const requirementCoverage = {};
        const trends = [];

        for (const file of historyFiles) {
            const filePath = path.join(historyDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.trim().split('\n').filter(line => line.trim());
            
            let passed = 0;
            let total = 0;
            const cycleTime = fs.statSync(filePath).mtime;

            for (const line of lines) {
                try {
                    const result = JSON.parse(line);
                    total++;
                    if (result.status === 'PASS') passed++;

                    if (!requirementCoverage[result.requirementId]) {
                        requirementCoverage[result.requirementId] = {
                            requirementId: result.requirementId,
                            totalTests: 0,
                            passedTests: 0,
                            passRate: 0
                        };
                    }
                    requirementCoverage[result.requirementId].totalTests++;
                    if (result.status === 'PASS') {
                        requirementCoverage[result.requirementId].passedTests++;
                    }
                } catch (e) {
                    // Skip invalid JSON lines
                }
            }

            if (total > 0) {
                trends.push({
                    timestamp: cycleTime.toISOString(),
                    passRate: Math.round((passed / total) * 100),
                    cycle: file.replace('.jsonl', '')
                });
            }
        }

        Object.values(requirementCoverage).forEach((req: any) => {
            req.passRate = req.totalTests > 0 ? Math.round((req.passedTests / req.totalTests) * 100) : 0;
        });

        const overallPassRate = trends.length > 0 ? 
            Math.round(trends.reduce((sum, t) => sum + t.passRate, 0) / trends.length) : 0;

        res.json({
            passRate: overallPassRate,
            requirementCoverage: Object.values(requirementCoverage),
            trends: trends.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        });

    } catch (error) {
        console.error('Error loading latest results:', error);
        res.status(500).json({ error: 'Failed to load latest results' });
    }
});

app.get('/api/petstore/test-history', (req, res) => {
    try {
        const historyDir = path.join(__dirname, '..', 'test-history');
        if (!fs.existsSync(historyDir)) {
            return res.json([]);
        }

        const historyFiles = fs.readdirSync(historyDir)
            .filter(file => file.endsWith('.jsonl'))
            .sort()
            .reverse()
            .slice(0, 50);

        const allResults = [];

        for (const file of historyFiles) {
            const filePath = path.join(historyDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.trim().split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                try {
                    const result = JSON.parse(line);
                    allResults.push(result);
                } catch (e) {
                    // Skip invalid JSON lines
                }
            }
        }

        res.json(allResults.slice(0, 100));

    } catch (error) {
        console.error('Error loading test history:', error);
        res.status(500).json({ error: 'Failed to load test history' });
    }
});

app.get('/api/petstore/cycles', (req, res) => {
    try {
        const historyDir = path.join(__dirname, '..', 'test-history');
        if (!fs.existsSync(historyDir)) {
            return res.json([]);
        }

        const historyFiles = fs.readdirSync(historyDir)
            .filter(file => file.endsWith('.jsonl') && !file.includes('master'))
            .sort()
            .reverse();

        const cycles = historyFiles.map(file => {
            const parts = file.replace('.jsonl', '').split('-');
            const environment = parts[parts.length - 1];
            const cycle = parts.slice(0, -1).join('-');
            
            return {
                cycle: cycle,
                environment: environment,
                timestamp: fs.statSync(path.join(historyDir, file)).mtime.toISOString()
            };
        });

        res.json(cycles.slice(0, 20));

    } catch (error) {
        console.error('Error loading cycles:', error);
        res.status(500).json({ error: 'Failed to load cycles' });
    }
});

app.get('/api/petstore/cycle/:cycle/:environment', (req, res) => {
    try {
        const { cycle, environment } = req.params;
        const filename = `${cycle}-${environment}.jsonl`;
        const filePath = path.join(__dirname, '..', 'test-history', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Cycle not found' });
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        const results = [];

        for (const line of lines) {
            try {
                const result = JSON.parse(line);
                results.push(result);
            } catch (e) {
                // Skip invalid JSON lines
            }
        }

        res.json({
            cycle: cycle,
            environment: environment,
            results: results
        });

    } catch (error) {
        console.error('Error loading cycle details:', error);
        res.status(500).json({ error: 'Failed to load cycle details' });
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'Petstore API Dashboard',
        timestamp: new Date().toISOString() 
    });
});

app.listen(PORT, () => {
    console.log(`🐾 Petstore API Dashboard running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard URL: http://localhost:${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
});

export default app;
