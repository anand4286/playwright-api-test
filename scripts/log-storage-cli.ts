#!/usr/bin/env tsx

import { LogStorage } from '../utils/logStorage';
import { program } from 'commander';
import chalk from 'chalk';

// Configure CLI program
program
  .name('log-storage')
  .description('Manage and archive Playwright API test logs')
  .version('1.0.0');

// Archive command
program
  .command('archive')
  .description('Archive current logs')
  .argument('[environment]', 'Environment name (dev, staging, qa, prod)', 'unknown')
  .argument('[testSuite]', 'Test suite name', '')
  .option('-p, --preserve', 'Preserve original log files', false)
  .option('-t, --timestamp <timestamp>', 'Custom timestamp (ISO format)')
  .action(async (environment, testSuite, options) => {
    try {
      console.log(chalk.blue('📁 Archiving logs...'));
      console.log(`Environment: ${environment}`);
      if (testSuite) console.log(`Test Suite: ${testSuite}`);
      
      const archiveName = await LogStorage.archiveLogs({
        environment,
        testSuite: testSuite || undefined,
        timestamp: options.timestamp,
        preserveOriginal: options.preserve
      });
      
      console.log(chalk.green(`✅ Archive created: ${archiveName}`));
    } catch (error) {
      console.error(chalk.red('❌ Archiving failed:'), error.message);
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List archived logs')
  .argument('[filter]', 'Date (YYYY-MM-DD) or environment name')
  .action(async (filter) => {
    try {
      if (!filter) {
        console.log(chalk.yellow('Please specify a date (YYYY-MM-DD) or environment name'));
        console.log('Example: log-storage list 2025-08-11  or  log-storage list dev');
        return;
      }
      
      let logs: string[] = [];
      
      // Check if filter is a date
      if (/^\d{4}-\d{2}-\d{2}$/.test(filter)) {
        console.log(chalk.blue(`📅 Logs for date: ${filter}`));
        logs = await LogStorage.getLogsByDate(filter);
      } else {
        console.log(chalk.blue(`🌍 Logs for environment: ${filter}`));
        logs = await LogStorage.getLogsByEnvironment(filter);
      }
      
      if (logs.length === 0) {
        console.log('No logs found.');
      } else {
        console.log(`Found ${logs.length} log files:`);
        logs.forEach(log => console.log(`  📄 ${log}`));
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to list logs:'), error.message);
      process.exit(1);
    }
  });

// Search command
program
  .command('search')
  .description('Search archived logs')
  .argument('<term>', 'Search term')
  .option('-e, --environment <env>', 'Filter by environment')
  .option('-d, --date <date>', 'Filter by date (YYYY-MM-DD)')
  .option('-t, --type <type>', 'Filter by log type')
  .option('-l, --limit <number>', 'Limit results per file', '5')
  .action(async (term, options) => {
    try {
      console.log(chalk.blue(`🔍 Searching logs for: "${term}"`));
      if (options.environment) console.log(`Environment filter: ${options.environment}`);
      if (options.date) console.log(`Date filter: ${options.date}`);
      if (options.type) console.log(`Type filter: ${options.type}`);
      console.log();
      
      const results = await LogStorage.searchLogs(term, {
        environment: options.environment,
        date: options.date,
        logType: options.type
      });
      
      if (results.length === 0) {
        console.log('No matches found.');
      } else {
        console.log(`Found matches in ${results.length} files:`);
        
        results.forEach(result => {
          console.log(chalk.cyan(`\n📄 ${result.file}`));
          const limit = parseInt(options.limit);
          result.matches.slice(0, limit).forEach(match => {
            const preview = match.content.length > 100 
              ? match.content.substring(0, 100) + '...'
              : match.content;
            console.log(`  Line ${match.line}: ${preview}`);
          });
          
          if (result.matches.length > limit) {
            console.log(chalk.yellow(`  ... and ${result.matches.length - limit} more matches`));
          }
        });
      }
    } catch (error) {
      console.error(chalk.red('❌ Search failed:'), error.message);
      process.exit(1);
    }
  });

// Cleanup command
program
  .command('cleanup')
  .description('Clean up old archived logs')
  .argument('[days]', 'Number of days to retain (default: 30)', '30')
  .option('-f, --force', 'Skip confirmation prompt', false)
  .action(async (days, options) => {
    try {
      const retentionDays = parseInt(days);
      
      if (!options.force) {
        console.log(chalk.yellow(`⚠️  This will delete logs older than ${retentionDays} days.`));
        console.log('Continue? (y/N)');
        
        // Simple confirmation (in real implementation, you'd use a proper prompt library)
        const confirm = process.argv.includes('--yes') || process.argv.includes('-y');
        if (!confirm) {
          console.log('Cleanup cancelled.');
          return;
        }
      }
      
      console.log(chalk.blue(`🧹 Cleaning up logs older than ${retentionDays} days...`));
      await LogStorage.cleanupOldLogs(retentionDays);
      console.log(chalk.green('✅ Cleanup completed'));
    } catch (error) {
      console.error(chalk.red('❌ Cleanup failed:'), error.message);
      process.exit(1);
    }
  });

// Summary command
program
  .command('summary')
  .description('Show archive summary and statistics')
  .action(async () => {
    try {
      console.log(chalk.blue('📊 Archive Summary'));
      console.log();
      
      const summary = await LogStorage.getArchiveSummary();
      
      console.log(`Total Archives: ${chalk.cyan(summary.totalArchives)}`);
      console.log(`Environments: ${chalk.cyan(summary.environments.join(', ') || 'None')}`);
      console.log(`Date Range: ${chalk.cyan(summary.dateRange.oldest)} to ${chalk.cyan(summary.dateRange.newest)}`);
      console.log(`Total Size: ${chalk.cyan(summary.totalSize)}`);
    } catch (error) {
      console.error(chalk.red('❌ Failed to get summary:'), error.message);
      process.exit(1);
    }
  });

// Initialize command
program
  .command('init')
  .description('Initialize log storage directories')
  .action(async () => {
    try {
      console.log(chalk.blue('🔧 Initializing log storage...'));
      await LogStorage.initialize();
      console.log(chalk.green('✅ Log storage initialized'));
    } catch (error) {
      console.error(chalk.red('❌ Initialization failed:'), error.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
