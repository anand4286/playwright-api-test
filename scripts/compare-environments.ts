import { envManager } from '../utils/environmentManager';

// Console colors
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function colorize(color: keyof typeof colors, text: string): string {
  return `${colors[color]}${text}${colors.reset}`;
}

async function compareEnvironments() {
  console.log(colorize('blue', '🔍 Environment Configuration Comparison\n'));
  
  const environments = envManager.getAvailableEnvironments();
  
  if (environments.length < 2) {
    console.log(colorize('red', '❌ Need at least 2 environments to compare'));
    process.exit(1);
  }
  
  console.log(colorize('cyan', `Available environments: ${environments.join(', ')}\n`));
  
  // Compare configurations
  const configs: { [key: string]: any } = {};
  
  for (const env of environments) {
    try {
      envManager.loadEnvironment(env);
      configs[env] = envManager.getConfig();
    } catch (error) {
      console.log(colorize('red', `❌ Failed to load ${env}: ${error}`));
      continue;
    }
  }
  
  // Compare key configurations
  const configKeys = [
    'baseUrl',
    'testConfig.timeout',
    'testConfig.retries',
    'testConfig.parallelWorkers',
    'featureFlags.enableDebugMode',
    'performance.maxResponseTimeMs',
    'performance.minSuccessRatePercent'
  ];
  
  console.log(colorize('yellow', '📊 Configuration Comparison:'));
  console.log('='.repeat(80));
  
  // Table header
  const headerRow = '| Configuration'.padEnd(30) + '|' + 
    environments.map(env => ` ${env}`.padEnd(15)).join('|') + '|';
  console.log(headerRow);
  console.log('|' + '-'.repeat(29) + '|' + environments.map(() => '-'.repeat(14)).join('|') + '|');
  
  for (const key of configKeys) {
    const row = `| ${key}`.padEnd(30) + '|';
    const values = environments.map(env => {
      const config = configs[env];
      if (!config) return ' N/A'.padEnd(15);
      
      const value = getNestedValue(config, key);
      return ` ${value}`.padEnd(15);
    }).join('|');
    
    console.log(row + values + '|');
  }
  
  console.log('='.repeat(80));
  
  // Highlight differences
  console.log(colorize('yellow', '\n🔍 Key Differences:'));
  
  for (const key of configKeys) {
    const values = environments.map(env => getNestedValue(configs[env], key));
    const uniqueValues = [...new Set(values)];
    
    if (uniqueValues.length > 1) {
      console.log(colorize('cyan', `\n${key}:`));
      environments.forEach((env, index) => {
        const value = values[index];
        const color = value === uniqueValues[0] ? 'green' : 'yellow';
        console.log(colorize(color, `  ${env}: ${value}`));
      });
    }
  }
  
  // Environment recommendations
  console.log(colorize('blue', '\n💡 Recommendations:'));
  
  const hasProductionConfig = environments.includes('prod');
  if (hasProductionConfig) {
    const prodConfig = configs['prod'];
    if (prodConfig.testConfig.parallelWorkers > 1) {
      console.log(colorize('yellow', '⚠️  Consider using 1 worker for production tests'));
    }
    if (prodConfig.featureFlags.enableDebugMode) {
      console.log(colorize('yellow', '⚠️  Debug mode should be disabled in production'));
    }
  }
  
  const devConfig = configs['dev'];
  if (devConfig && !devConfig.featureFlags.enableDebugMode) {
    console.log(colorize('yellow', '💡 Consider enabling debug mode in development'));
  }
  
  console.log(colorize('green', '\n✅ Environment comparison completed!'));
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : 'N/A';
  }, obj);
}

compareEnvironments().catch(console.error);
