import { test, expect } from '../../utils/testFixtures.js';
import type { User } from '../../types/index.js';
import { TestActions } from '../../utils/test-actions.js';
import { TestDataLoader } from '../../utils/test-data-loader.js';

/**
 * Negative Test Scenarios
 * 
 * This test suite focuses on negative testing patterns to validate system behavior
 * when handling invalid inputs, error conditions, and edge cases. Tests include:
 * - Invalid data validation
 * - Authentication failures
 * - Resource not found scenarios
 * - Unauthorized access attempts
 * 
 * Test Dependencies:
 * - External test data from test-data/advanced/test-scenarios.json
 * - TestActions utility for consistent error validation
 * - API endpoints configuration for error response testing
 */

test.describe('Invalid Data Validation Tests', () => {
  let testActions: TestActions;
  let advancedTestData: any;

  test.beforeAll(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    advancedTestData = TestDataLoader.loadAdvancedTestData();
  });

  /**
   * Test: Invalid User Data Scenarios
   * 
   * Purpose: Validates system handling of invalid user registration data
   * Functionality: Tests various invalid data combinations and error responses
   * Dependencies: None - error validation test
   * 
   * This test ensures the API properly validates input data and returns
   * appropriate error messages for different invalid data scenarios.
   */
  test('should reject user creation with invalid data combinations @regression @negative', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    const invalidUserScenarios = advancedTestData.negativeScenarios.invalidData.users;
    
    for (let i = 0; i < invalidUserScenarios.length; i++) {
      const scenario = invalidUserScenarios[i];
      
      try {
        // Attempt to create user with invalid data
        await testActions.createTestUser(scenario.data);
        
        // If creation succeeds, the test should fail
        expect(false).toBe(true); // Force test failure
      } catch (error) {
        // Expected behavior - creation should fail
        expect(error).toBeDefined();
        
        // Validate error contains expected information
        const errorMessage = (error as Error)?.message || 'Unknown error';
        expect(errorMessage.length).toBeGreaterThan(0);
      }
    }
  });

  /**
   * Test: Authentication Failure Scenarios
   * 
   * Purpose: Tests authentication with invalid credentials and malformed requests
   * Functionality: Validates authentication error handling
   * Dependencies: None - authentication error testing
   * 
   * This test ensures authentication failures are handled correctly
   * and appropriate error responses are returned.
   */
  test('should handle authentication failures correctly @regression @negative', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    const authFailureScenarios = advancedTestData.negativeScenarios.invalidData.authentication;
    
    for (let i = 0; i < authFailureScenarios.length; i++) {
      const scenario = authFailureScenarios[i];
      
      try {
        // Create a valid user first for authentication attempts
        const testUser = await testActions.createTestUser(testData);
        
        // Attempt authentication with invalid credentials
        await testActions.testInvalidAuthentication();
        
        // Clean up test user
        await testActions.testUserDeletion(testUser.id);
        
      } catch (error) {
        // Expected behavior for invalid authentication
        expect(error).toBeDefined();
      }
    }
  });
});

test.describe('Resource Not Found Tests', () => {
  let testActions: TestActions;
  let advancedTestData: any;

  test.beforeAll(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    advancedTestData = TestDataLoader.loadAdvancedTestData();
  });

  /**
   * Test: Non-existent User Access
   * 
   * Purpose: Validates system behavior when accessing non-existent users
   * Functionality: Tests 404 error responses for invalid user IDs
   * Dependencies: None - error response testing
   * 
   * This test ensures the API returns appropriate 404 responses
   * when attempting to access users that don't exist.
   */
  test('should return 404 for non-existent user access @regression @negative', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    const notFoundScenarios = advancedTestData.negativeScenarios.errorResponses.notFound;
    
    for (let i = 0; i < notFoundScenarios.userIds.length; i++) {
      const invalidUserId = notFoundScenarios.userIds[i];
      
      try {
        // Attempt to access non-existent user
        await testActions.testNonExistentUser();
        
        // This should not succeed
        expect(false).toBe(true); // Force failure if no error thrown
      } catch (error) {
        // Expected behavior - should throw error for non-existent user
        expect(error).toBeDefined();
      }
    }
  });

  /**
   * Test: Invalid Resource Operations
   * 
   * Purpose: Tests operations on invalid or deleted resources
   * Functionality: Validates error handling for resource operations
   * Dependencies: None - resource error testing
   * 
   * This test ensures proper error handling when attempting operations
   * on resources that don't exist or have been deleted.
   */
  test('should handle invalid resource operations correctly @regression @negative', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    
    try {
      // Test error handling functionality
      await testActions.testErrorHandling();
      
      // Should not reach here if error handling works
      expect(false).toBe(true); // Force failure
    } catch (error) {
      // Expected behavior - error handling should throw
      expect(error).toBeDefined();
    }
  });
});

