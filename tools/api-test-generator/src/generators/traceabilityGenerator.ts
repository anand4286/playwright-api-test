import fs from 'fs-extra';
import path from 'path';
import type { APIAnalysis, TraceabilityResult, RequirementInfo } from '../types.js';

/**
 * Generate requirement traceability matrix
 */
export async function generateTraceabilityMatrix(
  api: any,
  analysis: APIAnalysis,
  outputDir: string
): Promise<TraceabilityResult> {
  
  // Extract requirements from API specification
  const requirements = extractRequirements(analysis);
  
  // Generate HTML matrix
  const matrixFile = await generateHTMLMatrix(outputDir, requirements, analysis);
  
  // Generate coverage report
  const coverageReport = await generateTraceabilityCoverage(outputDir, requirements, analysis);
  
  return {
    matrixFile,
    coverageReport,
    requirements
  };
}

/**
 * Extract requirements from API analysis
 */
function extractRequirements(analysis: APIAnalysis): RequirementInfo[] {
  const requirements: RequirementInfo[] = [];
  
  // Create requirements for each business capability/tag
  for (const tag of analysis.tags) {
    const tagEndpoints = analysis.endpoints.filter(e => e.tags.includes(tag));
    
    requirements.push({
      id: `REQ-${tag.toUpperCase().replace(/\\s+/g, '-')}-001`,
      title: `${tag} Management`,
      description: `Complete ${tag} lifecycle management including CRUD operations`,
      priority: 'high',
      status: 'implemented',
      endpoints: tagEndpoints.map(e => `${e.method} ${e.path}`),
      testCases: tagEndpoints.map(e => `test_${e.operationId || e.method.toLowerCase() + '_' + e.path.replace(/[^a-zA-Z0-9]/g, '_')}`),
      businessValue: `Enables users to manage ${tag} effectively through API operations`
    });
  }
  
  // Create specific functional requirements
  const crudOperations = ['CREATE', 'READ', 'UPDATE', 'DELETE'];
  for (const tag of analysis.tags) {
    const tagEndpoints = analysis.endpoints.filter(e => e.tags.includes(tag));
    
    for (const operation of crudOperations) {
      const relatedEndpoints = tagEndpoints.filter(e => 
        (operation === 'CREATE' && e.method === 'POST') ||
        (operation === 'READ' && e.method === 'GET') ||
        (operation === 'UPDATE' && (e.method === 'PUT' || e.method === 'PATCH')) ||
        (operation === 'DELETE' && e.method === 'DELETE')
      );
      
      if (relatedEndpoints.length > 0) {
        requirements.push({
          id: `REQ-${tag.toUpperCase().replace(/\\s+/g, '-')}-${operation}-001`,
          title: `${operation} ${tag}`,
          description: `System shall support ${operation.toLowerCase()} operations for ${tag}`,
          priority: operation === 'READ' ? 'high' : 'medium',
          status: 'implemented',
          endpoints: relatedEndpoints.map(e => `${e.method} ${e.path}`),
          testCases: relatedEndpoints.map(e => `test_${e.operationId || e.method.toLowerCase() + '_' + e.path.replace(/[^a-zA-Z0-9]/g, '_')}`),
          businessValue: `Allows ${operation.toLowerCase()} operations on ${tag} resources`
        });
      }
    }
  }
  
  return requirements;
}

/**
 * Generate HTML traceability matrix
 */
async function generateHTMLMatrix(
  outputDir: string,
  requirements: RequirementInfo[],
  analysis: APIAnalysis
): Promise<string> {
  const matrixPath = path.join(outputDir, 'traceability-matrix.html');
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Requirement Traceability Matrix</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2rem;
        }
        .stats {
            display: flex;
            justify-content: space-around;
            padding: 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        .stat {
            text-align: center;
        }
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        th {
            background-color: #667eea;
            color: white;
            font-weight: 600;
        }
        .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.875rem;
            font-weight: 500;
        }
        .status.implemented {
            background-color: #d4edda;
            color: #155724;
        }
        .priority {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.875rem;
            font-weight: 500;
        }
        .priority.high {
            background-color: #f8d7da;
            color: #721c24;
        }
        .priority.medium {
            background-color: #fff3cd;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>API Requirement Traceability Matrix</h1>
            <p>${analysis.title} v${analysis.version}</p>
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-number">${requirements.length}</div>
                <div class="stat-label">Total Requirements</div>
            </div>
            <div class="stat">
                <div class="stat-number">${analysis.endpoints.length}</div>
                <div class="stat-label">API Endpoints</div>
            </div>
        </div>
        
        <div style="padding: 30px;">
            <table>
                <thead>
                    <tr>
                        <th>Requirement ID</th>
                        <th>Title</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>API Endpoints</th>
                        <th>Business Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${requirements.map(req => `
                    <tr>
                        <td><strong>${req.id}</strong></td>
                        <td>${req.title}</td>
                        <td><span class="priority ${req.priority}">${req.priority.toUpperCase()}</span></td>
                        <td><span class="status ${req.status}">${req.status.toUpperCase()}</span></td>
                        <td>
                            ${req.endpoints.map(endpoint => {
                                const parts = endpoint.split(' ');
                                const method = parts[0] || '';
                                const path = parts.slice(1).join(' ');
                                return `<div>${method} ${path}</div>`;
                            }).join('')}
                        </td>
                        <td>${req.businessValue}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;

  await fs.writeFile(matrixPath, html);
  return matrixPath;
}

/**
 * Generate traceability coverage report
 */
async function generateTraceabilityCoverage(
  outputDir: string,
  requirements: RequirementInfo[],
  analysis: APIAnalysis
): Promise<string> {
  const coveragePath = path.join(outputDir, 'traceability-coverage.json');
  
  const coverage = {
    timestamp: new Date().toISOString(),
    api: {
      title: analysis.title,
      version: analysis.version,
      totalEndpoints: analysis.endpoints.length
    },
    requirements: {
      total: requirements.length,
      implemented: requirements.filter(r => r.status === 'implemented').length,
      tested: requirements.filter(r => r.status === 'tested').length,
      pending: requirements.filter(r => r.status === 'pending').length
    },
    coverage: {
      implementation: (requirements.filter(r => r.status === 'implemented').length / requirements.length) * 100,
      testing: (requirements.filter(r => r.status === 'tested').length / requirements.length) * 100
    }
  };
  
  await fs.writeFile(coveragePath, JSON.stringify(coverage, null, 2));
  return coveragePath;
}
