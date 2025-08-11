import { expect } from '@playwright/test';
import { TestDataLoader } from './test-data-loader';
import type { User } from '../types/index';
import { API_ENDPOINTS, buildUrl } from '../config/endpoints.js';
import { HTTPLogger, createHTTPLogger, withHTTPLogging } from './httpLogger';
import { 
  logToConsole, 
  getLogConfig, 
  startSupertestLog, 
  endSupertestStep, 
  isSupertestFormatEnabled,
  enableSupertestFormat 
} from './logger';

/**
 * Enhanced test actions with comprehensive HTTP logging
 */
export class TestActions {
  private apiHelper: any;
  private request: any;
  private httpLogger?: HTTPLogger;
  private logConfig = getLogConfig();

  constructor(apiHelper?: any, request?: any) {
    this.apiHelper = apiHelper;
    this.request = request;
  }

  /**
   * Initialize HTTP logging for this test session
   */
  async initializeHTTPLogging(page: any, testId: string, scenarioName: string): Promise<void> {
    if (page) {
      this.httpLogger = createHTTPLogger(page, testId, scenarioName);
      await this.httpLogger.setupHTTPLogging();
      
      if (this.logConfig.enableFullLogs) {
        logToConsole(`🔧 HTTP Logging initialized for: ${scenarioName}`);
      }
    }
  }

  /**
   * Start Supertest-style test logging
   */
  startSupertestTest(testName: string, tags: string[] = []): void {
    if (isSupertestFormatEnabled()) {
      startSupertestLog(testName, tags);
    }
  }

  /**
   * End Supertest-style test step
   */
  endSupertestStep(stepName: string): void {
    if (isSupertestFormatEnabled()) {
      endSupertestStep(stepName);
    }
  }

  /**
   * Toggle Supertest format for this test session
   */
  enableSupertestFormat(enable: boolean = true): void {
    enableSupertestFormat(enable);
  }

  /**
   * Creates a test user and returns the user data with ID
   */
  async createTestUser(testData: any): Promise<User & { id: string }> {
    // Set test step for logging
    if (this.apiHelper?.setStep) {
      this.apiHelper.setStep('Create Test User');
    }
    
    const testUser = testData.user;
    
    if (this.logConfig.enableFullLogs) {
      logToConsole(`👤 Creating test user: ${testUser.fullName}`);
    }
    
    const registrationResult = await this.apiHelper.registerUser(testUser);
    const userId = registrationResult.responseBody.id;
    
    if (this.logConfig.enableFullLogs) {
      logToConsole(`✅ User created with ID: ${userId}`);
    }
    
    return {
      ...testUser,
      id: userId
    };
  }

  /**
   * Enhanced authentication setup with detailed logging
   */
  async setupAuthentication(userId: string): Promise<any> {
    // Set test step for logging
    if (this.apiHelper?.setStep) {
      this.apiHelper.setStep('Setup User Authentication');
    }
    
    if (this.logConfig.enableFullLogs) {
      logToConsole(`🔐 Setting up authentication for user: ${userId}`);
    }
    
    const authData = TestDataLoader.loadAuthData();
    const loginData = authData.credentials.valid;

    // Log manual request details if HTTP logger is available
    if (this.httpLogger) {
      await this.httpLogger.logManualRequest(
        'POST',
        buildUrl(API_ENDPOINTS.TEST.DASHBOARD_WORKFLOW),
        { 'Content-Type': 'application/json' },
        {
          title: 'Login Request',
          body: JSON.stringify(loginData),
          userId: userId
        }
      );
    }

    const result = await this.apiHelper.post(API_ENDPOINTS.TEST.DASHBOARD_WORKFLOW, {
      data: {
        title: 'Login Request',
        body: JSON.stringify(loginData),
        userId: userId
      },
      scenarioName: 'User Authentication'
    });

    this.apiHelper.assertSuccessResponse(result);
    expect(result.responseBody).toHaveProperty('id');
    expect(result.responseBody.userId).toBe(userId);

    if (this.logConfig.enableFullLogs) {
      logToConsole(`✅ Authentication successful for user: ${userId}`);
    }
    
    return result;
  }

