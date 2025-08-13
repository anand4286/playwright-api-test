import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8888;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve the Swagger dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'swagger-dashboard.html'));
});

// API Routes

// Get all available APIs
app.get('/api/swagger/available', (req, res) => {
    try {
        const openApiDir = path.join(__dirname, '..', 'openapi-specs');
        if (!fs.existsSync(openApiDir)) {
            return res.json([]);
        }

        const files = fs.readdirSync(openApiDir)
            .filter(file => file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml'));

        const apis = files.map(file => {
            try {
                const filePath = path.join(openApiDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const spec = JSON.parse(content);
                
                return {
                    id: file.replace(/\.(json|yaml|yml)$/, ''),
                    name: spec.info?.title || file,
                    version: spec.info?.version || '1.0.0',
                    description: spec.info?.description || 'No description',
                    file: file
                };
            } catch (e) {
                return {
                    id: file.replace(/\.(json|yaml|yml)$/, ''),
                    name: file,
                    version: '1.0.0',
                    description: 'Invalid OpenAPI spec',
                    file: file
                };
            }
        });

        res.json(apis);
    } catch (error) {
        console.error('Error loading available APIs:', error);
        res.status(500).json({ error: 'Failed to load available APIs' });
    }
});

// Get API info
app.get('/api/swagger/:apiId/info', (req, res) => {
    try {
        const { apiId } = req.params;
        const openApiDir = path.join(__dirname, '..', 'openapi-specs');
        
        // Find the file for this API
        const files = fs.readdirSync(openApiDir)
            .filter(file => file.replace(/\.(json|yaml|yml)$/, '') === apiId);
        
        if (files.length === 0) {
            return res.status(404).json({ error: 'API not found' });
        }

        const filePath = path.join(openApiDir, files[0]);
        const content = fs.readFileSync(filePath, 'utf8');
        const spec = JSON.parse(content);
        
        const totalEndpoints = Object.keys(spec.paths || {}).reduce((total, path) => {
            return total + Object.keys(spec.paths[path] || {}).length;
        }, 0);

        res.json({
            name: spec.info?.title || apiId,
            description: spec.info?.description || 'No description available',
            version: spec.info?.version || '1.0.0',
            baseUrl: spec.servers?.[0]?.url || 'Not specified',
            totalEndpoints: totalEndpoints,
            lastUpdated: fs.statSync(filePath).mtime.toISOString()
        });

    } catch (error) {
        console.error('Error loading API info:', error);
        res.status(500).json({ error: 'Failed to load API info' });
    }
});

// Get requirements for specific API
app.get('/api/swagger/:apiId/requirements', (req, res) => {
    try {
        const { apiId } = req.params;
        const requirementsPath = path.join(__dirname, '..', 'requirements', `${apiId}-generated-requirements.json`);
        
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

// Get test cases for specific API
app.get('/api/swagger/:apiId/test-cases', (req, res) => {
    try {
        const { apiId } = req.params;
        const testCasesPath = path.join(__dirname, '..', 'requirements', `${apiId}-generated-test-cases.json`);
        
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

// Get latest results for specific API
app.get('/api/swagger/:apiId/latest-results', (req, res) => {
    try {
        const { apiId } = req.params;
        const historyDir = path.join(__dirname, '..', 'test-history');
        
        if (!fs.existsSync(historyDir)) {
            return res.json({ passRate: 0, requirementCoverage: [], trends: [] });
        }

        const historyFiles = fs.readdirSync(historyDir)
            .filter(file => file.endsWith('.jsonl') && file.includes(apiId) && !file.includes('master'))
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

// Get test history for specific API
app.get('/api/swagger/:apiId/test-history', (req, res) => {
    try {
        const { apiId } = req.params;
        const historyDir = path.join(__dirname, '..', 'test-history');
        
        if (!fs.existsSync(historyDir)) {
            return res.json([]);
        }

        const historyFiles = fs.readdirSync(historyDir)
            .filter(file => file.endsWith('.jsonl') && file.includes(apiId))
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

// Get cycles for specific API
app.get('/api/swagger/:apiId/cycles', (req, res) => {
    try {
        const { apiId } = req.params;
        const historyDir = path.join(__dirname, '..', 'test-history');
        
        if (!fs.existsSync(historyDir)) {
            return res.json([]);
        }

        const historyFiles = fs.readdirSync(historyDir)
            .filter(file => file.endsWith('.jsonl') && file.includes(apiId) && !file.includes('master'))
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

// Get specific cycle details
app.get('/api/swagger/:apiId/cycle/:cycle/:environment', (req, res) => {
    try {
        const { apiId, cycle, environment } = req.params;
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
                // Filter results for this specific API
                if (result.requirementId && result.requirementId.includes(apiId.toUpperCase())) {
                    results.push(result);
                }
            } catch (e) {
                // Skip invalid JSON lines
            }
        }

        res.json({
            apiId: apiId,
            cycle: cycle,
            environment: environment,
            results: results
        });

    } catch (error) {
        console.error('Error loading cycle details:', error);
        res.status(500).json({ error: 'Failed to load cycle details' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'Swagger API Testing Dashboard',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

app.listen(PORT, () => {
    console.log(`🔗 Swagger API Testing Dashboard running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard URL: http://localhost:${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
    console.log(`📁 OpenAPI Specs Directory: ${path.join(__dirname, '..', 'openapi-specs')}`);
});

export default app;