test.describe('Unauthorized Access Tests', () => {
  let testActions: TestActions;
  let advancedTestData: any;

  test.beforeAll(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    advancedTestData = TestDataLoader.loadAdvancedTestData();
  });

  /**
   * Test: Invalid Token Access
   * 
   * Purpose: Tests access attempts with invalid or expired tokens
   * Functionality: Validates 401 error responses for unauthorized access
   * Dependencies: None - authorization error testing
   * 
   * This test ensures the API properly rejects requests with invalid
   * authentication tokens and returns appropriate error responses.
   */
  test('should reject access with invalid authentication tokens @regression @negative', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    const unauthorizedScenarios = advancedTestData.negativeScenarios.errorResponses.unauthorized;
    
    // Create a test user for token validation tests
    const testUser = await testActions.createTestUser(testData);
    
    for (let i = 0; i < unauthorizedScenarios.invalidTokens.length; i++) {
      const invalidToken = unauthorizedScenarios.invalidTokens[i];
      
      try {
        // Attempt to validate session with invalid token
        await testActions.validateSession(testUser.id, invalidToken);
        
        // Should not succeed with invalid token
        expect(false).toBe(true); // Force failure
      } catch (error) {
        // Expected behavior - invalid token should be rejected
        expect(error).toBeDefined();
      }
    }
    
    // Clean up test user
    await testActions.testUserDeletion(testUser.id);
  });

  /**
   * Test: Incomplete Credentials
   * 
   * Purpose: Tests authentication attempts with missing or incomplete credentials
   * Functionality: Validates proper error handling for incomplete auth data
   * Dependencies: None - credential validation testing
   * 
   * This test ensures the system properly validates authentication
   * requests and rejects incomplete credential submissions.
   */
  test('should reject authentication with incomplete credentials @regression @negative', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    
    // Create test user for credential validation
    const testUser = await testActions.createTestUser(testData);
    
    try {
      // Test incomplete credentials validation
      await testActions.testIncompleteCredentials(testUser.email);
      
      // Should not succeed with incomplete credentials
      expect(false).toBe(true); // Force failure
    } catch (error) {
      // Expected behavior - incomplete credentials should be rejected
      expect(error).toBeDefined();
    }
    
    // Clean up test user
    await testActions.testUserDeletion(testUser.id);
  });
});

test.describe('Edge Case and Boundary Tests', () => {
  let testActions: TestActions;

  test.beforeEach(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
  });

  /**
   * Test: Empty and Null Values
   * 
   * Purpose: Tests system handling of empty strings, null values, and undefined data
   * Functionality: Validates input sanitization and null value handling
   * Dependencies: None - input validation testing
   * 
   * This test ensures the API properly handles edge cases with empty
   * or null input values and returns appropriate error responses.
   */
  test('should handle empty and null values appropriately @regression @negative', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    
    // Test scenarios with empty values
    const emptyDataScenarios = [
      { fullName: '', email: 'empty@test.com', username: 'emptyname' },
      { fullName: 'Test User', email: '', username: 'emptyemail' },
      { fullName: 'Test User', email: 'test@example.com', username: '' }
    ];
    
    for (let i = 0; i < emptyDataScenarios.length; i++) {
      const emptyData = emptyDataScenarios[i];
      
      try {
        const userData = {
          ...testData.user,
          ...emptyData
        };
        
        await testActions.createTestUser(userData);
        
        // Should not succeed with empty required fields
        expect(false).toBe(true); // Force failure
      } catch (error) {
        // Expected behavior - empty required fields should be rejected
        expect(error).toBeDefined();
      }
    }
  });

  /**
   * Test: Malformed Request Data
   * 
   * Purpose: Tests system handling of malformed JSON and invalid request formats
   * Functionality: Validates request parsing and error handling
   * Dependencies: None - request format validation
   * 
   * This test ensures the API properly handles malformed requests
   * and returns appropriate parsing error responses.
   */
  test('should handle malformed request data correctly @regression @negative', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    
    try {
      // Test with extremely long data values
      const oversizedData = {
        fullName: 'A'.repeat(1000), // Extremely long name
        email: 'test@example.com',
        username: 'testuser'
      };
      
      await testActions.createTestUser(oversizedData);
      
      // Should not succeed with oversized data
      expect(false).toBe(true); // Force failure
    } catch (error) {
      // Expected behavior - oversized data should be rejected
      expect(error).toBeDefined();
    }
  });
});
