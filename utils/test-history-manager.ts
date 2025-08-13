import fs from 'fs/promises';
import path from 'path';

export interface TestResult {
  requirementId: string;
  testCaseId: string;
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  executionTime: number;
  timestamp: number;
  environment: string;
  cycle: string;
  error?: string;
  details?: string;
  duration?: number;
  retryCount?: number;
}

export interface TestCycle {
  cycleId: string;
  environment: string;
  startTime: number;
  endTime?: number;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  requirements: string[];
  duration: number;
}

export interface RequirementCoverage {
  requirementId: string;
  passRate: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  lastExecuted?: number;
  category?: string;
}

export class TestHistoryManager {
  private environment: string;
  private cycle: string;
  private historyDir: string;
  private cycleStartTime: number;

  constructor(environment: string, cycle: string) {
    this.environment = environment;
    this.cycle = cycle;
    this.historyDir = path.join(process.cwd(), 'test-history');
    this.cycleStartTime = Date.now();
  }

  async recordTestResult(result: Omit<TestResult, 'timestamp' | 'environment' | 'cycle'>): Promise<void> {
    const fullResult: TestResult = {
      ...result,
      timestamp: Date.now(),
      environment: this.environment,
      cycle: this.cycle
    };

    await this.ensureDirectoryExists();
    
    // Record to cycle-specific file
    const cycleFile = path.join(this.historyDir, `${this.cycle}-${this.environment}.jsonl`);
    await this.appendToFile(cycleFile, fullResult);
    
    // Record to master history
    const masterFile = path.join(this.historyDir, 'master-history.jsonl');
    await this.appendToFile(masterFile, fullResult);

    console.log(`📝 Recorded test result: ${result.testCaseId} - ${result.status}`);
  }

  async generateCycleReport(): Promise<void> {
    const cycleFile = path.join(this.historyDir, `${this.cycle}-${this.environment}.jsonl`);
    
    try {
      const data = await fs.readFile(cycleFile, 'utf-8');
      const results: TestResult[] = data.split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      if (results.length === 0) {
        console.log('⚠️  No test results found for this cycle');
        return;
      }

      const report = this.analyzeCycleResults(results);
      
      // Generate HTML report
      await this.generateHtmlReport(report, results);
      
      // Generate JSON summary
      await this.generateJsonSummary(report);
      
      // Update dashboard data
      await this.updateDashboardData(report);
      
      console.log(`📊 Cycle report generated for ${this.cycle} in ${this.environment} environment`);
      
    } catch (error) {
      console.error('Failed to generate cycle report:', error);
    }
  }

  private analyzeCycleResults(results: TestResult[]) {
    const requirements = [...new Set(results.map(r => r.requirementId))];
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;
    const totalDuration = Date.now() - this.cycleStartTime;

    return {
      cycle: this.cycle,
      environment: this.environment,
      generatedAt: new Date().toISOString(),
      totalTests: results.length,
      passed,
      failed,
      skipped,
      passRate: Math.round((passed / results.length) * 100),
      requirements: requirements.length,
      executionTime: results.reduce((sum, r) => sum + r.executionTime, 0),
      cycleDuration: totalDuration,
      requirementCoverage: this.calculateRequirementCoverage(results),
      trends: this.calculateTrends(results),
      failureAnalysis: this.analyzeFailures(results),
      performanceMetrics: this.calculatePerformanceMetrics(results)
    };
  }

  private calculateRequirementCoverage(results: TestResult[]): RequirementCoverage[] {
    const requirementMap = new Map<string, { total: number; passed: number; failed: number; category: string }>();
    
    results.forEach(result => {
      const req = result.requirementId;
      if (!requirementMap.has(req)) {
        requirementMap.set(req, { 
          total: 0, 
          passed: 0, 
          failed: 0,
          category: req.split('-')[1] || 'General'
        });
      }
      
      const reqData = requirementMap.get(req)!;
      reqData.total++;
      if (result.status === 'PASS') {
        reqData.passed++;
      } else if (result.status === 'FAIL') {
        reqData.failed++;
      }
    });

    return Array.from(requirementMap.entries()).map(([reqId, data]) => ({
      requirementId: reqId,
      passRate: Math.round((data.passed / data.total) * 100),
      totalTests: data.total,
      passedTests: data.passed,
      failedTests: data.failed,
      lastExecuted: Date.now(),
      category: data.category
    }));
  }

