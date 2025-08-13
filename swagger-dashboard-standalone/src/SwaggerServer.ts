import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { SwaggerRequirementGenerator } from './SwaggerRequirementGenerator';
import { DashboardConfig } from './types';

export class SwaggerServer {
  private app: express.Application;
  private config: DashboardConfig;
  private openApiDir: string;
  private requirementsDir: string;

  constructor(config: DashboardConfig = {}) {
    this.config = {
      port: 8888,
      openApiDir: './openapi-specs',
      requirementsDir: './requirements',
      enableCors: true,
      logLevel: 'info',
      ...config
    };

    this.openApiDir = path.resolve(this.config.openApiDir!);
    this.requirementsDir = path.resolve(this.config.requirementsDir!);
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    if (this.config.enableCors) {
      this.app.use(cors());
    }
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        config: {
          openApiDir: this.openApiDir,
          requirementsDir: this.requirementsDir
        }
      });
    });

    // Get available APIs
    this.app.get('/api/swagger/available', (req, res) => {
      try {
        const apis = this.getAvailableApis();
        res.json(apis);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: 'Failed to load available APIs', details: errorMessage });
      }
    });

    // Get API info
    this.app.get('/api/swagger/:apiId/info', (req, res) => {
      try {
        const { apiId } = req.params;
        const info = this.getApiInfo(apiId);
        if (info) {
          res.json(info);
        } else {
          res.status(404).json({ error: 'API not found' });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: 'Failed to load API info', details: errorMessage });
      }
    });

    // Get requirements for an API
    this.app.get('/api/swagger/:apiId/requirements', (req, res) => {
      try {
        const { apiId } = req.params;
        const requirements = this.getApiRequirements(apiId);
        if (requirements) {
          res.json(requirements);
        } else {
          res.status(404).json({ error: 'Requirements not found for this API' });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: 'Failed to load requirements', details: errorMessage });
      }
    });

    // Get test cases for an API
    this.app.get('/api/swagger/:apiId/test-cases', (req, res) => {
      try {
        const { apiId } = req.params;
        const testCases = this.getApiTestCases(apiId);
        if (testCases) {
          res.json(testCases);
        } else {
          res.status(404).json({ error: 'Test cases not found for this API' });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: 'Failed to load test cases', details: errorMessage });
      }
    });

    // Get metrics for an API
    this.app.get('/api/swagger/:apiId/metrics', (req, res) => {
      try {
        const { apiId } = req.params;
        const metrics = this.getApiMetrics(apiId);
        if (metrics) {
          res.json(metrics);
        } else {
          res.status(404).json({ error: 'Metrics not found for this API' });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: 'Failed to load metrics', details: errorMessage });
      }
    });

    // Serve dashboard HTML
    this.app.get('/', (req, res) => {
      const htmlPath = path.join(__dirname, '../public/index.html');
      if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
      } else {
        res.send(this.getDefaultDashboardHtml());
      }
    });
  }

  private getAvailableApis(): Array<{ id: string, name: string, fileName: string }> {
    if (!fs.existsSync(this.openApiDir)) {
      return [];
    }

    const files = fs.readdirSync(this.openApiDir);
    const specFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.json', '.yaml', '.yml'].includes(ext);
    });

    return specFiles.map(fileName => {
      try {
        const specPath = path.join(this.openApiDir, fileName);
        const generator = new SwaggerRequirementGenerator(specPath);
        const apiName = generator['apiName']; // Access private property
        const apiId = generator['apiId']; // Access private property
        
        return {
          id: apiId,
          name: apiName,
          fileName
        };
      } catch (error) {
        // If spec is invalid, return basic info
        return {
          id: fileName.replace(/\.[^/.]+$/, ""),
          name: fileName.replace(/\.[^/.]+$/, ""),
          fileName
        };
      }
    });
  }

  private getApiInfo(apiId: string): any {
    const specFile = this.findSpecFileByApiId(apiId);
    if (!specFile) return null;

    try {
      const generator = new SwaggerRequirementGenerator(specFile);
      return {
        title: generator['apiName'],
        version: generator['spec'].info.version,
        description: generator['spec'].info.description,
        fileName: path.basename(specFile)
      };
    } catch (error) {
      return null;
    }
  }

  private getApiRequirements(apiId: string): any {
    const reqFile = path.join(this.requirementsDir, `${apiId}-generated-requirements.json`);
    if (fs.existsSync(reqFile)) {
      const content = fs.readFileSync(reqFile, 'utf8');
      return JSON.parse(content);
    }
    return null;
  }

  private getApiTestCases(apiId: string): any {
    const testFile = path.join(this.requirementsDir, `${apiId}-generated-test-cases.json`);
    if (fs.existsSync(testFile)) {
      const content = fs.readFileSync(testFile, 'utf8');
      return JSON.parse(content);
    }
    return null;
  }

  private getApiMetrics(apiId: string): any {
    const requirements = this.getApiRequirements(apiId);
    if (requirements && requirements.metrics) {
      return requirements.metrics;
    }

    // Generate metrics on-the-fly if not cached
    const specFile = this.findSpecFileByApiId(apiId);
    if (specFile) {
      try {
        const generator = new SwaggerRequirementGenerator(specFile);
        return generator.generateMetrics();
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  private findSpecFileByApiId(apiId: string): string | null {
    const apis = this.getAvailableApis();
    const api = apis.find(a => a.id === apiId);
    return api ? path.join(this.openApiDir, api.fileName) : null;
  }

  private getDefaultDashboardHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Swagger Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .api-list { margin: 20px 0; }
        .api-item { padding: 15px; border: 1px solid #ddd; margin: 10px 0; border-radius: 5px; }
        .error { color: red; }
        .info { color: blue; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 Swagger Dashboard</h1>
            <p>Universal OpenAPI Testing Framework</p>
        </div>
        <div id="content">
            <p class="info">Loading available APIs...</p>
        </div>
    </div>
    <script>
        async function loadApis() {
            try {
                const response = await fetch('/api/swagger/available');
                const apis = await response.json();
                const content = document.getElementById('content');
                
                if (apis.length === 0) {
                    content.innerHTML = '<p class="error">No APIs found. Please add OpenAPI specs to the openapi-specs directory.</p>';
                    return;
                }
                
                let html = '<div class="api-list"><h2>Available APIs</h2>';
                apis.forEach(api => {
                    html += \`<div class="api-item">
                        <h3>\${api.name}</h3>
                        <p>File: \${api.fileName}</p>
                        <p>ID: \${api.id}</p>
                    </div>\`;
                });
                html += '</div>';
                content.innerHTML = html;
            } catch (error) {
                document.getElementById('content').innerHTML = '<p class="error">Error loading APIs: ' + error.message + '</p>';
            }
        }
        
        loadApis();
    </script>
</body>
</html>`;
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.config.port, () => {
        console.log(`🔗 Swagger API Testing Dashboard running on http://localhost:${this.config.port}`);
        console.log(`📊 Dashboard URL: http://localhost:${this.config.port}`);
        console.log(`🔗 Health Check: http://localhost:${this.config.port}/health`);
        console.log(`📁 OpenAPI Specs Directory: ${this.openApiDir}`);
        resolve();
      });
    });
  }

  stop(): void {
    // Implementation for stopping the server if needed
    process.exit(0);
  }

  getApp(): express.Application {
    return this.app;
  }
}
