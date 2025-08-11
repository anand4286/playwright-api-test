import { test, expect } from '../../utils/testFixtures.js';
import type { User } from '../../types/index.js';
import { TestActions } from '../../utils/test-actions.js';
import { TestDataLoader } from '../../utils/test-data-loader.js';

/**
 * Data-Driven Tests
 * 
 * This test suite demonstrates data-driven testing patterns where multiple data sets
 * are tested using loops and parameterized test data. The tests validate:
 * - Multiple user profile configurations
 * - Batch authentication scenarios
 * - Data validation with various inputs
 * 
 * Test Dependencies:
 * - External test data from test-data/advanced/test-scenarios.json
 * - TestActions utility for reusable operations
 * - API endpoints configuration for consistent URL management
 */

test.describe('Data-Driven User Profile Tests', () => {
  let testActions: TestActions;
  let advancedTestData: any;

  test.beforeAll(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    advancedTestData = TestDataLoader.loadAdvancedTestData();
  });

  /**
   * Test: Multiple User Profile Creation and Validation
   * 
   * Purpose: Validates user profile creation with different data sets
   * Functionality: Creates multiple users with varied profile data and validates responses
   * Dependencies: None - standalone test
   * 
   * This test iterates through predefined user profile data to ensure the API
   * handles various valid profile configurations correctly.
   */
  test('should create and validate multiple user profiles with different data sets @regression', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    const userProfiles = advancedTestData.dataSetTests.userProfiles;
    
    for (let i = 0; i < userProfiles.length; i++) {
      const profileData = userProfiles[i];
      
      // Create user with current profile data
      const userData = {
        ...testData.user,
        fullName: profileData.name,
        email: profileData.email,
        username: profileData.username,
        website: profileData.website,
        phone: profileData.phone
      };
      
      const createdUser = await testActions.createTestUser(userData);
      expect(createdUser).toHaveProperty('id');
      expect(createdUser.fullName).toBe(profileData.name);
      expect(createdUser.email).toBe(profileData.email);
      
      // Validate profile retrieval
      const retrievedProfile = await testActions.getUserProfile(createdUser.id);
      expect(retrievedProfile).toHaveProperty('fullName', profileData.name);
      expect(retrievedProfile).toHaveProperty('email', profileData.email);
      
      // Clean up created user
      await testActions.testUserDeletion(createdUser.id);
    }
  });

  /**
   * Test: Batch Authentication Credential Validation
   * 
   * Purpose: Tests authentication with multiple credential sets
   * Functionality: Validates different authentication scenarios in batch
   * Dependencies: Requires user creation before authentication
   * 
   * This test ensures the authentication system handles various credential
   * combinations and returns appropriate responses for each scenario.
   */
  test('should authenticate multiple users with different credential sets @regression', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    const authCredentials = advancedTestData.dataSetTests.authenticationCredentials;
    
    // Create test users for authentication
    const createdUsers: Array<User & { id: string }> = [];
    
    for (let i = 0; i < authCredentials.length; i++) {
      const credentials = authCredentials[i];
      
      const userData = {
        ...testData.user,
        username: credentials.username,
        password: credentials.password,
        email: `${credentials.username}@testdomain.com`
      };
      
      const createdUser = await testActions.createTestUser(userData);
      createdUsers.push(createdUser);
      
      // Test authentication for this user
      await testActions.setupAuthentication(createdUser.id);
      
      // Validate authentication token or session
      const sessionValidation = await testActions.validateSession(createdUser.id, 'mock-session-token');
      expect(sessionValidation).toBeDefined();
    }
    
    // Clean up all created users
    for (const user of createdUsers) {
      await testActions.testUserDeletion(user.id);
    }
  });

  /**
   * Test: Profile Update Data Validation
   * 
   * Purpose: Validates profile updates with different data combinations
   * Functionality: Tests partial and complete profile updates
   * Dependencies: Requires user creation before profile updates
   * 
   * This test ensures profile update functionality works correctly with
   * various data combinations and field configurations.
   */
  test('should update user profiles with various data combinations @regression', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    const userProfiles = advancedTestData.dataSetTests.userProfiles;
    
    // Create a base test user
    const baseUser = await testActions.createTestUser(testData);
    
    for (let i = 0; i < userProfiles.length; i++) {
      const profileUpdate = userProfiles[i];
      
      // Update user profile with current data set
      const updateData = {
        fullName: profileUpdate.name,
        website: profileUpdate.website,
        phone: profileUpdate.phone
      };
      
      await testActions.updateUserProfile(baseUser.id, updateData);
      
      // Validate the updates were applied
      const updatedProfile = await testActions.getUserProfile(baseUser.id);
      expect(updatedProfile.fullName).toBe(profileUpdate.name);
      expect(updatedProfile.website).toBe(profileUpdate.website);
      expect(updatedProfile.phone).toBe(profileUpdate.phone);
    }
    
    // Clean up
    await testActions.testUserDeletion(baseUser.id);
  });
});

test.describe('Bulk Operations Testing', () => {
  let testActions: TestActions;

  test.beforeEach(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
  });

  /**
   * Test: Concurrent User Creation Performance
   * 
   * Purpose: Tests system performance with multiple concurrent user creations
   * Functionality: Creates multiple users simultaneously and validates results
   * Dependencies: None - performance test
   * 
   * This test validates the system's ability to handle multiple concurrent
   * user creation requests and ensures data consistency across operations.
   */
  test('should handle multiple concurrent user operations @performance', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    const userCount = 5; // Reduced for test environment
    const createdUsers: Array<User & { id: string }> = [];
    
    // Create multiple users concurrently
    const userCreationPromises = [];
    for (let i = 0; i < userCount; i++) {
      const userData = {
        ...testData.user,
        email: `concurrent.user.${i}@testdomain.com`,
        username: `concurrentuser${i}`
      };
      
      userCreationPromises.push(testActions.createTestUser(userData));
    }
    
    const users = await Promise.all(userCreationPromises);
    createdUsers.push(...users);
    
    // Validate all users were created successfully
    expect(users.length).toBe(userCount);
    for (const user of users) {
      expect(user).toHaveProperty('id');
      expect(user.email).toContain('concurrent.user');
    }
    
    // Clean up all created users
    for (const user of createdUsers) {
      await testActions.testUserDeletion(user.id);
    }
  });
});
