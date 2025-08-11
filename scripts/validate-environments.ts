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

async function validateEnvironments() {
  console.log(colorize('blue', '🔍 Validating Environment Configurations\n'));
  
  const environments = envManager.getAvailableEnvironments();
  
  if (environments.length === 0) {
    console.log(colorize('red', '❌ No environment files found in environments/ directory'));
    process.exit(1);
  }
  
  console.log(colorize('cyan', `Found ${environments.length} environments: ${environments.join(', ')}\n`));
  
  let allValid = true;
  
  for (const env of environments) {
    console.log(colorize('yellow', `Validating ${env.toUpperCase()}...`));
    
    try {
      envManager.loadEnvironment(env);
      const validation = envManager.validateEnvironment();
      
      if (validation.isValid) {
        console.log(colorize('green', `✅ ${env} - Valid`));
      } else {
        console.log(colorize('red', `❌ ${env} - Invalid`));
        validation.errors.forEach(error => {
          console.log(colorize('red', `   - ${error}`));
        });
        allValid = false;
      }
    } catch (error) {
      console.log(colorize('red', `❌ ${env} - Error loading: ${error}`));
      allValid = false;
    }
    
    console.log('');
  }
  
  if (allValid) {
    console.log(colorize('green', '🎉 All environments are valid!'));
  } else {
    console.log(colorize('red', '💥 Some environments have validation errors'));
    process.exit(1);
  }
}

validateEnvironments().catch(console.error);
