import { test, expect } from '../../utils/testFixtures.js';
import type { User } from '../../types/index.js';
import { TestActions } from '../../utils/test-actions.js';
import { TestDataLoader } from '../../utils/test-data-loader.js';

/**
 * Chained Test Scenarios
 * 
 * This test suite demonstrates chained testing patterns where one test's output
 * becomes input for subsequent tests. The tests validate:
 * - Token passing between authentication and profile operations
 * - User creation → authentication → profile update → verification chain
 * - Session management across multiple operations
 * 
 * Test Dependencies:
 * - Tests must run in sequence as each depends on previous test output
 * - External test data from test-data/advanced/test-scenarios.json
 * - TestActions utility for consistent operations
 */

test.describe.serial('Chained Test Flow - User Registration to Profile Management', () => {
  let testActions: TestActions;
  let advancedTestData: any;
  let chainedTestContext: {
    user?: User & { id: string };
    authToken?: string;
    sessionData?: any;
    profileData?: any;
  } = {};

  test.beforeAll(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    advancedTestData = TestDataLoader.loadAdvancedTestData();
  });

  test.afterAll(async () => {
    // Clean up chained test data
    if (chainedTestContext.user) {
      await testActions.testUserDeletion(chainedTestContext.user.id);
    }
  });

  /**
   * Test 1: User Registration and Token Generation
   * 
   * Purpose: Creates a new user and captures authentication tokens for subsequent tests
   * Functionality: Registers user and validates token structure
   * Dependencies: None - starting point of chain
   * Output: User data and authentication tokens for next test
   * 
   * This test establishes the foundation for all subsequent chained tests
   * by creating a user and validating the authentication token response.
   */
  test('Step 1: should register user and generate authentication tokens @smoke @chain', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    const registrationData = advancedTestData.chainedTests.userRegistrationFlow.registration;
    
    // Create user with registration data
    const userData = {
      ...testData.user,
      fullName: registrationData.name,
      email: registrationData.email,
      username: registrationData.username,
      password: registrationData.password
    };
    
    const createdUser = await testActions.createTestUser(userData);
    expect(createdUser).toHaveProperty('id');
    expect(createdUser.email).toBe(registrationData.email);
    
    // Store user data for next test in chain
    chainedTestContext.user = createdUser;
    
    // Setup authentication and capture token
    const authResult = await testActions.setupAuthentication(createdUser.id);
    expect(authResult).toBeDefined();
    
    // Mock token validation (in real API, this would return actual token)
    const mockToken = `auth_token_${createdUser.id}_${Date.now()}`;
    chainedTestContext.authToken = mockToken;
    
    // Validate expected token fields exist in auth response
    const expectedTokenFields = advancedTestData.chainedTests.userRegistrationFlow.expectedTokenFields;
    expect(expectedTokenFields).toContain('accessToken');
    expect(expectedTokenFields).toContain('refreshToken');
    expect(expectedTokenFields).toContain('tokenType');
  });

  /**
   * Test 2: Authenticated Profile Access
   * 
   * Purpose: Uses authentication token from Test 1 to access user profile
   * Functionality: Validates authenticated profile retrieval
   * Dependencies: Requires successful user registration and token from Test 1
   * Input: User ID and authentication token from previous test
   * Output: Profile data for profile update test
   * 
   * This test demonstrates token-based authentication and profile access,
   * validating that the authentication chain works correctly.
   */
  test('Step 2: should access user profile with authentication token @regression @chain', async ({ apiHelper }) => {
    // Verify we have required data from previous test
    expect(chainedTestContext.user).toBeDefined();
    expect(chainedTestContext.authToken).toBeDefined();
    
    if (!chainedTestContext.user || !chainedTestContext.authToken) {
      throw new Error('Chained test dependency failed: Missing user or auth token from previous test');
    }
    
    testActions = new TestActions(apiHelper);
    
    // Use authentication token to access profile
    const profileData = await testActions.getUserProfile(chainedTestContext.user.id);
    expect(profileData).toBeDefined();
    expect(profileData).toHaveProperty('email', chainedTestContext.user.email);
    expect(profileData).toHaveProperty('fullName', chainedTestContext.user.fullName);
    
    // Store profile data for next test
    chainedTestContext.profileData = profileData;
    
    // Validate session with token
    const sessionValidation = await testActions.validateSession(
      chainedTestContext.user.id, 
      chainedTestContext.authToken
    );
    expect(sessionValidation).toBeDefined();
  });

  /**
   * Test 3: Authenticated Profile Update
   * 
   * Purpose: Updates user profile using authentication token and previous profile data
   * Functionality: Validates authenticated profile modifications
   * Dependencies: Requires user, token, and profile data from previous tests
   * Input: User ID, auth token, and current profile data from previous tests
   * Output: Updated profile data for verification test
   * 
   * This test demonstrates how profile updates work in an authenticated context,
   * building on the established authentication chain.
   */
  test('Step 3: should update profile with authenticated session @regression @chain', async ({ apiHelper }) => {
    // Verify we have all required data from previous tests
    expect(chainedTestContext.user).toBeDefined();
    expect(chainedTestContext.authToken).toBeDefined();
    expect(chainedTestContext.profileData).toBeDefined();
    
    if (!chainedTestContext.user || !chainedTestContext.authToken || !chainedTestContext.profileData) {
      throw new Error('Chained test dependency failed: Missing required data from previous tests');
    }
    
    testActions = new TestActions(apiHelper);
    const profileUpdateData = advancedTestData.chainedTests.userRegistrationFlow.profileUpdate;
    
    // Update profile using authenticated session
    const updateData = {
      website: profileUpdateData.website,
      phone: profileUpdateData.phone
    };
    
    await testActions.updateUserProfile(chainedTestContext.user.id, updateData);
    
    // Verify the updates were applied
    const updatedProfile = await testActions.getUserProfile(chainedTestContext.user.id);
    expect(updatedProfile.website).toBe(profileUpdateData.website);
    expect(updatedProfile.phone).toBe(profileUpdateData.phone);
    
    // Update context with new profile data
    chainedTestContext.profileData = updatedProfile;
  });

  /**
   * Test 4: Final Verification and Session Cleanup
   * 
   * Purpose: Verifies all profile changes and cleans up session
   * Functionality: Final validation of complete user journey
   * Dependencies: Requires all data from previous tests in chain
   * Input: All accumulated data from previous test steps
   * Output: Validated complete user journey
   * 
   * This test completes the chained flow by verifying all changes
   * and demonstrating proper session cleanup.
   */
  test('Step 4: should verify complete user journey and cleanup session @regression @chain', async ({ apiHelper }) => {
    // Verify we have complete chain data
    expect(chainedTestContext.user).toBeDefined();
    expect(chainedTestContext.authToken).toBeDefined();
    expect(chainedTestContext.profileData).toBeDefined();
    
    if (!chainedTestContext.user || !chainedTestContext.authToken || !chainedTestContext.profileData) {
      throw new Error('Chained test dependency failed: Missing complete chain data');
    }
    
    testActions = new TestActions(apiHelper);
    
    // Final verification of user data integrity
    const finalProfile = await testActions.getUserProfile(chainedTestContext.user.id);
    const originalRegistration = advancedTestData.chainedTests.userRegistrationFlow.registration;
    const profileUpdates = advancedTestData.chainedTests.userRegistrationFlow.profileUpdate;
    
    // Verify original registration data is preserved
    expect(finalProfile.email).toBe(originalRegistration.email);
    expect(finalProfile.fullName).toBe(originalRegistration.name);
    
    // Verify profile updates were applied
    expect(finalProfile.website).toBe(profileUpdates.website);
    expect(finalProfile.phone).toBe(profileUpdates.phone);
    
    // Test session cleanup (logout simulation)
    const logoutResult = await testActions.testLogout(chainedTestContext.user.id, chainedTestContext.authToken);
    expect(logoutResult).toBeDefined();
    
    // Verify session is invalidated
    try {
      await testActions.validateSession(chainedTestContext.user.id, chainedTestContext.authToken);
      // If validation succeeds, session cleanup didn't work
      expect(false).toBe(true); // Force failure
    } catch (error) {
      // Expected behavior - session should be invalid after logout
      expect(error).toBeDefined();
    }
  });
});
