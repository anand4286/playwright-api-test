import { test as base, expect, APIRequestContext } from '@playwright/test';
import { logAPIRequest, logAPIResponse, logTestExecution, initializeLiveLogging, setTestContext, setStepContext } from './logger.js';
// import DataGenerator from './dataGenerator.js';  // Temporarily disabled
import { v4 as uuidv4 } from 'uuid';

// Temporary stub for DataGenerator
class DataGeneratorStub {
  generateUser() {
    return {
      id: uuidv4(),
      username: `user_${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      password: 'password123',
      phone: '+1234567890',
      mobile: '+1234567890',
      avatar: 'https://via.placeholder.com/150',
      website: 'https://example.com',
      company: {
        name: 'Test Company',
        department: 'Engineering',
        jobTitle: 'Software Developer'
      },
      dateOfBirth: new Date('1990-01-01'),
      gender: 'other' as const,
      bio: 'Test user bio',
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      }
    };
  }
}
import { 
  User, 
  ApiHelperResponse, 
  RequestOptions, 
  LoginCredentials,
  GeneratedTestData 
} from '../types/index.js';

// Custom test fixture with API utilities
interface ApiHelper {
  testId: string;
  dataGenerator: DataGeneratorStub;
  makeRequest(method: string, url: string, options?: RequestOptions): Promise<ApiHelperResponse>;
  get(url: string, options?: RequestOptions): Promise<ApiHelperResponse>;
  post(url: string, options?: RequestOptions): Promise<ApiHelperResponse>;
  put(url: string, options?: RequestOptions): Promise<ApiHelperResponse>;
  patch(url: string, options?: RequestOptions): Promise<ApiHelperResponse>;
  delete(url: string, options?: RequestOptions): Promise<ApiHelperResponse>;
  registerUser(userData?: User | null): Promise<ApiHelperResponse & { user: User }>;
  loginUser(credentials: LoginCredentials): Promise<ApiHelperResponse>;
  updateUserProfile(userId: string | number, updateData: Partial<User>): Promise<ApiHelperResponse>;
  validateResponse(response: ApiHelperResponse, expectedStatus?: number): void;
  validateUserData(userData: any, expectedFields?: string[]): void;
  assertSuccessResponse(response: ApiHelperResponse): void;
  assertErrorResponse(response: ApiHelperResponse, expectedStatus: number): void;
  setStep(stepName: string): void; // New method for setting test steps
}

interface TestData {
  user: User;
  users: User[];
  authData: any;
  apiEndpoints: any;
}

export const test = base.extend<{
  apiHelper: ApiHelper;
  testData: TestData;
}>({
  // API helper fixture
  apiHelper: async ({ request }: { request: APIRequestContext }, use, testInfo) => {
    const testId = uuidv4();
    const dataGenerator = new DataGeneratorStub();
    
    // Set test context for logging
    const testName = testInfo.title;
    setTestContext(testName);
    
    // Initialize live logging for beautiful HTTP logs
    initializeLiveLogging();

    const apiHelper: ApiHelper = {
      testId,
      dataGenerator,

      // Enhanced request method with logging
      async makeRequest(method: string, url: string, options: RequestOptions = {}): Promise<ApiHelperResponse> {
        const startTime = Date.now();
        
        // Construct full URL for logging
        const baseURL = process.env.BASE_URL || 'https://jsonplaceholder.typicode.com';
        const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
        
        const requestData = {
          method: method.toUpperCase(),
          url: fullUrl,
          headers: options.headers || {},
          body: options.data || null,
          testId: this.testId,
          scenarioName: options.scenarioName || 'Unknown Scenario'
        };

        // Log the request
        logAPIRequest(requestData);

        try {
          const response = await (request as any)[method.toLowerCase()](url, options);
          const endTime = Date.now();
          const responseTime = endTime - startTime;

          // Get response data
          let responseBody: any;
          try {
            responseBody = await response.json();
          } catch {
            responseBody = await response.text();
          }

          const responseData = {
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers(),
            body: responseBody,
            responseTime,
            testId: this.testId,
            scenarioName: options.scenarioName || 'Unknown Scenario'
          };

          // Log the response
          logAPIResponse(responseData);

          return {
            response,
            responseBody,
            responseTime,
            status: responseData.status,
            statusText: responseData.statusText,
            headers: responseData.headers,
            body: responseData.body,
            testId: responseData.testId,
            scenarioName: responseData.scenarioName
          };
        } catch (error: any) {
          logAPIResponse({
            status: 'ERROR',
            statusText: error.message,
            headers: {},
            body: null,
            responseTime: Date.now() - startTime,
            testId: this.testId,
            scenarioName: options.scenarioName || 'Unknown Scenario',
            error: error.message
          });
          throw error;
        }
      },

      // Convenience methods
      async get(url: string, options: RequestOptions = {}): Promise<ApiHelperResponse> {
        return this.makeRequest('GET', url, options);
      },

      async post(url: string, options: RequestOptions = {}): Promise<ApiHelperResponse> {
        return this.makeRequest('POST', url, options);
      },

      async put(url: string, options: RequestOptions = {}): Promise<ApiHelperResponse> {
        return this.makeRequest('PUT', url, options);
      },

      async patch(url: string, options: RequestOptions = {}): Promise<ApiHelperResponse> {
        return this.makeRequest('PATCH', url, options);
      },

      async delete(url: string, options: RequestOptions = {}): Promise<ApiHelperResponse> {
        return this.makeRequest('DELETE', url, options);
      },

      // Authentication helpers
      async registerUser(userData: User | null = null): Promise<ApiHelperResponse & { user: User }> {
        const user = userData || this.dataGenerator.generateUser();
        const result = await this.post('/users', {
          data: {
            name: user.fullName,
            username: user.username,
            email: user.email,
            phone: user.phone,
            website: user.website,
            address: user.address,
            company: user.company
          },
          scenarioName: 'User Registration'
        });
        return { user, ...result };
      },

      async loginUser(credentials: LoginCredentials): Promise<ApiHelperResponse> {
        return this.post('/auth/login', {
          data: credentials,
          scenarioName: 'User Login'
        });
      },

      async updateUserProfile(userId: string | number, updateData: Partial<User>): Promise<ApiHelperResponse> {
        return this.put(`/users/${userId}`, {
          data: updateData,
          scenarioName: 'Profile Update'
        });
      },

      // Validation helpers
      validateResponse(response: ApiHelperResponse, expectedStatus: number = 200): void {
        expect(response.status).toBe(expectedStatus);
        expect(response.response).toBeTruthy();
      },

      validateUserData(userData: any, expectedFields: string[] = []): void {
        expect(userData).toBeTruthy();
        if (expectedFields.length > 0) {
          expectedFields.forEach(field => {
            expect(userData).toHaveProperty(field);
          });
        }
      },

      // Common assertions
      assertSuccessResponse(response: ApiHelperResponse): void {
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(300);
      },

      assertErrorResponse(response: ApiHelperResponse, expectedStatus: number): void {
        expect(response.status).toBe(expectedStatus);
      },

      // Set current test step for detailed logging
      setStep(stepName: string): void {
        setStepContext(stepName);
      }
    };

    await use(apiHelper);
  },

  // Test data fixture
  testData: async ({}, use) => {
    const generator = new DataGeneratorStub();
    const testData: TestData = {
      user: generator.generateUser(),
      users: [generator.generateUser(), generator.generateUser(), generator.generateUser()],
      authData: {
        accessToken: 'test-token',
        refreshToken: 'test-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: 'read write'
      },
      apiEndpoints: {
        users: {
          create: '/api/users',
          read: '/api/users/:id',
          update: '/api/users/:id',
          delete: '/api/users/:id',
          list: '/api/users'
        },
        auth: {
          login: '/api/auth/login',
          logout: '/api/auth/logout',
          register: '/api/auth/register'
        }
      }
    };
    await use(testData);
  }
});

// Enhanced expect with custom matchers
export { expect };

// Custom test hooks
export const beforeEach = async (testInfo: any): Promise<void> => {
  const testExecutionData = {
    testName: testInfo.title,
    status: 'started' as const,
    duration: 0,
    testId: uuidv4(),
    startTime: Date.now()
  };
  
  logTestExecution(testExecutionData);
};

export const afterEach = async (testInfo: any): Promise<void> => {
  const testExecutionData = {
    testName: testInfo.title,
    status: testInfo.status,
    duration: testInfo.duration,
    error: testInfo.error?.message || undefined,
    testId: testInfo.testId || uuidv4()
  };
  
  logTestExecution(testExecutionData);
};
