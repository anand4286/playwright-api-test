#!/usr/bin/env node

import { SwaggerServer } from './SwaggerServer';
import { DashboardConfig } from './types';

// Get configuration from environment variables or defaults
const config: DashboardConfig = {
  port: parseInt(process.env.PORT || '8888'),
  openApiDir: process.env.OPENAPI_DIR || './openapi-specs',
  requirementsDir: process.env.REQUIREMENTS_DIR || './requirements',
  enableCors: process.env.ENABLE_CORS !== 'false',
  logLevel: (process.env.LOG_LEVEL as any) || 'info'
};

async function startServer() {
  try {
    const server = new SwaggerServer(config);
    await server.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      server.stop();
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down server...');
      server.stop();
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
