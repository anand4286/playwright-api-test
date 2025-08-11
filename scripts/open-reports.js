#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Post-test script to automatically open dashboard and test reports
 */
async function openReports() {
  const dashboardUrl = 'http://localhost:5000/';
  const reportPath = 'reports/html-report/index.html';
  
  console.log('\n🚀 Opening test reports and dashboard...\n');

  try {
    // Open dashboard
    console.log(`🔍 Opening dashboard: ${dashboardUrl}`);
    
    const command = process.platform === 'darwin' ? 'open' : 
                   process.platform === 'win32' ? 'start' : 'xdg-open';
    
    await execAsync(`${command} "${dashboardUrl}"`);
    console.log(`✅ Dashboard opened: ${dashboardUrl}`);
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Open HTML report file directly (no server needed)
    console.log(`🔍 Opening HTML report: ${reportPath}`);
    await execAsync(`${command} "${reportPath}"`);
    console.log(`✅ HTML report opened: ${reportPath}`);
    
  } catch (error) {
    console.log(`⚠️  Error opening reports: ${error.message}`);
    console.log('   💡 Dashboard: Make sure it\'s running with: npm run start:dashboard');
    console.log('   💡 Report: Check if reports/html-report/index.html exists');
  }

  console.log('\n📊 Reports opened successfully - no manual closing needed!\n');
}

// Execute if run directly
if (require.main === module) {
  openReports().catch(console.error);
}

module.exports = { openReports };
