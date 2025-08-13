import { SwaggerDashboard, SwaggerRequirementGenerator, SwaggerBatchProcessor } from '@anand4286/swagger-dashboard';

// Advanced TypeScript usage examples

class ApiTestingPipeline {
  private dashboard: SwaggerDashboard;
  
  constructor() {
    this.dashboard = new SwaggerDashboard({
      port: 8888,
      openApiDir: './openapi-specs',
      requirementsDir: './requirements',
      logLevel: 'debug'
    });
  }
  
  async processApiPortfolio(): Promise<void> {
    try {
      // Process all APIs with detailed logging
      console.log('🔄 Starting API portfolio processing...');
      
      const result = await this.dashboard.processAllSpecs();
      
      // Log detailed results
      console.log('📊 Processing Results:');
      console.log(`  Total APIs: ${result.totalApis}`);
      console.log(`  Successful: ${result.successfulApis}`);
      console.log(`  Failed: ${result.failedApis}`);
      console.log(`  Requirements: ${result.totalRequirements}`);
      console.log(`  Test Cases: ${result.totalTestCases}`);
      
      // Process individual results
      for (const apiResult of result.results) {
        if (apiResult.success) {
          console.log(`✅ ${apiResult.apiName}: ${apiResult.requirements} reqs, ${apiResult.testCases} tests`);
        } else {
          console.error(`❌ ${apiResult.fileName}: ${apiResult.error}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Portfolio processing failed:', error);
      throw error;
    }
  }
  
  async generateCustomRequirements(specPath: string): Promise<void> {
    // Advanced requirement generation with custom logic
    const generator = new SwaggerRequirementGenerator(specPath);
    
    const { requirements, testCases } = generator.generateRequirements();
    const metrics = generator.generateMetrics();
    
    // Custom processing of requirements
    const highPriorityRequirements = requirements.filter(req => req.priority === 'HIGH');
    const securityRequirements = requirements.filter(req => 
      req.category === 'Authentication' || req.endpoint.includes('/auth')
    );
    
    console.log('📋 Requirement Analysis:');
    console.log(`  Total Requirements: ${requirements.length}`);
    console.log(`  High Priority: ${highPriorityRequirements.length}`);
    console.log(`  Security Related: ${securityRequirements.length}`);
    console.log(`  Coverage Ratio: ${(testCases.length / metrics.totalEndpoints).toFixed(2)} tests per endpoint`);
    
    // Save with custom naming
    generator.saveResults('./requirements');
  }
  
  async startDashboardWithCustomConfig(): Promise<void> {
    // Start dashboard with custom middleware
    await this.dashboard.startServer({
      port: 9000,
      enableCors: true
    });
    
    const server = this.dashboard.getServer();
    if (server) {
      // Add custom routes or middleware
      const app = server.getApp();
      app.get('/custom/health', (req, res) => {
        res.json({ 
          status: 'custom-healthy',
          timestamp: new Date().toISOString(),
          customData: 'Additional health info'
        });
      });
    }
    
    console.log('🚀 Custom dashboard running on http://localhost:9000');
  }
  
  async batchProcessWithFiltering(): Promise<void> {
    // Custom batch processing with filtering
    const processor = new SwaggerBatchProcessor('./openapi-specs', './requirements');
    
    // Override the private method to add filtering (for demonstration)
    const originalMethod = processor['findSpecFiles'];
    processor['findSpecFiles'] = function() {
      const allFiles = originalMethod.call(this);
      // Filter to only process certain APIs
      return allFiles.filter(file => 
        file.includes('user') || file.includes('product') // Only process user/product APIs
      );
    };
    
    const result = await processor.processAllSpecs();
    console.log(`Processed ${result.successfulApis} filtered APIs`);
  }
}

// Enterprise pipeline example
class EnterpriseDashboard {
  private pipelines: Map<string, ApiTestingPipeline> = new Map();
  
  async setupTeamPipelines(): Promise<void> {
    const teams = ['team-a', 'team-b', 'team-c'];
    
    for (const team of teams) {
      const pipeline = new ApiTestingPipeline();
      pipeline['dashboard'] = new SwaggerDashboard({
        port: 8888 + teams.indexOf(team), // Different ports per team
        openApiDir: `./openapi-specs/${team}`,
        requirementsDir: `./requirements/${team}`
      });
      
      this.pipelines.set(team, pipeline);
      
      // Process each team's APIs
      await pipeline.processApiPortfolio();
      
      console.log(`✅ Team ${team} pipeline ready`);
    }
  }
  
  async startAllDashboards(): Promise<void> {
    for (const [team, pipeline] of this.pipelines) {
      await pipeline.startDashboardWithCustomConfig();
      console.log(`🚀 Dashboard for ${team} started`);
    }
  }
}

// Usage examples
async function runAdvancedExamples() {
  try {
    // Single team pipeline
    const pipeline = new ApiTestingPipeline();
    await pipeline.processApiPortfolio();
    await pipeline.startDashboardWithCustomConfig();
    
    // Enterprise setup
    // const enterprise = new EnterpriseDashboard();
    // await enterprise.setupTeamPipelines();
    // await enterprise.startAllDashboards();
    
  } catch (error) {
    console.error('❌ Advanced example failed:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runAdvancedExamples();
}

export { ApiTestingPipeline, EnterpriseDashboard };