  private calculateTrends(results: TestResult[]): any[] {
    // Group by 5-minute intervals for trend analysis
    const intervalMs = 5 * 60 * 1000; // 5 minutes
    const trendData = new Map<number, { passed: number; failed: number; total: number }>();
    
    results.forEach(result => {
      const interval = Math.floor(result.timestamp / intervalMs) * intervalMs;
      if (!trendData.has(interval)) {
        trendData.set(interval, { passed: 0, failed: 0, total: 0 });
      }
      
      const data = trendData.get(interval)!;
      data.total++;
      if (result.status === 'PASS') {
        data.passed++;
      } else if (result.status === 'FAIL') {
        data.failed++;
      }
    });

    return Array.from(trendData.entries())
      .sort(([a], [b]) => a - b)
      .map(([timestamp, data]) => ({
        timestamp: new Date(timestamp).toISOString(),
        passRate: data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0,
        totalTests: data.total,
        passed: data.passed,
        failed: data.failed
      }));
  }

  private analyzeFailures(results: TestResult[]) {
    const failures = results.filter(r => r.status === 'FAIL');
    
    const errorPatterns = new Map<string, number>();
    const requirementFailures = new Map<string, number>();
    
    failures.forEach(failure => {
      // Count error patterns
      if (failure.error) {
        const errorKey = failure.error.split(':')[0]; // Get error type
        errorPatterns.set(errorKey, (errorPatterns.get(errorKey) || 0) + 1);
      }
      
      // Count failures by requirement
      requirementFailures.set(
        failure.requirementId, 
        (requirementFailures.get(failure.requirementId) || 0) + 1
      );
    });

    return {
      totalFailures: failures.length,
      topErrorPatterns: Array.from(errorPatterns.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([error, count]) => ({ error, count })),
      requirementFailures: Array.from(requirementFailures.entries())
        .sort(([,a], [,b]) => b - a)
        .map(([requirement, count]) => ({ requirement, count }))
    };
  }

  private calculatePerformanceMetrics(results: TestResult[]) {
    const executionTimes = results.map(r => r.executionTime).sort((a, b) => a - b);
    const len = executionTimes.length;
    
    if (len === 0) return null;

    return {
      avgExecutionTime: Math.round(executionTimes.reduce((sum, time) => sum + time, 0) / len),
      minExecutionTime: executionTimes[0],
      maxExecutionTime: executionTimes[len - 1],
      medianExecutionTime: len % 2 === 0 
        ? Math.round((executionTimes[len/2 - 1] + executionTimes[len/2]) / 2)
        : executionTimes[Math.floor(len/2)],
      p95ExecutionTime: executionTimes[Math.floor(len * 0.95)],
      slowTests: results
        .filter(r => r.executionTime > 5000)
        .sort((a, b) => b.executionTime - a.executionTime)
        .slice(0, 5)
        .map(r => ({ testCase: r.testCaseId, time: r.executionTime }))
    };
  }

