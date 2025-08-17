import fs from 'fs-extra';
import path from 'path';
import type { APIAnalysis, FlowDiagramResult } from '../types.js';

/**
 * Generate flow diagrams from API specification
 */
export async function generateFlowDiagrams(
  api: any,
  analysis: APIAnalysis,
  outputDir: string
): Promise<FlowDiagramResult> {
  
  const diagramsDir = path.join(outputDir, 'diagrams');
  await fs.ensureDir(diagramsDir);
  
  const diagrams: string[] = [];
  const mermaidFiles: string[] = [];
  
  // Generate API overview diagram
  const overviewDiagram = await generateAPIOverviewDiagram(diagramsDir, analysis);
  diagrams.push(overviewDiagram);
  mermaidFiles.push(overviewDiagram);
  
  // Generate flow diagrams for each tag/module
  for (const tag of analysis.tags) {
    const tagDiagram = await generateTagFlowDiagram(diagramsDir, tag, analysis);
    diagrams.push(tagDiagram);
    mermaidFiles.push(tagDiagram);
  }
  
  // Generate CRUD flow diagrams
  const crudDiagram = await generateCRUDFlowDiagram(diagramsDir, analysis);
  diagrams.push(crudDiagram);
  mermaidFiles.push(crudDiagram);
  
  // Generate interactive HTML viewer
  const interactive = await generateInteractiveViewer(outputDir, mermaidFiles, analysis);
  
  return {
    diagrams,
    interactive,
    mermaidFiles
  };
}

/**
 * Escape special characters for Mermaid node labels
 */
function escapeMermaidText(text: string): string {
  // If text contains special characters like {}, quotes, etc., wrap in quotes
  if (text.includes('{') || text.includes('}') || text.includes('"') || text.includes("'")) {
    return `"${text.replace(/"/g, '"')}"`;
  }
  return text;
}

/**
 * Generate API overview diagram showing all modules and endpoints
 */
async function generateAPIOverviewDiagram(diagramsDir: string, analysis: APIAnalysis): Promise<string> {
  const filePath = path.join(diagramsDir, 'api-overview.mmd');
  
  const mermaid = `graph TD
    A[Client Application] --> B[${analysis.title} API]
    B --> C{Authentication}
    C -->|Valid| D[API Gateway]
    C -->|Invalid| E[401 Unauthorized]
    
    D --> F[Business Logic Layer]
    
    ${analysis.tags.map((tag, index) => {
      const letter = String.fromCharCode(71 + index); // G, H, I, etc.
      return `F --> ${letter}[${tag} Module]`;
    }).join('\n    ')}
    
    ${analysis.tags.map((tag, index) => {
      const letter = String.fromCharCode(71 + index);
      const endpoints = analysis.endpoints.filter(e => e.tags.includes(tag));
      return endpoints.map((endpoint, endIndex) => {
        // Use a safe node ID pattern: ModuleLetter + sequential numbers
        const nodeId = `${letter}${endIndex + 1}`;
        const endpointLabel = escapeMermaidText(`${endpoint.method} ${endpoint.path}`);
        return `${letter} --> ${nodeId}[${endpointLabel}]`;
      }).join('\n    ');
    }).join('\n    ')}
    
    classDef apiClass fill:#e1f5fe;
    classDef moduleClass fill:#f3e5f5;
    classDef endpointClass fill:#e8f5e8;
    
    class B,D,F apiClass;
    class ${analysis.tags.map((_, index) => String.fromCharCode(71 + index)).join(',')} moduleClass;`;
  
  await fs.writeFile(filePath, mermaid);
  return filePath;
}

/**
 * Generate flow diagram for a specific tag/module
 */
