import { FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Global teardown function that runs after all tests complete
 * Automatically opens dashboard and test reports
 */
async function globalTeardown(config: FullConfig) {
  console.log('\n🏁 Test execution completed. Opening reports...\n');

  const dashboardUrl = 'http://localhost:5000/';
  const reportPath = 'reports/html-report/index.html';

  // Small delay to ensure HTML report is generated
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    console.log(`🔍 Opening dashboard: ${dashboardUrl}`);
    
    // Cross-platform command to open URL  
    const command = process.platform === 'darwin' ? 'open' : 
                   process.platform === 'win32' ? 'start' : 'xdg-open';
    
    await execAsync(`${command} "${dashboardUrl}"`).catch(() => {
      console.log('⚠️  Dashboard not accessible - make sure it\'s running');
    });
    
    console.log(`✅ Dashboard opened: ${dashboardUrl}`);
    
    // Delay between opening
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Open HTML report file directly (no server needed)
    console.log(`🔍 Opening HTML report: ${reportPath}`);
    await execAsync(`${command} "${reportPath}"`).catch(() => {
      console.log('⚠️  HTML report not found - may not be generated yet');
    });
    
    console.log(`✅ HTML report opened: ${reportPath}`);
    
  } catch (error) {
    console.log(`⚠️  Error opening reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('\n📊 Reports opened in your browser!\n');
  console.log('🌐 Dashboard: http://localhost:5000/');
  console.log('📋 Test Report: Static HTML file opened\n');
  
  console.log('✨ Test execution complete - no manual closing needed!');
  console.log('   The reports will remain open in your browser tabs.\n');
}

export default globalTeardown;