  private async generateHtmlReport(report: any, results: TestResult[]): Promise<void> {
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Petstore API Test Report - ${report.cycle}</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            body { font-family: 'Inter', sans-serif; }
            .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .card-hover:hover { transform: translateY(-2px); transition: all 0.3s ease; }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <div class="gradient-bg text-white py-8">
            <div class="container mx-auto px-4">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-4xl font-bold mb-2">🎭 Petstore API Test Report</h1>
                        <p class="text-xl opacity-90">Cycle: ${report.cycle} | Environment: ${report.environment}</p>
                        <p class="opacity-75">Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-6xl font-bold ${report.passRate >= 90 ? 'text-green-300' : report.passRate >= 80 ? 'text-yellow-300' : 'text-red-300'}">${report.passRate}%</div>
                        <div class="text-lg opacity-90">Pass Rate</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="container mx-auto px-4 py-8">
            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow-lg p-6 text-center card-hover">
                    <i class="fas fa-vial text-blue-500 text-2xl mb-2"></i>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">Total Tests</h3>
                    <p class="text-3xl font-bold text-blue-600">${report.totalTests}</p>
                </div>
                <div class="bg-white rounded-lg shadow-lg p-6 text-center card-hover">
                    <i class="fas fa-check-circle text-green-500 text-2xl mb-2"></i>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">Passed</h3>
                    <p class="text-3xl font-bold text-green-600">${report.passed}</p>
                </div>
                <div class="bg-white rounded-lg shadow-lg p-6 text-center card-hover">
                    <i class="fas fa-times-circle text-red-500 text-2xl mb-2"></i>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">Failed</h3>
                    <p class="text-3xl font-bold text-red-600">${report.failed}</p>
                </div>
                <div class="bg-white rounded-lg shadow-lg p-6 text-center card-hover">
                    <i class="fas fa-minus-circle text-yellow-500 text-2xl mb-2"></i>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">Skipped</h3>
                    <p class="text-3xl font-bold text-yellow-600">${report.skipped}</p>
                </div>
                <div class="bg-white rounded-lg shadow-lg p-6 text-center card-hover">
                    <i class="fas fa-clipboard-list text-purple-500 text-2xl mb-2"></i>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">Requirements</h3>
                    <p class="text-3xl font-bold text-purple-600">${report.requirements}</p>
                </div>
                <div class="bg-white rounded-lg shadow-lg p-6 text-center card-hover">
                    <i class="fas fa-clock text-indigo-500 text-2xl mb-2"></i>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">Duration</h3>
                    <p class="text-3xl font-bold text-indigo-600">${Math.round(report.cycleDuration / 1000)}s</p>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-xl font-semibold mb-4"><i class="fas fa-chart-pie mr-2"></i>Test Results Distribution</h3>
                    <canvas id="resultsChart" width="400" height="200"></canvas>
                </div>
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-xl font-semibold mb-4"><i class="fas fa-chart-bar mr-2"></i>Requirements Coverage</h3>
                    <canvas id="coverageChart" width="400" height="200"></canvas>
                </div>
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-xl font-semibold mb-4"><i class="fas fa-chart-line mr-2"></i>Test Execution Trend</h3>
                    <canvas id="trendChart" width="400" height="200"></canvas>
                </div>
            </div>

            <!-- Performance Metrics -->
            ${report.performanceMetrics ? `
            <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h3 class="text-xl font-semibold mb-4"><i class="fas fa-tachometer-alt mr-2"></i>Performance Metrics</h3>
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div class="text-center">
                        <p class="text-2xl font-bold text-blue-600">${report.performanceMetrics.avgExecutionTime}ms</p>
                        <p class="text-sm text-gray-600">Average</p>
                    </div>
                    <div class="text-center">
                        <p class="text-2xl font-bold text-green-600">${report.performanceMetrics.minExecutionTime}ms</p>
                        <p class="text-sm text-gray-600">Fastest</p>
                    </div>
                    <div class="text-center">
                        <p class="text-2xl font-bold text-red-600">${report.performanceMetrics.maxExecutionTime}ms</p>
                        <p class="text-sm text-gray-600">Slowest</p>
                    </div>
                    <div class="text-center">
                        <p class="text-2xl font-bold text-purple-600">${report.performanceMetrics.medianExecutionTime}ms</p>
                        <p class="text-sm text-gray-600">Median</p>
                    </div>
                    <div class="text-center">
                        <p class="text-2xl font-bold text-orange-600">${report.performanceMetrics.p95ExecutionTime}ms</p>
                        <p class="text-sm text-gray-600">95th Percentile</p>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Requirements Coverage Table -->
            <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h3 class="text-xl font-semibold mb-4"><i class="fas fa-clipboard-check mr-2"></i>Requirements Coverage Detail</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full table-auto">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requirement ID</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Tests</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Passed</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Failed</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pass Rate</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${report.requirementCoverage.map((req: any) => `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${req.requirementId}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-gray-500">${req.category}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-gray-500">${req.totalTests}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-green-600">${req.passedTests}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-red-600">${req.failedTests}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            <div class="w-16 h-2 bg-gray-200 rounded-full mr-2">
                                                <div class="h-2 bg-gradient-to-r from-green-400 to-green-600 rounded-full" style="width: ${req.passRate}%"></div>
                                            </div>
                                            <span class="text-sm font-medium">${req.passRate}%</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                                          req.passRate === 100 
                                            ? 'bg-green-100 text-green-800' 
                                            : req.passRate >= 80 
                                            ? 'bg-yellow-100 text-yellow-800' 
                                            : 'bg-red-100 text-red-800'
                                        }">
                                            ${req.passRate === 100 ? '✅ Passing' : req.passRate >= 80 ? '⚠️ Warning' : '❌ Failing'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Failure Analysis -->
            ${report.failureAnalysis.totalFailures > 0 ? `
            <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h3 class="text-xl font-semibold mb-4 text-red-600"><i class="fas fa-exclamation-triangle mr-2"></i>Failure Analysis</h3>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-semibold mb-3">Top Error Patterns</h4>
                        ${report.failureAnalysis.topErrorPatterns.map((error: any) => `
                            <div class="flex justify-between items-center py-2 border-b">
                                <span class="text-sm">${error.error}</span>
                                <span class="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">${error.count}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div>
                        <h4 class="font-semibold mb-3">Requirements with Failures</h4>
                        ${report.failureAnalysis.requirementFailures.slice(0, 5).map((req: any) => `
                            <div class="flex justify-between items-center py-2 border-b">
                                <span class="text-sm">${req.requirement}</span>
                                <span class="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">${req.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Test Details -->
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h3 class="text-xl font-semibold mb-4"><i class="fas fa-list-ul mr-2"></i>Test Execution Details</h3>
                <div class="space-y-4 max-h-96 overflow-y-auto">
                    ${results.map(result => `
                        <div class="border-l-4 ${result.status === 'PASS' ? 'border-green-500' : result.status === 'FAIL' ? 'border-red-500' : 'border-yellow-500'} pl-4 py-2">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <h4 class="font-medium">${result.testName}</h4>
                                    <p class="text-sm text-gray-600">${result.requirementId} • ${result.testCaseId}</p>
                                    ${result.details ? `<p class="text-sm text-gray-700 mt-1">${result.details}</p>` : ''}
                                    ${result.error ? `<p class="text-sm text-red-600 mt-1 font-mono bg-red-50 p-2 rounded">Error: ${result.error}</p>` : ''}
                                </div>
                                <div class="text-right ml-4">
                                    <span class="px-3 py-1 text-xs font-semibold rounded-full ${
                                      result.status === 'PASS' 
                                        ? 'bg-green-100 text-green-800' 
                                        : result.status === 'FAIL'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }">
                                        ${result.status}
                                    </span>
                                    <p class="text-xs text-gray-500 mt-1">${result.executionTime}ms</p>
                                    <p class="text-xs text-gray-400">${new Date(result.timestamp).toLocaleTimeString()}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <script>
            // Results Chart
            const resultsCtx = document.getElementById('resultsChart').getContext('2d');
            new Chart(resultsCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Passed', 'Failed', 'Skipped'],
                    datasets: [{
                        data: [${report.passed}, ${report.failed}, ${report.skipped}],
                        backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });

            // Coverage Chart
            const coverageCtx = document.getElementById('coverageChart').getContext('2d');
            new Chart(coverageCtx, {
                type: 'bar',
                data: {
                    labels: ${JSON.stringify(report.requirementCoverage.map((r: any) => r.requirementId))},
                    datasets: [{
                        label: 'Pass Rate %',
                        data: ${JSON.stringify(report.requirementCoverage.map((r: any) => r.passRate))},
                        backgroundColor: '#3B82F6',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true, max: 100 }
                    }
                }
            });

            // Trend Chart
            const trendCtx = document.getElementById('trendChart').getContext('2d');
            new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: ${JSON.stringify(report.trends.map((t: any) => new Date(t.timestamp).toLocaleTimeString()))},
                    datasets: [{
                        label: 'Pass Rate %',
                        data: ${JSON.stringify(report.trends.map((t: any) => t.passRate))},
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true, max: 100 }
                    }
                }
            });
        </script>
    </body>
    </html>
    `;

    const reportsDir = path.join(process.cwd(), 'test-reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const reportFile = path.join(reportsDir, `${this.cycle}-${this.environment}-report.html`);
    await fs.writeFile(reportFile, htmlTemplate);
    
    console.log(`📊 HTML Report generated: ${reportFile}`);
  }

  private async generateJsonSummary(report: any): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'test-reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const summaryFile = path.join(reportsDir, `${this.cycle}-${this.environment}-summary.json`);
    await fs.writeFile(summaryFile, JSON.stringify(report, null, 2));
    
    console.log(`📋 JSON Summary generated: ${summaryFile}`);
  }

  private async ensureDirectoryExists(): Promise<void> {
    await fs.mkdir(this.historyDir, { recursive: true });
  }

  private async appendToFile(filePath: string, data: TestResult): Promise<void> {
    await fs.appendFile(filePath, JSON.stringify(data) + '\n');
  }

  private async updateDashboardData(report: any): Promise<void> {
    const dashboardDir = path.join(process.cwd(), 'dashboard', 'data');
    await fs.mkdir(dashboardDir, { recursive: true });
    
    // Update latest results
    const dashboardFile = path.join(dashboardDir, 'latest-results.json');
    await fs.writeFile(dashboardFile, JSON.stringify(report, null, 2));
    
    // Update historical data
    const historyFile = path.join(dashboardDir, 'test-history.json');
    let history = [];
    
    try {
      const historyData = await fs.readFile(historyFile, 'utf-8');
      history = JSON.parse(historyData);
    } catch (error) {
      // File doesn't exist, start with empty array
    }
    
    // Add current report to history (keep last 50 cycles)
    history.push({
      cycle: report.cycle,
      environment: report.environment,
      timestamp: report.generatedAt,
      passRate: report.passRate,
      totalTests: report.totalTests,
      passed: report.passed,
      failed: report.failed
    });
    
    if (history.length > 50) {
      history = history.slice(-50);
    }
    
    await fs.writeFile(historyFile, JSON.stringify(history, null, 2));
    
    console.log(`📈 Dashboard data updated`);
  }

  // Utility methods
  async getTestHistory(requirementId?: string): Promise<TestResult[]> {
    try {
      const masterFile = path.join(this.historyDir, 'master-history.jsonl');
      const data = await fs.readFile(masterFile, 'utf-8');
      const results = data.split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      if (requirementId) {
        return results.filter(r => r.requirementId === requirementId);
      }

      return results;
    } catch (error) {
      return [];
    }
  }

  async getCycleComparison(cycles: string[]): Promise<any> {
    const comparison = [];
    
    for (const cycle of cycles) {
      const cycleFile = path.join(this.historyDir, `${cycle}-${this.environment}.jsonl`);
      try {
        const data = await fs.readFile(cycleFile, 'utf-8');
        const results = data.split('\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line));
        
        if (results.length > 0) {
          const passed = results.filter(r => r.status === 'PASS').length;
          comparison.push({
            cycle,
            totalTests: results.length,
            passed,
            failed: results.filter(r => r.status === 'FAIL').length,
            passRate: Math.round((passed / results.length) * 100)
          });
        }
      } catch (error) {
        // Cycle file doesn't exist
      }
    }
    
    return comparison;
  }
}
