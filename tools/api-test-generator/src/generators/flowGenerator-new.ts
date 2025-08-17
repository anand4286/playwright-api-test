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
  
  // Generate interactive HTML viewer with step-based flows
  const interactive = await generateInteractiveStepFlows(outputDir, analysis);
  
  return {
    diagrams: [interactive],
    interactive,
    mermaidFiles: []
  };
}

/**
 * Generate interactive HTML viewer with step-based flows (like flow-diagrams-simple.html)
 */
async function generateInteractiveStepFlows(
  outputDir: string,
  analysis: APIAnalysis
): Promise<string> {
  const viewerPath = path.join(outputDir, 'flow-diagrams.html');
  
  // Group endpoints by tags for flow sections
  const tagGroups = analysis.tags.map(tag => ({
    name: tag,
    endpoints: analysis.endpoints.filter(e => e.tags.includes(tag)),
    icon: getTagIcon(tag)
  }));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${analysis.title} - Interactive Flow Diagrams</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 35%, #667eea 100%);
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
            display: flex;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.3) 0%, transparent 50%);
            pointer-events: none;
            z-index: -1;
        }
        
        .container {
            flex: 1;
            margin-left: 280px;
            padding: 20px;
            max-width: none;
        }

        /* Left Sidebar Navigation */
        .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            width: 280px;
            height: 100vh;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(255, 255, 255, 0.2);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
        }

        .sidebar-header {
            padding: 30px 25px 20px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
        }

        .sidebar-title {
            font-size: 1.5em;
            font-weight: 700;
            margin: 0;
            text-align: center;
        }

        .sidebar-subtitle {
            font-size: 0.9em;
            opacity: 0.9;
            text-align: center;
            margin: 5px 0 0 0;
        }

        .nav-tabs {
            flex: 1;
            padding: 20px 15px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .nav-tab {
            padding: 16px 20px;
            background: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 500;
            color: #4a5568;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(10px);
            font-size: 0.95em;
        }
        
        .nav-tab::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
            transition: left 0.5s;
        }
        
        .nav-tab:hover::before {
            left: 100%;
        }
        
        .nav-tab:hover {
            background: rgba(102, 126, 234, 0.15);
            transform: translateX(5px);
            border-color: rgba(102, 126, 234, 0.3);
        }
        
        .nav-tab.active {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border-color: rgba(255, 255, 255, 0.3);
            transform: translateX(5px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .sidebar-stats {
            padding: 20px;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
            background: rgba(102, 126, 234, 0.05);
        }

        .sidebar-stat {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            font-size: 0.9em;
            color: #4a5568;
        }

        .sidebar-stat-value {
            font-weight: 600;
            color: #667eea;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
            padding: 40px 20px;
        }
        
        .header h1 {
            font-size: 3.5em;
            margin: 0;
            text-shadow: 0 4px 20px rgba(0,0,0,0.3);
            font-weight: 700;
            letter-spacing: -1px;
            background: linear-gradient(45deg, #fff, #f0f8ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 1.1em;
            margin-top: 15px;
            font-weight: 400;
        }

        .breadcrumb {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 12px 20px;
            border-radius: 50px;
            margin-bottom: 30px;
            text-align: center;
            color: white;
            font-size: 0.9em;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .diagram-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 35px;
            margin-bottom: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .diagram-title {
            font-size: 2em;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .diagram-description {
            color: #4a5568;
            font-size: 1.1em;
            text-align: center;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .flow-steps {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
            margin-top: 30px;
        }
        
        .step-box {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-radius: 16px;
            padding: 25px;
            position: relative;
            transition: all 0.3s ease;
            border: 2px solid transparent;
            overflow: hidden;
        }
        
        .step-box::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            transition: left 0.6s;
        }
        
        .step-box:hover::before {
            left: 100%;
        }
        
        .step-box:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            border-color: rgba(102, 126, 234, 0.3);
        }
        
        .step-box.start {
            background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
            border-color: #38b2ac;
        }
        
        .step-box.process {
            background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%);
            border-color: #3182ce;
        }
        
        .step-box.end {
            background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
            border-color: #38a169;
        }
        
        .step-icon {
            font-size: 2.5em;
            display: block;
            text-align: center;
            margin-bottom: 15px;
        }
        
        .step-title {
            font-size: 1.3em;
            font-weight: 700;
            color: #2d3748;
            text-align: center;
            margin-bottom: 12px;
        }
        
        .step-description {
            color: #4a5568;
            line-height: 1.5;
            text-align: center;
            margin-bottom: 15px;
        }

        .api-badge {
            display: inline-block;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            margin: 8px auto;
            letter-spacing: 0.5px;
            display: block;
            text-align: center;
            width: fit-content;
        }

        .endpoint-list {
            margin-top: 15px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }

        .endpoint-item {
            display: flex;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            font-size: 0.9em;
        }

        .endpoint-item:last-child {
            border-bottom: none;
        }

        .method-badge {
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.75em;
            font-weight: 600;
            margin-right: 10px;
            min-width: 50px;
            text-align: center;
        }

        .method-get { background: #48bb78; color: white; }
        .method-post { background: #3182ce; color: white; }
        .method-put { background: #ed8936; color: white; }
        .method-patch { background: #805ad5; color: white; }
        .method-delete { background: #e53e3e; color: white; }

        .endpoint-path {
            color: #4a5568;
            font-family: 'Monaco', 'Consolas', monospace;
            flex: 1;
        }

        @media (max-width: 768px) {
            .sidebar {
                width: 100%;
                height: auto;
                position: relative;
                box-shadow: none;
                border-right: none;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .container {
                margin-left: 0;
            }
            
            .nav-tabs {
                flex-direction: row;
                overflow-x: auto;
                padding: 15px;
            }
            
            .nav-tab {
                min-width: 120px;
                text-align: center;
                font-size: 0.9em;
                padding: 12px 16px;
            }
            
            .sidebar-stats {
                display: none;
            }

            .flow-steps {
                grid-template-columns: 1fr;
                gap: 20px;
            }
        }
    </style>
</head>
<body>
    <!-- Left Sidebar Navigation -->
    <div class="sidebar">
        <div class="sidebar-header">
            <h1 class="sidebar-title">🌊 Flow Diagrams</h1>
            <p class="sidebar-subtitle">${analysis.title}</p>
        </div>
        
        <div class="nav-tabs">
            <button class="nav-tab active" onclick="showTab('overview')">📊 API Overview</button>
            ${tagGroups.map(group => 
              `<button class="nav-tab" onclick="showTab('${group.name.toLowerCase().replace(/\\s+/g, '-')}')">${group.icon} ${group.name}</button>`
            ).join('')}
            <button class="nav-tab" onclick="showTab('crud')">🔄 CRUD Operations</button>
        </div>
        
        <div class="sidebar-stats">
            <div class="sidebar-stat">
                <span>Flow Types</span>
                <span class="sidebar-stat-value">${tagGroups.length + 2}</span>
            </div>
            <div class="sidebar-stat">
                <span>Endpoints</span>
                <span class="sidebar-stat-value">${analysis.endpoints.length}</span>
            </div>
            <div class="sidebar-stat">
                <span>API Version</span>
                <span class="sidebar-stat-value">${analysis.version}</span>
            </div>
            <div class="sidebar-stat">
                <span>Modules</span>
                <span class="sidebar-stat-value">${tagGroups.length}</span>
            </div>
        </div>
    </div>

    <!-- Main Content Area -->
    <div class="container">
        <div class="header">
            <h1>🌊 Interactive Flow Diagrams</h1>
            <p>${analysis.title} - Visual process flows for stakeholders</p>
            <div class="subtitle">Professional workflow visualization for business and technical teams</div>
        </div>

        <div class="breadcrumb">
            API Documentation → Flow Diagrams → Interactive Workflows
        </div>

        <!-- Overview Flow -->
        <div id="overview" class="tab-content active">
            <div class="diagram-container">
                <div class="diagram-title">🏢 ${analysis.title} - System Overview</div>
                <div class="diagram-description">
                    High-level view of the ${analysis.title} showing the main modules and their relationships.
                    This dashboard provides comprehensive API structure and endpoint organization.
                </div>
                
                <div class="flow-steps">
                    ${tagGroups.map(group => `
                    <div class="step-box ${getStepType(group.name)}">
                        <span class="step-icon">${group.icon}</span>
                        <div class="step-title">${group.name}</div>
                        <div class="step-description">${generateGroupDescription(group.name, group.endpoints)}</div>
                        <div class="api-badge">${group.endpoints.length} Endpoint${group.endpoints.length !== 1 ? 's' : ''}</div>
                        <div class="endpoint-list">
                            ${group.endpoints.slice(0, 5).map(endpoint => `
                            <div class="endpoint-item">
                                <span class="method-badge method-${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                                <span class="endpoint-path">${endpoint.path}</span>
                            </div>
                            `).join('')}
                            ${group.endpoints.length > 5 ? `<div class="endpoint-item"><em>... and ${group.endpoints.length - 5} more</em></div>` : ''}
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>
        </div>

        ${tagGroups.map(group => generateTagFlowSection(group)).join('')}

        <!-- CRUD Operations Flow -->
        <div id="crud" class="tab-content">
            <div class="diagram-container">
                <div class="diagram-title">🔄 CRUD Operations Flow</div>
                <div class="diagram-description">
                    Standard Create, Read, Update, Delete operations across all API resources.
                    This view organizes endpoints by their primary function.
                </div>
                
                ${generateCRUDFlowSteps(analysis)}
            </div>
        </div>
    </div>

    <script>
        function showTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active class from all nav tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked nav tab
            event.target.classList.add('active');
        }
    </script>
</body>
</html>`;
  
  await fs.writeFile(viewerPath, html);
  return viewerPath;
}

function getTagIcon(tag: string): string {
  const iconMap: Record<string, string> = {
    'users': '👤',
    'user': '👤',
    'posts': '📝',
    'post': '📝',
    'comments': '💬',
    'comment': '💬',
    'messages': '💌',
    'message': '💌',
    'notifications': '🔔',
    'notification': '🔔',
    'social': '🤝',
    'devices': '📱',
    'device': '📱',
    'telemetry': '📊',
    'commands': '⚡',
    'command': '⚡',
    'locations': '📍',
    'location': '📍',
    'alerts': '🚨',
    'alert': '🚨',
    'analytics': '📈',
    'products': '📦',
    'product': '📦',
    'orders': '🛒',
    'order': '🛒',
    'customers': '👥',
    'customer': '👥',
    'inventory': '📋',
    'accounts': '💳',
    'account': '💳',
    'transactions': '💰',
    'transaction': '💰',
    'transfers': '🔄',
    'transfer': '🔄',
    'payments': '💳',
    'payment': '💳',
    'loans': '🏦',
    'loan': '🏦',
    'cards': '💳',
    'card': '💳'
  };
  
  return iconMap[tag.toLowerCase()] || '🔧';
}

function getStepType(tag: string): string {
  const startTags = ['users', 'user', 'accounts', 'account', 'devices', 'device'];
  const endTags = ['analytics', 'notifications', 'notification', 'alerts', 'alert'];
  
  if (startTags.some(t => tag.toLowerCase().includes(t))) return 'start';
  if (endTags.some(t => tag.toLowerCase().includes(t))) return 'end';
  return 'process';
}

function generateGroupDescription(tagName: string, endpoints: any[]): string {
  const descriptions: Record<string, string> = {
    'users': 'Manage user accounts, authentication, profiles, and user lifecycle operations.',
    'posts': 'Create, read, update, and delete posts. Manage content and social interactions.',
    'comments': 'Handle comment creation, moderation, and threaded discussions.',
    'messages': 'Direct messaging system for private communications between users.',
    'notifications': 'Push notifications, alerts, and real-time communication management.',
    'social': 'Social interactions including likes, follows, and relationship management.',
    'devices': 'IoT device registration, configuration, and lifecycle management.',
    'telemetry': 'Sensor data collection, storage, and retrieval with time-series analytics.',
    'commands': 'Remote device control and command execution with status tracking.',
    'locations': 'Physical location management for organizing and grouping devices.',
    'alerts': 'Automated alerting system for device issues and threshold violations.',
    'analytics': 'Data visualization and analytics dashboards for operational insights.',
    'products': 'Product catalog management with inventory tracking and pricing.',
    'orders': 'Order processing, fulfillment, and status tracking.',
    'customers': 'Customer relationship management and account operations.',
    'inventory': 'Stock management, inventory tracking, and supply chain operations.',
    'accounts': 'Banking account management and financial operations.',
    'transactions': 'Financial transaction processing and history tracking.',
    'transfers': 'Money transfer operations between accounts and external systems.',
    'payments': 'Payment processing, billing, and financial settlements.',
    'loans': 'Loan applications, approvals, and account management.',
    'cards': 'Credit and debit card management and operations.'
  };
  
  return descriptions[tagName.toLowerCase()] || `Manage ${tagName.toLowerCase()} operations with comprehensive API endpoints.`;
}

function generateTagFlowSection(group: any): string {
  const tabId = group.name.toLowerCase().replace(/\\s+/g, '-');
  
  return `
        <!-- ${group.name} Flow -->
        <div id="${tabId}" class="tab-content">
            <div class="diagram-container">
                <div class="diagram-title">${group.icon} ${group.name} Management Flow</div>
                <div class="diagram-description">
                    Detailed workflow for ${group.name.toLowerCase()} operations showing request/response patterns and business logic.
                </div>
                
                <div class="flow-steps">
                    ${group.endpoints.map((endpoint: any, index: number) => `
                    <div class="step-box ${index === 0 ? 'start' : index === group.endpoints.length - 1 ? 'end' : 'process'}">
                        <span class="step-icon">${getMethodIcon(endpoint.method)}</span>
                        <div class="step-title">${endpoint.method} ${endpoint.path}</div>
                        <div class="step-description">
                            ${endpoint.summary || endpoint.description || `${endpoint.method} operation for ${group.name.toLowerCase()}`}
                        </div>
                        <div class="api-badge">${endpoint.method} Request</div>
                        ${endpoint.parameters && endpoint.parameters.length > 0 ? `
                        <div class="endpoint-list">
                            <strong>Parameters:</strong>
                            ${endpoint.parameters.slice(0, 3).map((param: any) => `
                            <div class="endpoint-item">
                                <span class="method-badge method-${param.required ? 'post' : 'get'}">${param.required ? 'Required' : 'Optional'}</span>
                                <span class="endpoint-path">${param.name} (${param.in})</span>
                            </div>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                    `).join('')}
                </div>
            </div>
        </div>`;
}

function generateCRUDFlowSteps(analysis: any): string {
  const crudOperations = {
    'Create': analysis.endpoints.filter((e: any) => e.method === 'POST'),
    'Read': analysis.endpoints.filter((e: any) => e.method === 'GET'),
    'Update': analysis.endpoints.filter((e: any) => e.method === 'PUT' || e.method === 'PATCH'),
    'Delete': analysis.endpoints.filter((e: any) => e.method === 'DELETE')
  };

  return `
                <div class="flow-steps">
                    ${Object.entries(crudOperations).map(([operation, endpoints]) => `
                    <div class="step-box ${operation === 'Create' ? 'start' : operation === 'Delete' ? 'end' : 'process'}">
                        <span class="step-icon">${getCRUDIcon(operation)}</span>
                        <div class="step-title">${operation} Operations</div>
                        <div class="step-description">
                            ${getCRUDDescription(operation)} Includes ${endpoints.length} endpoint${endpoints.length !== 1 ? 's' : ''} across all resources.
                        </div>
                        <div class="api-badge">${endpoints.length} Endpoint${endpoints.length !== 1 ? 's' : ''}</div>
                        <div class="endpoint-list">
                            ${endpoints.slice(0, 5).map((endpoint: any) => `
                            <div class="endpoint-item">
                                <span class="method-badge method-${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                                <span class="endpoint-path">${endpoint.path}</span>
                            </div>
                            `).join('')}
                            ${endpoints.length > 5 ? `<div class="endpoint-item"><em>... and ${endpoints.length - 5} more</em></div>` : ''}
                        </div>
                    </div>
                    `).join('')}
                </div>`;
}

function getMethodIcon(method: string): string {
  const iconMap: Record<string, string> = {
    'GET': '🔍',
    'POST': '✨',
    'PUT': '🔄',
    'PATCH': '✏️',
    'DELETE': '🗑️'
  };
  return iconMap[method] || '🔧';
}

function getCRUDIcon(operation: string): string {
  const iconMap: Record<string, string> = {
    'Create': '✨',
    'Read': '🔍',
    'Update': '🔄',
    'Delete': '🗑️'
  };
  return iconMap[operation] || '🔧';
}

function getCRUDDescription(operation: string): string {
  const descriptions: Record<string, string> = {
    'Create': 'Add new resources to the system with validation and business rules.',
    'Read': 'Retrieve and query existing resources with filtering and pagination.',
    'Update': 'Modify existing resources with partial or complete updates.',
    'Delete': 'Remove resources from the system with proper cleanup and validation.'
  };
  return descriptions[operation] || `${operation} operations on API resources.`;
}