async function generateTagFlowDiagram(diagramsDir: string, tag: string, analysis: APIAnalysis): Promise<string> {
  const fileName = `${tag.toLowerCase().replace(/\\s+/g, '-')}-flow.mmd`;
  const filePath = path.join(diagramsDir, fileName);
  
  const tagEndpoints = analysis.endpoints.filter(e => e.tags.includes(tag));
  
  const mermaid = `graph TD
    A[Client] --> B[${tag} API]
    
    ${tagEndpoints.map((endpoint, index) => {
      const letter = String.fromCharCode(67 + index); // C, D, E, etc.
      const method = endpoint.method;
      const summary = endpoint.summary || endpoint.operationId || 'Operation';
      
      let flow = `B --> ${letter}[${escapeMermaidText(method + ' ' + endpoint.path)}]\n`;
      flow += `    ${letter} --> ${letter}1{Validate Input}\n`;
      
      // Add success and error paths
      const successResponse = endpoint.responses.find(r => r.statusCode.startsWith('2'));
      const errorResponse = endpoint.responses.find(r => r.statusCode.startsWith('4'));
      
      if (successResponse) {
        flow += `    ${letter}1 -->|Valid| ${letter}2[${escapeMermaidText(successResponse.description)}]\n`;
        flow += `    ${letter}2 --> ${letter}3[Return ${successResponse.statusCode}]\n`;
      }
      
      if (errorResponse) {
        flow += `    ${letter}1 -->|Invalid| ${letter}4[${escapeMermaidText(errorResponse.description)}]\n`;
        flow += `    ${letter}4 --> ${letter}5[Return ${errorResponse.statusCode}]\n`;
      }
      
      return flow;
    }).join('\n    ')}
    
    classDef successClass fill:#e8f5e8;
    classDef errorClass fill:#ffebee;
    classDef processClass fill:#e3f2fd;`;
  
  await fs.writeFile(filePath, mermaid);
  return filePath;
}

/**
 * Generate CRUD operations flow diagram
 */
async function generateCRUDFlowDiagram(diagramsDir: string, analysis: APIAnalysis): Promise<string> {
  const filePath = path.join(diagramsDir, 'crud-operations.mmd');
  
  const crudEndpoints = {
    create: analysis.endpoints.filter(e => e.method === 'POST'),
    read: analysis.endpoints.filter(e => e.method === 'GET'),
    update: analysis.endpoints.filter(e => e.method === 'PUT' || e.method === 'PATCH'),
    delete: analysis.endpoints.filter(e => e.method === 'DELETE')
  };
  
  const mermaid = `graph LR
    A[Resource Lifecycle] --> B[Create]
    A --> C[Read]
    A --> D[Update]
    A --> E[Delete]
    
    ${crudEndpoints.create.length > 0 ? `
    B --> B1[POST Operations]
    ${crudEndpoints.create.map((endpoint, index) => 
      `B1 --> B${index + 2}[${escapeMermaidText(endpoint.path)}]`
    ).join('\n    ')}` : ''}
    
    ${crudEndpoints.read.length > 0 ? `
    C --> C1[GET Operations]
    ${crudEndpoints.read.map((endpoint, index) => 
      `C1 --> C${index + 2}[${escapeMermaidText(endpoint.path)}]`
    ).join('\n    ')}` : ''}
    
    ${crudEndpoints.update.length > 0 ? `
    D --> D1[PUT/PATCH Operations]
    ${crudEndpoints.update.map((endpoint, index) => 
      `D1 --> D${index + 2}[${escapeMermaidText(endpoint.method + ' ' + endpoint.path)}]`
    ).join('\n    ')}` : ''}
    
    ${crudEndpoints.delete.length > 0 ? `
    E --> E1[DELETE Operations]
    ${crudEndpoints.delete.map((endpoint, index) => 
      `E1 --> E${index + 2}[${escapeMermaidText(endpoint.path)}]`
    ).join('\n    ')}` : ''}
    
    classDef createClass fill:#e8f5e8;
    classDef readClass fill:#e3f2fd;
    classDef updateClass fill:#fff3e0;
    classDef deleteClass fill:#ffebee;
    
    class B,B1 createClass;
    class C,C1 readClass;
    class D,D1 updateClass;
    class E,E1 deleteClass;`;
  
  await fs.writeFile(filePath, mermaid);
  return filePath;
}

/**
 * Generate interactive HTML viewer for all diagrams
 */
