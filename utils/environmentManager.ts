import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

export interface EnvironmentConfig {
  nodeEnv: string;
  baseUrl: string;
  apiVersion: string;
  jwtSecret: string;
  apiKey: string;
  bearerToken: string;
  dbConfig: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  testConfig: {
    timeout: number;
    retries: number;
    parallelWorkers: number;
    userEmail: string;
    userPassword: string;
  };
  serviceUrls: {
    auth: string;
    user: string;
    notification: string;
  };
  rateLimiting: {
    requestsPerMinute: number;
    burstSize: number;
  };
  logging: {
    level: string;
    filePath: string;
    enableConsole: boolean;
  };
  dashboard: {
    port: number;
    enableRealTimeUpdates: boolean;
    authRequired: boolean;
  };
  performance: {
    maxResponseTimeMs: number;
    maxMemoryUsageMb: number;
    minSuccessRatePercent: number;
  };
  featureFlags: {
    enableNewFeatures: boolean;
    enableDebugMode: boolean;
    enableVerboseLogging: boolean;
  };
}

export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private currentEnvironment: string;
  private config!: EnvironmentConfig;

  private constructor() {
    this.currentEnvironment = process.env.TEST_ENV || 'dev';
    this.loadEnvironment(this.currentEnvironment);
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  public loadEnvironment(environment: string): void {
    const envFile = path.join(process.cwd(), 'environments', `${environment}.env`);
    
    if (!fs.existsSync(envFile)) {
      throw new Error(`Environment file not found: ${envFile}`);
    }

    // Load environment-specific variables
    dotenv.config({ path: envFile });
    
    this.currentEnvironment = environment;
    this.config = this.buildConfig();
    
    console.log(`🌍 Environment loaded: ${environment.toUpperCase()}`);
    console.log(`🔗 Base URL: ${this.config.baseUrl}`);
  }

  private buildConfig(): EnvironmentConfig {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      baseUrl: process.env.BASE_URL || 'https://jsonplaceholder.typicode.com',
      apiVersion: process.env.API_VERSION || 'v1',
      jwtSecret: process.env.JWT_SECRET || 'default-secret',
      apiKey: process.env.API_KEY || 'default-api-key',
      bearerToken: process.env.BEARER_TOKEN || 'default-bearer-token',
      
      dbConfig: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        name: process.env.DB_NAME || 'test_db',
        user: process.env.DB_USER || 'test_user',
        password: process.env.DB_PASSWORD || 'test_password'
      },
      
      testConfig: {
        timeout: parseInt(process.env.TIMEOUT || '30000'),
        retries: parseInt(process.env.RETRIES || '2'),
        parallelWorkers: parseInt(process.env.PARALLEL_WORKERS || '4'),
        userEmail: process.env.TEST_USER_EMAIL || 'test@example.com',
        userPassword: process.env.TEST_USER_PASSWORD || 'TestPassword123!'
      },
      
      serviceUrls: {
        auth: process.env.AUTH_SERVICE_URL || 'https://auth.example.com',
        user: process.env.USER_SERVICE_URL || 'https://users.example.com',
        notification: process.env.NOTIFICATION_SERVICE_URL || 'https://notifications.example.com'
      },
      
      rateLimiting: {
        requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '100'),
        burstSize: parseInt(process.env.RATE_LIMIT_BURST_SIZE || '10')
      },
      
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        filePath: process.env.LOG_FILE_PATH || './logs/test-execution.log',
        enableConsole: process.env.ENABLE_CONSOLE_LOGGING === 'true'
      },
      
      dashboard: {
        port: parseInt(process.env.DASHBOARD_PORT || '3000'),
        enableRealTimeUpdates: process.env.ENABLE_REAL_TIME_UPDATES === 'true',
        authRequired: process.env.DASHBOARD_AUTH_REQUIRED === 'true'
      },
      
      performance: {
        maxResponseTimeMs: parseInt(process.env.MAX_RESPONSE_TIME_MS || '2000'),
        maxMemoryUsageMb: parseInt(process.env.MAX_MEMORY_USAGE_MB || '512'),
        minSuccessRatePercent: parseInt(process.env.MIN_SUCCESS_RATE_PERCENT || '95')
      },
      
      featureFlags: {
        enableNewFeatures: process.env.ENABLE_NEW_FEATURES === 'true',
        enableDebugMode: process.env.ENABLE_DEBUG_MODE === 'true',
        enableVerboseLogging: process.env.ENABLE_VERBOSE_LOGGING === 'true'
      }
    };
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public getCurrentEnvironment(): string {
    return this.currentEnvironment;
  }

  public getBaseUrl(): string {
    return this.config.baseUrl;
  }

  public getApiKey(): string {
    return this.config.apiKey;
  }

  public getBearerToken(): string {
    return this.config.bearerToken;
  }

  public getTestTimeout(): number {
    return this.config.testConfig.timeout;
  }

  public getRetries(): number {
    return this.config.testConfig.retries;
  }

  public getParallelWorkers(): number {
    return this.config.testConfig.parallelWorkers;
  }

  public isFeatureEnabled(feature: keyof EnvironmentConfig['featureFlags']): boolean {
    return this.config.featureFlags[feature];
  }

  public getPerformanceThreshold(metric: keyof EnvironmentConfig['performance']): number {
    return this.config.performance[metric];
  }

  // Environment validation
  public validateEnvironment(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.config.baseUrl) {
      errors.push('BASE_URL is required');
    }
    
    if (!this.config.apiKey) {
      errors.push('API_KEY is required');
    }
    
    if (this.config.testConfig.timeout < 1000) {
      errors.push('TIMEOUT should be at least 1000ms');
    }
    
    if (this.config.testConfig.parallelWorkers < 1) {
      errors.push('PARALLEL_WORKERS should be at least 1');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Switch environment during runtime
  public switchEnvironment(environment: string): void {
    console.log(`🔄 Switching from ${this.currentEnvironment} to ${environment}`);
    this.loadEnvironment(environment);
  }

  // Get all available environments
  public getAvailableEnvironments(): string[] {
    const envDir = path.join(process.cwd(), 'environments');
    if (!fs.existsSync(envDir)) {
      return [];
    }
    
    return fs.readdirSync(envDir)
      .filter(file => file.endsWith('.env'))
      .map(file => file.replace('.env', ''));
  }

  // Environment comparison utilities
  public compareEnvironments(env1: string, env2: string): void {
    console.log(`\n📊 Comparing environments: ${env1.toUpperCase()} vs ${env2.toUpperCase()}`);
    
    const originalEnv = this.currentEnvironment;
    
    this.loadEnvironment(env1);
    const config1 = { ...this.config };
    
    this.loadEnvironment(env2);
    const config2 = { ...this.config };
    
    console.log(`Base URL: ${config1.baseUrl} vs ${config2.baseUrl}`);
    console.log(`Timeout: ${config1.testConfig.timeout}ms vs ${config2.testConfig.timeout}ms`);
    console.log(`Workers: ${config1.testConfig.parallelWorkers} vs ${config2.testConfig.parallelWorkers}`);
    console.log(`Debug Mode: ${config1.featureFlags.enableDebugMode} vs ${config2.featureFlags.enableDebugMode}`);
    
    // Restore original environment
    this.loadEnvironment(originalEnv);
  }
}

// Global instance
export const envManager = EnvironmentManager.getInstance();
