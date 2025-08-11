/**
 * API Endpoints Configuration
 * Centralized location for all API endpoint URLs
 */

export const API_ENDPOINTS = {
  // Base URLs
  BASE_URL: 'https://jsonplaceholder.typicode.com',
  
  // User Management Endpoints
  USERS: '/users',
  USER_BY_ID: (id: string | number) => `/users/${id}`,
  
  // Post Management Endpoints
  POSTS: '/posts',
  POST_BY_ID: (id: string | number) => `/posts/${id}`,
  
  // Authentication Endpoints (simulated)
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password'
  },
  
  // Profile Management Endpoints
  PROFILE: {
    GET: (id: string | number) => `/users/${id}/profile`,
    UPDATE: (id: string | number) => `/users/${id}/profile`,
    AVATAR: (id: string | number) => `/users/${id}/avatar`,
    PREFERENCES: (id: string | number) => `/users/${id}/preferences`
  },
  
  // Verification Endpoints
  VERIFICATION: {
    EMAIL: '/verification/email',
    PHONE: '/verification/phone',
    TOKEN: '/verification/token'
  },
  
  // Session Management Endpoints
  SESSION: {
    VALIDATE: '/session/validate',
    REFRESH: '/session/refresh',
    TERMINATE: '/session/terminate'
  },
  
  // Test/Demo Endpoints
  TEST: {
    DASHBOARD_WORKFLOW: '/posts', // Using posts endpoint for demo
    EMAIL_VERIFICATION: '/posts', // Using posts endpoint for demo
    PHONE_VERIFICATION: '/posts', // Using posts endpoint for demo
    PASSWORD_RESET: '/posts', // Using posts endpoint for demo
    AVATAR_UPLOAD: '/posts', // Using posts endpoint for demo
    PROFILE_UPDATE: '/posts' // Using posts endpoint for demo
  },
  
  // Error Testing Endpoints
  ERROR_TEST: {
    NOT_FOUND: '/posts/99999',
    INVALID_USER: '/users/99999',
    TIMEOUT: '/timeout-test'
  }
} as const;

/**
 * Helper function to build full URL
 */
export const buildUrl = (endpoint: string, baseUrl: string = API_ENDPOINTS.BASE_URL): string => {
  return `${baseUrl}${endpoint}`;
};

/**
 * Common endpoint patterns for reuse
 */
export const ENDPOINT_PATTERNS = {
  // RESTful patterns
  GET_ALL: (resource: string) => `/${resource}`,
  GET_BY_ID: (resource: string, id: string | number) => `/${resource}/${id}`,
  CREATE: (resource: string) => `/${resource}`,
  UPDATE: (resource: string, id: string | number) => `/${resource}/${id}`,
  DELETE: (resource: string, id: string | number) => `/${resource}/${id}`,
  
  // Nested resource patterns
  NESTED_RESOURCE: (parent: string, parentId: string | number, child: string) => 
    `/${parent}/${parentId}/${child}`,
  NESTED_RESOURCE_BY_ID: (parent: string, parentId: string | number, child: string, childId: string | number) => 
    `/${parent}/${parentId}/${child}/${childId}`
} as const;

/**
 * Environment-specific endpoint configurations
 */
export const ENVIRONMENT_ENDPOINTS = {
  development: {
    BASE_URL: 'https://jsonplaceholder.typicode.com',
    TIMEOUT: 30000
  },
  staging: {
    BASE_URL: 'https://staging-api.example.com',
    TIMEOUT: 20000
  },
  production: {
    BASE_URL: 'https://api.example.com',
    TIMEOUT: 15000
  }
} as const;

/**
 * Get environment-specific configuration
 */
export const getEnvironmentConfig = (env: keyof typeof ENVIRONMENT_ENDPOINTS = 'development') => {
  return ENVIRONMENT_ENDPOINTS[env];
};
