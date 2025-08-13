import { TestHistoryManager } from './test-history-manager.js';

async function generateReport() {
  try {
    const environment = process.env.TEST_ENV || 'dev';
    const cycle = process.env.TEST_CYCLE || 'demo-cycle-1';
    
    console.log(`📊 Generating report for cycle: ${cycle} in environment: ${environment}`);
    
    const manager = new TestHistoryManager(environment, cycle);
    await manager.generateCycleReport();
    
    console.log('✅ Report generation completed!');
  } catch (error: any) {
    console.error('❌ Report generation failed:', error.message);
    process.exit(1);
  }
}

generateReport();
