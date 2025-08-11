import fs from 'fs';
import path from 'path';

export class LogStorage {
  private static archiveDir = path.join(process.cwd(), 'logs', 'archive');
  private static currentLogsDir = path.join(process.cwd(), 'logs');
  
  /**
   * Initialize log storage directories
   */
  static async initialize(): Promise<void> {
    try {
      // Ensure archive directory exists
      if (!fs.existsSync(this.archiveDir)) {
        fs.mkdirSync(this.archiveDir, { recursive: true });
      }
      
      // Create subdirectories for organization
      const subdirs = ['daily', 'by-environment', 'by-test-suite'];
      for (const subdir of subdirs) {
        const fullPath = path.join(this.archiveDir, subdir);
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
        }
      }
    } catch (error) {
      console.error('Error initializing log storage:', error);
    }
  }
  
  /**
   * Archive current logs with timestamp and environment info
   */
  static async archiveLogs(options: {
    environment: string;
    testSuite?: string;
    timestamp?: string;
    preserveOriginal?: boolean;
  }): Promise<string> {
    const { environment, testSuite, timestamp, preserveOriginal = false } = options;
    
    const now = timestamp || new Date().toISOString().replace(/[:.]/g, '-');
    const dateStr = now.split('T')[0]; // YYYY-MM-DD
    const timeStr = now.split('T')[1].split('.')[0].replace(/:/g, '-'); // HH-MM-SS
    
    try {
      await this.initialize();
      
      // Create archive filename with environment and timestamp
      const archiveBaseName = `${environment}_${dateStr}_${timeStr}`;
      const archiveSuffix = testSuite ? `_${testSuite}` : '';
      const fullArchiveName = `${archiveBaseName}${archiveSuffix}`;
      
      // Archive paths
      const dailyArchivePath = path.join(this.archiveDir, 'daily', dateStr);
      const envArchivePath = path.join(this.archiveDir, 'by-environment', environment);
      
      // Ensure archive subdirectories exist
      if (!fs.existsSync(dailyArchivePath)) {
        fs.mkdirSync(dailyArchivePath, { recursive: true });
      }
      if (!fs.existsSync(envArchivePath)) {
        fs.mkdirSync(envArchivePath, { recursive: true });
      }
      
      // Get all test-specific log files dynamically
      const allLogFiles = fs.readdirSync(this.currentLogsDir).filter(file => 
        file.endsWith('_http-live.log') || 
        file === 'http-live.log' || 
        file === 'error.log'
      );
      
      const archivedFiles: string[] = [];
      
      for (const logFile of allLogFiles) {
        const sourcePath = path.join(this.currentLogsDir, logFile);
        
        if (fs.existsSync(sourcePath)) {
          const fileExtension = path.extname(logFile);
          const baseFileName = path.basename(logFile, fileExtension);
          const archivedFileName = `${fullArchiveName}_${baseFileName}${fileExtension}`;
          
          // Archive to both daily and environment-specific folders
          const dailyTargetPath = path.join(dailyArchivePath, archivedFileName);
          const envTargetPath = path.join(envArchivePath, archivedFileName);
          
          // Copy to daily archive
          fs.copyFileSync(sourcePath, dailyTargetPath);
          // Copy to environment archive
          fs.copyFileSync(sourcePath, envTargetPath);
          
          archivedFiles.push(archivedFileName);
          
          // Clear original file if not preserving
          if (!preserveOriginal) {
            fs.writeFileSync(sourcePath, '');
          }
        }
      }
      
      // Create archive metadata
      const metadata = {
        timestamp: now,
        environment,
        testSuite: testSuite || 'all',
        archivedFiles,
        archivePaths: {
          daily: dailyArchivePath,
          environment: envArchivePath
        }
      };
      
      // Save metadata
      const metadataPath = path.join(dailyArchivePath, `${fullArchiveName}_metadata.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      console.log(`📁 Logs archived successfully:`);
      console.log(`   Daily: ${dailyArchivePath}`);
      console.log(`   Environment: ${envArchivePath}`);
      console.log(`   Files: ${archivedFiles.length} files archived`);
      
      return fullArchiveName;
    } catch (error) {
      console.error('Error archiving logs:', error);
      throw error;
    }
  }
  
  /**
   * Retrieve archived logs by date
   */
  static async getLogsByDate(date: string): Promise<string[]> {
    const dailyPath = path.join(this.archiveDir, 'daily', date);
    
    if (!fs.existsSync(dailyPath)) {
      return [];
    }
    
    return fs.readdirSync(dailyPath).filter(file => file.endsWith('.log'));
  }
  
  /**
   * Retrieve archived logs by environment
   */
  static async getLogsByEnvironment(environment: string): Promise<string[]> {
    const envPath = path.join(this.archiveDir, 'by-environment', environment);
    
    if (!fs.existsSync(envPath)) {
      return [];
    }
    
    return fs.readdirSync(envPath).filter(file => file.endsWith('.log'));
  }
  
  /**
   * Search logs by content
   */
  static async searchLogs(searchTerm: string, options: {
    environment?: string;
    date?: string;
    logType?: string;
  } = {}): Promise<{
    file: string;
    matches: { line: number; content: string }[];
  }[]> {
    const results: { file: string; matches: { line: number; content: string }[] }[] = [];
    
    let searchPaths: string[] = [];
    
    if (options.date) {
      const dailyPath = path.join(this.archiveDir, 'daily', options.date);
      if (fs.existsSync(dailyPath)) {
        searchPaths.push(dailyPath);
      }
    } else if (options.environment) {
      const envPath = path.join(this.archiveDir, 'by-environment', options.environment);
      if (fs.existsSync(envPath)) {
        searchPaths.push(envPath);
      }
    } else {
      // Search all archives
      const dailyArchives = path.join(this.archiveDir, 'daily');
      if (fs.existsSync(dailyArchives)) {
        const dates = fs.readdirSync(dailyArchives);
        searchPaths = dates.map(date => path.join(dailyArchives, date));
      }
    }
    
    for (const searchPath of searchPaths) {
      if (!fs.existsSync(searchPath)) continue;
      
      const files = fs.readdirSync(searchPath).filter(file => {
        if (!file.endsWith('.log')) return false;
        if (options.logType && !file.includes(options.logType)) return false;
        return true;
      });
      
      for (const file of files) {
        const filePath = path.join(searchPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        
        const matches: { line: number; content: string }[] = [];
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
            matches.push({ line: index + 1, content: line });
          }
        });
        
        if (matches.length > 0) {
          results.push({ file: filePath, matches });
        }
      }
    }
    
    return results;
  }
  
  /**
   * Clean up old logs (older than specified days)
   */
  static async cleanupOldLogs(retentionDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const dailyArchivePath = path.join(this.archiveDir, 'daily');
    
    if (!fs.existsSync(dailyArchivePath)) return;
    
    const dateFolders = fs.readdirSync(dailyArchivePath);
    let cleanedCount = 0;
    
    for (const dateFolder of dateFolders) {
      const folderDate = new Date(dateFolder);
      
      if (folderDate < cutoffDate) {
        const folderPath = path.join(dailyArchivePath, dateFolder);
        fs.rmSync(folderPath, { recursive: true, force: true });
        cleanedCount++;
      }
    }
    
    console.log(`🧹 Cleaned up ${cleanedCount} old log folders (older than ${retentionDays} days)`);
  }
  
  /**
   * Generate archive summary
   */
  static async getArchiveSummary(): Promise<{
    totalArchives: number;
    environments: string[];
    dateRange: { oldest: string; newest: string };
    totalSize: string;
  }> {
    const dailyPath = path.join(this.archiveDir, 'daily');
    const envPath = path.join(this.archiveDir, 'by-environment');
    
    let totalArchives = 0;
    const environments: string[] = [];
    let dates: string[] = [];
    let totalSizeBytes = 0;
    
    // Count daily archives
    if (fs.existsSync(dailyPath)) {
      dates = fs.readdirSync(dailyPath);
      for (const date of dates) {
        const datePath = path.join(dailyPath, date);
        const files = fs.readdirSync(datePath).filter(f => f.endsWith('.log'));
        totalArchives += files.length;
        
        // Calculate size
        for (const file of files) {
          const filePath = path.join(datePath, file);
          const stats = fs.statSync(filePath);
          totalSizeBytes += stats.size;
        }
      }
    }
    
    // Get environments
    if (fs.existsSync(envPath)) {
      environments.push(...fs.readdirSync(envPath));
    }
    
    // Format size
    const formatSize = (bytes: number): string => {
      const units = ['B', 'KB', 'MB', 'GB'];
      let size = bytes;
      let unitIndex = 0;
      
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      
      return `${size.toFixed(2)} ${units[unitIndex]}`;
    };
    
    dates.sort();
    
    return {
      totalArchives,
      environments,
      dateRange: {
        oldest: dates[0] || 'N/A',
        newest: dates[dates.length - 1] || 'N/A'
      },
      totalSize: formatSize(totalSizeBytes)
    };
  }
}
