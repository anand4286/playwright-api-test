// Basic usage example
const { SwaggerDashboard } = require('@anand4286/swagger-dashboard');

async function basicExample() {
  // Quick start - process specs and start dashboard
  console.log('🚀 Starting Swagger Dashboard...');
  
  const dashboard = await SwaggerDashboard.quickStart({
    openApiDir: './openapi-specs',
    outputDir: './requirements',
    port: 8888
  });
  
  console.log('✅ Dashboard running on http://localhost:8888');
}

async function stepByStepExample() {
  // Step by step approach
  const dashboard = new SwaggerDashboard({
    port: 8888,
    openApiDir: './openapi-specs',
    requirementsDir: './requirements'
  });
  
  // Process all OpenAPI specs
  console.log('🔄 Processing OpenAPI specifications...');
  const result = await dashboard.processAllSpecs();
  
  console.log(`✅ Processed ${result.totalApis} APIs`);
  console.log(`📋 Generated ${result.totalRequirements} requirements`);
  console.log(`🧪 Generated ${result.totalTestCases} test cases`);
  
  // Start the dashboard server
  console.log('🚀 Starting dashboard server...');
  await dashboard.startServer();
  
  console.log('✅ Dashboard running on http://localhost:8888');
}

async function singleApiExample() {
  // Generate requirements for a single API
  const dashboard = new SwaggerDashboard();
  
  const result = await dashboard.generateRequirements(
    './openapi-specs/user-api.json',
    './requirements'
  );
  
  console.log(`Generated ${result.requirements.length} requirements`);
  console.log(`Generated ${result.testCases.length} test cases`);
}

// Run examples
if (require.main === module) {
  // Uncomment the example you want to run
  basicExample().catch(console.error);
  // stepByStepExample().catch(console.error);
  // singleApiExample().catch(console.error);
}