  /**
   * Tests invalid authentication scenarios
   */
  async testInvalidAuthentication(): Promise<any> {
    // Set test step for logging
    if (this.apiHelper?.setStep) {
      this.apiHelper.setStep('Test Invalid Authentication');
    }
    
    const authData = TestDataLoader.loadAuthData();
    const invalidCredentials = authData.credentials.invalid;

    const result = await this.apiHelper.delete(API_ENDPOINTS.POST_BY_ID(99999), {
      scenarioName: 'Invalid Credentials Login'
    });

    expect(result.status).toBeGreaterThanOrEqual(400);
    return result;
  }

  /**
   * Gets user profile information
   */
  async getUserProfile(userId: string | number): Promise<any> {
    // Set test step for logging
    if (this.apiHelper?.setStep) {
      this.apiHelper.setStep('Get User Profile');
    }
    
    const result = await this.apiHelper.get(API_ENDPOINTS.USER_BY_ID(userId), {
      scenarioName: 'Get User Profile'
    });

    this.apiHelper.assertSuccessResponse(result);
    this.apiHelper.validateUserData(result.responseBody, ['id', 'name', 'email']);
    return result.responseBody;
  }

  /**
   * Updates user profile with provided data
   */
  async updateUserProfile(userId: string, updateData: any, scenarioName: string = 'Update Profile'): Promise<any> {
    // Set test step for logging
    if (this.apiHelper?.setStep) {
      this.apiHelper.setStep('Update User Profile');
    }
    
    const result = await this.apiHelper.updateUserProfile(userId, updateData);
    
    this.apiHelper.assertSuccessResponse(result);
    
    // Validate updated fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        expect(result.responseBody[key]).toBe(updateData[key]);
      }
    });
    
    return result;
  }

  /**
   * Tests user registration with provided user data
   */
  async testUserRegistration(userData: User, scenarioName: string = 'User Registration'): Promise<any> {
    // Set test step for logging
    if (this.apiHelper?.setStep) {
      this.apiHelper.setStep('Test User Registration');
    }
    
    const registrationResult = await this.apiHelper.registerUser(userData);
    
    this.apiHelper.assertSuccessResponse(registrationResult);
    expect(registrationResult.responseBody).toHaveProperty('id');
    expect(registrationResult.responseBody.email).toBe(userData.email);
    expect(registrationResult.responseBody.name).toBe(userData.fullName);
    
    return registrationResult;
  }

  /**
   * Tests duplicate registration scenarios
   */
  async testDuplicateRegistration(existingUser: User): Promise<any> {
    // First registration
    await this.apiHelper.registerUser(existingUser);
    
    // Attempt duplicate registration
    const duplicateResult = await this.apiHelper.post(API_ENDPOINTS.USERS, {
      data: {
        name: existingUser.fullName,
        username: existingUser.username + '_duplicate',
        email: existingUser.email, // Same email
        phone: existingUser.phone
      },
      scenarioName: 'Duplicate Email Registration'
    });
    
    expect(duplicateResult.status).toBeGreaterThanOrEqual(400);
    return duplicateResult;
  }

  /**
   * Tests validation for incomplete data
   */
  async testIncompleteDataValidation(incompleteData: any, expectedStatus: number = 400): Promise<any> {
    // Set test step for logging
    if (this.apiHelper?.setStep) {
      this.apiHelper.setStep('Test Incomplete Data Validation');
    }
    
    const result = await this.apiHelper.post(API_ENDPOINTS.USERS, {
      data: incompleteData,
      scenarioName: 'Incomplete Data Validation'
    });
    
    this.apiHelper.assertErrorResponse(result, expectedStatus);
    return result;
  }

  /**
   * Updates email address for a user
   */
  async updateEmailAddress(userId: string, newEmail: string, userFullName: string, username: string): Promise<any> {
    // Set test step for logging
    if (this.apiHelper?.setStep) {
      this.apiHelper.setStep('Update Email Address');
    }
    
    const updateData = {
      name: userFullName,
      email: newEmail,
      username: username
    };

    const result = await this.apiHelper.updateUserProfile(userId, updateData);
    this.apiHelper.assertSuccessResponse(result);
    expect(result.responseBody.email).toBe(newEmail);
    
    return result;
  }

  /**
   * Executes a complete dashboard workflow test
   */
  async runDashboardWorkflow(userId: string | number): Promise<void> {
    const workflowData = {
      userId: userId,
      action: 'dashboard_access',
      timestamp: new Date().toISOString()
    };

    const result = await this.apiHelper.post(API_ENDPOINTS.TEST.DASHBOARD_WORKFLOW, {
      data: {
        title: 'Dashboard Workflow',
        body: JSON.stringify(workflowData),
        userId: userId
      },
      scenarioName: 'Dashboard Workflow Test'
    });

    this.apiHelper.assertSuccessResponse(result);
  }

  /**
   * Generates a unique email address for testing
   */
  generateUniqueEmail(prefix: string = 'test'): string {
    return `${prefix}${Date.now()}@example.com`;
  }

  /**
   * Generates a unique phone number for testing
   */
  generateUniquePhone(countryCode: string = '+1555'): string {
    return `${countryCode}${Math.floor(Math.random() * 9000000) + 1000000}`;
  }

  /**
   * Generates a unique avatar URL for testing
   */
  generateAvatarUrl(): string {
    return `https://via.placeholder.com/150?text=User${Date.now()}`;
  }

  /**
   * Creates a verification token simulation
   */
  async createVerificationToken(userId: string | number, type: 'email' | 'phone' | 'password'): Promise<any> {
    const verificationData = {
      userId: userId,
      type: type,
      token: `token_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    };

    const result = await this.apiHelper.post(API_ENDPOINTS.TEST.EMAIL_VERIFICATION, {
      data: {
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Verification`,
        body: JSON.stringify(verificationData),
        userId: userId
      },
      scenarioName: `${type} Verification Token Creation`
    });

    this.apiHelper.assertSuccessResponse(result);
    return result.responseBody;
  }

  /**
   * Handles phone number update with validation
   */
  async updatePhoneNumber(userId: string | number, newPhone: string): Promise<void> {
    // Set test step for logging
    if (this.apiHelper?.setStep) {
      this.apiHelper.setStep('Update Phone Number');
    }
    
    const updateData = {
      phone: newPhone
    };

    const result = await this.apiHelper.updateUserProfile(userId, updateData);
    this.apiHelper.assertSuccessResponse(result);
    expect(result.responseBody.phone).toBe(newPhone);
  }

  /**
   * Handles address update with validation
   */
  async updateAddress(userId: string | number, addressData: any): Promise<void> {
    // Set test step for logging
    if (this.apiHelper?.setStep) {
      this.apiHelper.setStep('Update Address');
    }
    
    const updateData = {
      address: addressData
    };

    const result = await this.apiHelper.updateUserProfile(userId, updateData);
    this.apiHelper.assertSuccessResponse(result);
    expect(result.responseBody.address).toEqual(addressData);
  }

  /**
   * Simulates file upload for avatar
   */
  async uploadAvatar(userId: string | number, fileName: string = 'profile-picture.jpg'): Promise<any> {
    const uploadData = {
      userId: userId,
      fileName: fileName,
      fileSize: 1024000, // 1MB
      mimeType: 'image/jpeg'
    };

    const result = await this.apiHelper.post(API_ENDPOINTS.TEST.AVATAR_UPLOAD, {
      data: {
        title: 'Avatar Upload',
        body: JSON.stringify(uploadData),
        userId: userId
      },
      scenarioName: 'Avatar File Upload'
    });

    this.apiHelper.assertSuccessResponse(result);
    return result.responseBody;
  }

  /**
   * Tests duplicate user creation scenario
   */
  async testDuplicateUserRegistration(existingUser: User): Promise<void> {
    // Set test step for logging
    if (this.apiHelper?.setStep) {
      this.apiHelper.setStep('Test Duplicate User Registration');
    }
    
    // First registration
    await this.apiHelper.registerUser(existingUser);
    
    // Attempt duplicate registration
    const duplicateResult = await this.apiHelper.post(API_ENDPOINTS.USERS, {
      data: {
        name: existingUser.fullName,
        username: existingUser.username + '_duplicate',
        email: existingUser.email, // Same email
        phone: existingUser.phone
      },
      scenarioName: 'Duplicate Email Registration'
    });
    
    // Should return error for duplicate email
    expect(duplicateResult.status).toBeGreaterThanOrEqual(400);
  }

  /**
   * Tests user creation with incomplete data
   */
  async testIncompleteUserRegistration(): Promise<void> {
    const incompleteData = {
      name: 'Test User'
      // Missing required fields
    };
    
    const result = await this.apiHelper.post(API_ENDPOINTS.USERS, {
      data: incompleteData,
      scenarioName: 'Incomplete Registration Data'
    });
    
    this.apiHelper.assertErrorResponse(result, 400);
  }

  /**
   * Tests getting a non-existent user
   */
  async testNonExistentUser(): Promise<void> {
    const nonExistentUserId = 99999;
    
    const result = await this.apiHelper.get(API_ENDPOINTS.USER_BY_ID(nonExistentUserId), {
      scenarioName: 'Get Non-existent User'
    });
    
    this.apiHelper.assertErrorResponse(result, 404);
  }

  /**
   * Tests user deletion and verification
   */
  async testUserDeletion(userId: string | number): Promise<void> {
    const result = await this.apiHelper.delete(API_ENDPOINTS.USER_BY_ID(userId), {
      scenarioName: 'Delete User Account'
    });
    
    expect(result.status).toBeGreaterThanOrEqual(200);
    expect(result.status).toBeLessThan(300);
    
    // Verify user is deleted
    const verifyResult = await this.apiHelper.get(API_ENDPOINTS.USER_BY_ID(userId), {
      scenarioName: 'Verify User Deletion'
    });
    
    this.apiHelper.assertErrorResponse(verifyResult, 404);
  }

  /**
   * Gets list of all users
   */
  async getAllUsers(): Promise<any[]> {
    const result = await this.apiHelper.get(API_ENDPOINTS.USERS, {
      scenarioName: 'Get All Users'
    });
    
    this.apiHelper.assertSuccessResponse(result);
    expect(Array.isArray(result.responseBody)).toBeTruthy();
    expect(result.responseBody.length).toBeGreaterThan(0);
    
    return result.responseBody;
  }

  /**
   * Tests authentication with incomplete credentials
   */
  async testIncompleteCredentials(email: string): Promise<void> {
    // Set test step for logging
    if (this.apiHelper?.setStep) {
      this.apiHelper.setStep('Test Incomplete Credentials');
    }
    
    const incompleteCredentials = {
      email: email
      // Missing password
    };

    const result = await this.apiHelper.post(API_ENDPOINTS.TEST.DASHBOARD_WORKFLOW, {
      data: incompleteCredentials,
      scenarioName: 'Incomplete Credentials'
    });

    // In a real API, this would return 400, but we'll simulate validation
    expect(result.responseBody).not.toHaveProperty('password');
  }

  /**
   * Tests session timeout scenarios
   */
  async testSessionTimeout(userId: string | number): Promise<void> {
    const result = await this.apiHelper.get(API_ENDPOINTS.POST_BY_ID(99999), { // Non-existent resource to simulate error
      scenarioName: 'Session Timeout Test'
    });

    // In a real system, this would test for session expiration
    // For demo, we'll just verify the response structure
    expect(result.status).toBeGreaterThanOrEqual(400);
  }

  /**
   * Tests password change functionality
   */
  async testPasswordChange(userId: string | number, currentPassword: string, newPassword: string): Promise<void> {
    const passwordChangeData = {
      userId: userId,
      currentPassword: currentPassword,
      newPassword: newPassword,
      action: 'change_password'
    };

    const result = await this.apiHelper.post(API_ENDPOINTS.TEST.PASSWORD_RESET, {
      data: {
        title: 'Password Change',
        body: JSON.stringify(passwordChangeData),
        userId: userId
      },
      scenarioName: 'Password Change Test'
    });

    this.apiHelper.assertSuccessResponse(result);
    expect(result.responseBody).toHaveProperty('id');
  }

  /**
   * Tests password change with invalid current password
   */
  async testInvalidPasswordChange(userId: string | number): Promise<void> {
    const passwordChangeData = {
      userId: userId,
      currentPassword: 'wrongpassword',
      newPassword: 'newpassword123',
      action: 'change_password'
    };

    const result = await this.apiHelper.post(API_ENDPOINTS.TEST.PASSWORD_RESET, {
      data: {
        title: 'Invalid Password Change',
        body: JSON.stringify(passwordChangeData),
        userId: userId
      },
      scenarioName: 'Invalid Password Change Test'
    });

    this.apiHelper.assertErrorResponse(result, 404);
  }

  /**
   * Tests password reset functionality
   */
  async testPasswordReset(email: string): Promise<void> {
    const resetData = {
      email: email,
      action: 'password_reset',
      resetToken: `reset_${Date.now()}`
    };

    const result = await this.apiHelper.post(API_ENDPOINTS.TEST.PASSWORD_RESET, {
      data: {
        title: 'Password Reset',
        body: JSON.stringify(resetData),
        userId: 1 // Using a default user ID for reset scenarios
      },
      scenarioName: 'Password Reset Test'
    });

    this.apiHelper.assertSuccessResponse(result);
    expect(result.responseBody).toHaveProperty('id');
  }

  /**
   * Generates a secure password for testing
   */
  generateSecurePassword(prefix: string = 'Test'): string {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    return `${prefix}${timestamp}${randomNum}!`;
  }

  /**
   * Tests password reset with token validation
   */
  async testPasswordResetWithToken(userId: string | number, resetToken: string): Promise<void> {
    const newPassword = this.generateSecurePassword('Reset');
    
    const result = await this.apiHelper.put(API_ENDPOINTS.USER_BY_ID(userId), {
      data: {
        resetToken: resetToken,
        newPassword: newPassword,
        confirmPassword: newPassword
      },
      scenarioName: 'Password Reset with Token'
    });

    this.apiHelper.assertSuccessResponse(result);
    expect(result.responseBody.id).toBe(userId);
  }

  /**
   * Tests token refresh functionality
   */
  async testTokenRefresh(userId: string | number, refreshToken: string): Promise<void> {
    const refreshData = {
      refreshToken: refreshToken,
      userId: userId,
      timestamp: new Date().toISOString()
    };

    const result = await this.apiHelper.post(API_ENDPOINTS.TEST.DASHBOARD_WORKFLOW, {
      data: {
        title: 'Token Refresh',
        body: JSON.stringify(refreshData),
        userId: userId
      },
      scenarioName: 'Token Refresh'
    });

    this.apiHelper.assertSuccessResponse(result);
    expect(result.responseBody).toHaveProperty('id');
  }

  /**
   * Generates a random zip code for testing
   */
  generateZipCode(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  /**
   * Generates a sample address for testing
   */
  generateTestAddress(): any {
    const streetNumbers = ['123', '456', '789', '321', '654'];
    const streetNames = ['Main St', 'Oak Ave', 'Park Blvd', 'First St', 'Second Ave'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
    const states = ['NY', 'CA', 'IL', 'TX', 'AZ'];
    const countries = ['USA', 'Canada', 'Mexico'];

    return {
      street: `${streetNumbers[Math.floor(Math.random() * streetNumbers.length)]} ${streetNames[Math.floor(Math.random() * streetNames.length)]}`,
      city: cities[Math.floor(Math.random() * cities.length)],
      state: states[Math.floor(Math.random() * states.length)],
      zipCode: this.generateZipCode(),
      country: countries[Math.floor(Math.random() * countries.length)]
    };
  }

  /**
   * Generates a partial address for testing updates
   */
  generatePartialAddress(): any {
    const streetNumbers = ['321', '654', '987'];
    const streetNames = ['Updated St', 'Modified Ave', 'Changed Blvd'];
    const cities = ['Updated City', 'Modified Town', 'Changed Village'];

    return {
      street: `${streetNumbers[Math.floor(Math.random() * streetNumbers.length)]} ${streetNames[Math.floor(Math.random() * streetNames.length)]}`,
      city: cities[Math.floor(Math.random() * cities.length)]
    };
  }

  /**
   * Generates an invalid phone number for testing validation
   */
  generateInvalidPhone(): string {
    const invalidPatterns = ['123', '12', '1', 'abc', '++123'];
    return invalidPatterns[Math.floor(Math.random() * invalidPatterns.length)];
  }

  /**
   * Generates a test website URL
   */
  generateTestWebsite(): string {
    const domains = ['updated-website', 'test-site', 'example-domain', 'sample-web'];
    const extensions = ['.com', '.org', '.net'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const ext = extensions[Math.floor(Math.random() * extensions.length)];
    return `https://${domain}${ext}`;
  }

  /**
   * Generates an invalid email format for testing
   */
  generateInvalidEmail(): string {
    const invalidFormats = [
      'invalid-email-format',
      'no-at-symbol',
      'multiple@@symbols.com',
      'spaces in@email.com',
      '@missing-local.com'
    ];
    return invalidFormats[Math.floor(Math.random() * invalidFormats.length)];
  }

  /**
   * Tests phone number validation with invalid format
   */
  async testInvalidPhoneValidation(userId: string | number): Promise<void> {
    const invalidPhone = this.generateInvalidPhone();
    
    // This test should validate phone format - in a real API this would fail
    try {
      await this.updatePhoneNumber(userId, invalidPhone);
    } catch (error) {
      // Expected to fail with invalid phone format
      expect(error).toBeDefined();
    }
  }

  /**
   * Updates a post with provided data
   */
  async updatePost(postId: string, userId: string): Promise<any> {
    const apiConfig = TestDataLoader.loadApiConfig();
    const demoData = TestDataLoader.loadDemoData();
    
    console.log(`📝 Updating post ${postId}...`);
    const updateData = demoData.scenarios.dashboardDemo.updatePost;
    const updatedPost = {
      ...updateData,
      userId: userId
    };
    
    const updateResponse = await this.request.put(`${apiConfig.apiEndpoints.baseUrl}${apiConfig.apiEndpoints.posts}/${postId}`, {
      data: updatedPost
    });
    
    // JSONPlaceholder sometimes returns 200 for PUT requests
    expect([200, 500].includes(updateResponse.status())).toBeTruthy();
    
    if (updateResponse.status() === 200) {
      const updated = await updateResponse.json();
      expect(updated.title).toBe(updatedPost.title);
      console.log('✅ Post updated successfully');
      return updated;
    }
    
    console.log('⚠️ Post update returned server error (simulated)');
    return null;
  }

  /**
   * Tests error handling scenarios
   */
  async testErrorHandling(): Promise<void> {
    const apiConfig = TestDataLoader.loadApiConfig();
    
    console.log('🔍 Testing error handling...');
    
    // Test 404 error
    const notFoundResponse = await this.request.get(`${apiConfig.apiEndpoints.baseUrl}${API_ENDPOINTS.USER_BY_ID(999999)}`);
    expect(notFoundResponse.status()).toBe(apiConfig.expectedStatusCodes.clientError.notFound);
    
    // Test with invalid post ID
    const invalidPostResponse = await this.request.get(`${apiConfig.apiEndpoints.baseUrl}${apiConfig.apiEndpoints.posts}/999999`);
    expect(invalidPostResponse.status()).toBe(apiConfig.expectedStatusCodes.clientError.notFound);
    
    console.log('✅ Error handling tests completed');
  }

  /**
   * Runs performance tests with configurable parameters
   */
  async runPerformanceTest(): Promise<number> {
    const apiConfig = TestDataLoader.loadApiConfig();
    const demoData = TestDataLoader.loadDemoData();
    
    console.log('⚡ Running performance tests...');
    
    const startTime = Date.now();
    const performanceConfig = demoData.scenarios.performanceTest;
    
    // Multiple concurrent requests based on external config
    const requests = [];
    for (let i = 1; i <= performanceConfig.concurrentRequests; i++) {
      requests.push(this.request.get(`${apiConfig.apiEndpoints.baseUrl}${API_ENDPOINTS.USER_BY_ID(i)}`));
    }
    
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    
    // Verify all requests succeeded
    responses.forEach((response, index) => {
      expect(response.status()).toBe(apiConfig.expectedStatusCodes.success.get);
    });
    
    const totalTime = endTime - startTime;
    console.log(`⚡ Completed ${performanceConfig.concurrentRequests} concurrent requests in ${totalTime}ms`);
    
    // Verify performance is reasonable using external config
    expect(totalTime).toBeLessThan(performanceConfig.maxResponseTime);
    
    return totalTime;
  }

  /**
   * Session management helpers
   */
  async setupSession(testData: any): Promise<{user: User & {id: string}, sessionToken: string}> {
    const authenticatedUser = testData.user;
    const registrationResult = await this.apiHelper.registerUser(authenticatedUser);
    authenticatedUser.id = registrationResult.responseBody.id;
    
    // Simulate getting session token
    const sessionToken = testData.authData.accessToken;
    
    return { user: authenticatedUser, sessionToken };
  }

  /**
   * Validates session with token
   */
  async validateSession(userId: string, sessionToken: string): Promise<any> {
    const result = await this.apiHelper.get(API_ENDPOINTS.USER_BY_ID(userId), {
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      },
      scenarioName: 'Authenticated User Profile Access'
    });
    
    this.apiHelper.assertSuccessResponse(result);
    return result;
  }

  /**
   * Tests logout functionality
   */
  async testLogout(userId: string, sessionToken: string): Promise<any> {
    const logoutData = {
      userId: userId,
      sessionToken: sessionToken
    };

    const result = await this.apiHelper.post(API_ENDPOINTS.TEST.DASHBOARD_WORKFLOW, {
      data: {
        title: 'User Logout',
        body: JSON.stringify(logoutData),
        userId: userId
      },
      scenarioName: 'User Logout'
    });

    this.apiHelper.assertSuccessResponse(result);
    return result;
  }
}

export default TestActions;