async function generateInteractiveViewer(
  outputDir: string,
  mermaidFiles: string[],
  analysis: APIAnalysis
): Promise<string> {
  const viewerPath = path.join(outputDir, 'flow-diagrams.html');
  
  // Read all mermaid files
  const diagrams = await Promise.all(
    mermaidFiles.map(async (file) => {
      const content = await fs.readFile(file, 'utf-8');
      const name = path.basename(file, '.mmd');
      return { name, content };
    })
  );
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Flow Diagrams - ${analysis.title}</title>
    <script src="https://unpkg.com/mermaid@10.6.1/dist/mermaid.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        .container {
            display: flex;
            height: calc(100vh - 140px);
        }
        .sidebar {
            width: 250px;
            background: white;
            border-right: 1px solid #e0e0e0;
            overflow-y: auto;
        }
        .diagram-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .diagram-item {
            padding: 15px 20px;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .diagram-item:hover {
            background-color: #f8f9fa;
        }
        .diagram-item.active {
            background-color: #667eea;
            color: white;
        }
        .main-content {
            flex: 1;
            padding: 20px;
            overflow: auto;
            background: white;
        }
        .diagram-container {
            display: none;
        }
        .diagram-container.active {
            display: block;
        }
        .diagram-title {
            font-size: 1.5rem;
            margin-bottom: 20px;
            color: #333;
            text-transform: capitalize;
        }
        .mermaid {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .export-controls {
            margin-bottom: 20px;
        }
        .btn {
            background-color: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
        }
        .btn:hover {
            background-color: #5a6fd8;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>API Flow Diagrams</h1>
        <p>${analysis.title} v${analysis.version}</p>
    </div>
    
    <div class="container">
        <div class="sidebar">
            <ul class="diagram-list">
                ${diagrams.map((diagram, index) => `
                <li class="diagram-item ${index === 0 ? 'active' : ''}" 
                    onclick="showDiagram('${diagram.name}', this)">
                    ${diagram.name.replace(/-/g, ' ').toUpperCase()}
                </li>
                `).join('')}
            </ul>
        </div>
        
        <div class="main-content">
            ${diagrams.map((diagram, index) => `
            <div class="diagram-container ${index === 0 ? 'active' : ''}" id="${diagram.name}">
                <h2 class="diagram-title">${diagram.name.replace(/-/g, ' ')}</h2>
                <div class="export-controls">
                    <button class="btn" onclick="exportDiagram('${diagram.name}', 'png')">Export PNG</button>
                    <button class="btn" onclick="exportDiagram('${diagram.name}', 'svg')">Export SVG</button>
                </div>
                <div class="mermaid" id="mermaid-${diagram.name}">
                    ${diagram.content}
                </div>
            </div>
            `).join('')}
        </div>
    </div>
    
    <script>
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'default',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true
            }
        });
        
        function showDiagram(diagramName, element) {
            // Hide all diagrams
            document.querySelectorAll('.diagram-container').forEach(container => {
                container.classList.remove('active');
            });
            
            // Remove active class from all sidebar items
            document.querySelectorAll('.diagram-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Show selected diagram
            document.getElementById(diagramName).classList.add('active');
            element.classList.add('active');
        }
        
        function exportDiagram(diagramName, format) {
            const element = document.getElementById('mermaid-' + diagramName);
            const svg = element.querySelector('svg');
            
            if (format === 'svg') {
                const svgData = new XMLSerializer().serializeToString(svg);
                const blob = new Blob([svgData], {type: 'image/svg+xml'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = diagramName + '.svg';
                a.click();
                URL.revokeObjectURL(url);
            } else if (format === 'png') {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const data = new XMLSerializer().serializeToString(svg);
                const img = new Image();
                
                img.onload = function() {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    canvas.toBlob(function(blob) {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = diagramName + '.png';
                        a.click();
                        URL.revokeObjectURL(url);
                    });
                };
                
                img.src = 'data:image/svg+xml;base64,' + btoa(data);
            }
        }
    </script>
</body>
</html>`;
  
  await fs.writeFile(viewerPath, html);
  return viewerPath;
}
