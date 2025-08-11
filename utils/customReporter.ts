import fs from 'fs';
import path from 'path';
import { Reporter, TestCase, TestResult as PlaywrightTestResult, TestError, FullConfig, Suite } from '@playwright/test/reporter';
import { TestResult, TestReportData, TestSummary } from '../types/index.js';

class CustomReporter implements Reporter {
  private startTime: number;
  private results: TestReportData;

  constructor() {
    this.startTime = Date.now();
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      flaky: 0,
      tests: [],
      summary: {} as TestSummary,
      apiLogs: []
    };
    
    // Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
  }

  onBegin(config: FullConfig, suite: Suite): void {
    console.log(`Starting test execution with ${suite.allTests().length} tests`);
    this.results.total = suite.allTests().length;
  }

  onTestBegin(test: TestCase): void {
    console.log(`Starting test: ${test.title}`);
  }

  onTestEnd(test: TestCase, result: PlaywrightTestResult): void {
    // Map Playwright status to our TestResult status
    const mapStatus = (status: string): 'passed' | 'failed' | 'skipped' | 'flaky' | 'interrupted' | 'timedOut' => {
      if (status === 'interrupted' || status === 'timedOut') {
        return status as 'interrupted' | 'timedOut';
      }
      return status as 'passed' | 'failed' | 'skipped' | 'flaky';
    };

    const testResult: TestResult = {
      title: test.title,
      file: test.location.file,
      line: test.location.line,
      status: mapStatus(result.status),
      duration: result.duration,
      error: result.error?.message || undefined,
      retry: result.retry,
      annotations: test.annotations,
      tags: this.extractTags(test.title),
      timestamp: new Date().toISOString()
    };

    this.results.tests.push(testResult);

    switch (testResult.status) {
      case 'passed':
        this.results.passed++;
        break;
      case 'failed':
        this.results.failed++;
        break;
      case 'skipped':
        this.results.skipped++;
        break;
      case 'flaky':
      case 'interrupted':
      case 'timedOut':
        this.results.flaky++;
        break;
    }

    console.log(`Test ${testResult.status}: ${test.title} (${result.duration}ms)`);
  }

  onEnd(result: { status: string }): void {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    this.results.summary = {
      status: result.status,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration: duration,
      success: this.results.failed === 0
    };

    // Generate detailed report
    this.generateDetailedReport();
    
    // Generate test execution summary
    this.generateExecutionSummary();
    
    // Generate API logs report
    this.generateApiLogsReport();

    console.log(`\n=== Test Execution Summary ===`);
    console.log(`Total: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Skipped: ${this.results.skipped}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(2)}%`);
  }

  private extractTags(title: string): string[] {
    const tagRegex = /@(\w+)/g;
    const tags: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = tagRegex.exec(title)) !== null) {
      tags.push(match[1]);
    }
    return tags;
  }

  private generateDetailedReport(): void {
    const reportPath = path.join(process.cwd(), 'reports', 'detailed-test-report.json');
    const reportData = {
      ...this.results,
      generatedAt: new Date().toISOString(),
      framework: 'Playwright API Testing',
      version: '1.0.0'
    };

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`Detailed report generated: ${reportPath}`);
  }

  private generateExecutionSummary(): void {
    const summaryPath = path.join(process.cwd(), 'reports', 'execution-summary.html');
    const htmlContent = this.generateHtmlReport();
    
    fs.writeFileSync(summaryPath, htmlContent);
    console.log(`HTML summary generated: ${summaryPath}`);
  }

  private generateApiLogsReport(): void {
    // Read API logs from the log files
    const logsPath = path.join(process.cwd(), 'logs', 'api-requests.log');
    
    if (fs.existsSync(logsPath)) {
      const apiLogsReportPath = path.join(process.cwd(), 'reports', 'api-logs-report.json');
      const logContent = fs.readFileSync(logsPath, 'utf-8');
      const apiLogs = logContent.split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const apiReport = {
        totalRequests: apiLogs.length,
        requests: apiLogs,
        summary: this.analyzeApiLogs(apiLogs),
        generatedAt: new Date().toISOString()
      };

      fs.writeFileSync(apiLogsReportPath, JSON.stringify(apiReport, null, 2));
      console.log(`API logs report generated: ${apiLogsReportPath}`);
    }
  }

  private analyzeApiLogs(logs: any[]): any {
    const requests = logs.filter(log => log.type === 'api_request');
    const responses = logs.filter(log => log.type === 'api_response');
    
    const methodCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    const avgResponseTimes: Record<string, number> = {};

    requests.forEach(req => {
      methodCounts[req.method] = (methodCounts[req.method] || 0) + 1;
    });

    responses.forEach(res => {
      if (res.status !== 'ERROR') {
        statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
        
        if (res.responseTime) {
          if (!avgResponseTimes[res.status]) {
            avgResponseTimes[res.status] = 0;
          }
          const currentAvg = avgResponseTimes[res.status];
          const count = statusCounts[res.status];
          avgResponseTimes[res.status] = ((currentAvg * (count - 1)) + res.responseTime) / count;
        }
      }
    });

    // Round averages
    Object.keys(avgResponseTimes).forEach(status => {
      avgResponseTimes[status] = Math.round(avgResponseTimes[status]);
    });

    return {
      methodCounts,
      statusCounts,
      avgResponseTimes,
      totalRequests: requests.length,
      totalResponses: responses.length
    };
  }

  private generateHtmlReport(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Playwright API Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }
        .card.passed { border-left-color: #28a745; }
        .card.failed { border-left-color: #dc3545; }
        .card.skipped { border-left-color: #ffc107; }
        .card h3 { margin: 0 0 10px 0; font-size: 2em; }
        .card p { margin: 0; color: #666; }
        .tests-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .tests-table th, .tests-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .tests-table th { background-color: #f8f9fa; font-weight: bold; }
        .status { padding: 4px 8px; border-radius: 4px; color: white; font-size: 0.9em; }
        .status.passed { background-color: #28a745; }
        .status.failed { background-color: #dc3545; }
        .status.skipped { background-color: #ffc107; }
        .tags { font-size: 0.8em; color: #666; }
        .tag { background: #e9ecef; padding: 2px 6px; border-radius: 3px; margin-right: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Playwright API Test Execution Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Duration: ${this.results.summary.duration}ms</p>
        </div>
        
        <div class="summary">
            <div class="card">
                <h3>${this.results.total}</h3>
                <p>Total Tests</p>
            </div>
            <div class="card passed">
                <h3>${this.results.passed}</h3>
                <p>Passed</p>
            </div>
            <div class="card failed">
                <h3>${this.results.failed}</h3>
                <p>Failed</p>
            </div>
            <div class="card skipped">
                <h3>${this.results.skipped}</h3>
                <p>Skipped</p>
            </div>
        </div>

        <h2>Test Results</h2>
        <table class="tests-table">
            <thead>
                <tr>
                    <th>Test Name</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Tags</th>
                    <th>File</th>
                </tr>
            </thead>
            <tbody>
                ${this.results.tests.map(test => `
                    <tr>
                        <td>${test.title.replace(/@\w+/g, '').trim()}</td>
                        <td><span class="status ${test.status}">${test.status.toUpperCase()}</span></td>
                        <td>${test.duration}ms</td>
                        <td class="tags">
                            ${test.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </td>
                        <td>${path.basename(test.file)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;
  }
}

export default CustomReporter;
