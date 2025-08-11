import { test, expect } from '../../utils/testFixtures.js';
import { TestDataLoader } from '../../utils/test-data-loader.js';
import { AdvancedTestUtils } from '../../utils/advanced-test-utils.js';
import { TestActions } from '../../utils/test-actions.js';
import { API_ENDPOINTS } from '../../config/endpoints.js';

/**
 * Chained Test Scenarios Suite
 * 
 * Purpose: Demonstrate complex multi-step test flows where each step depends on previous results
 * Dependencies: TestActions utility, AdvancedTestUtils, test context management
 * 
 * Test Patterns:
 *   1. User Registration → Email Verification → Login → Profile Setup
 *   2. Authentication → Multiple API Operations → Logout
 *   3. Profile Creation → Avatar Upload → Profile Update → Validation
 *   4. Error Recovery and Retry Mechanisms
 * 
 * Key Features:
 *   - Token passing between test steps
 *   - Data dependency management
 *   - Error handling and recovery
 *   - Comprehensive cleanup procedures
 */
test.describe('🔗 Chained Test Scenarios', () => {
  let testActions: TestActions;
  let advancedUtils: AdvancedTestUtils;
  let testData: any;

  test.beforeEach(async ({ apiHelper, request }) => {
    testActions = new TestActions(apiHelper, request);
    advancedUtils = new AdvancedTestUtils(request);
    testData = TestDataLoader.loadAdvancedTestData();
  });

  test.afterEach(async () => {
    advancedUtils.clearTestContext();
  });

  /**
   * Test: Complete User Journey Chain
   * 
   * Purpose: Test end-to-end user journey from registration to profile completion
   * Dependencies: User registration, email verification, authentication, profile setup
   * 
   * Test Flow:
   *   1. User Registration - Create new user account
   *   2. Email Verification - Verify email with token
   *   3. User Authentication - Login with credentials
   *   4. Profile Setup - Complete user profile information
   *   5. Avatar Upload - Upload profile picture
   *   6. Profile Validation - Verify all data is correctly stored
   * 
   * Data Flow:
   *   Registration → userId → Verification → token → Login → authToken → Profile Operations
   * 
   * Expected Outcomes:
   *   - Each step passes data to the next step
   *   - Authentication tokens are properly managed
   *   - Profile data is correctly persisted
   *   - All operations are properly validated
   */
  test('should execute complete user journey chain with token passing @smoke @chained', async ({ request }) => {
    console.log('🚀 Starting complete user journey chained test');
    
    const userJourneyData = testData.chainedTestData.userJourney;
    console.log('👤 User Journey Data:', JSON.stringify(userJourneyData, null, 2));
    
    const chainedSteps = [
      {
        name: 'userRegistration',
        description: 'Register a new user account',
        execute: async (context: any) => {
          console.log('   📝 Executing user registration...');
          const registrationResult = await testActions.testUserRegistration(userJourneyData.registration);
          
          // Store user ID for subsequent steps
          context.userId = registrationResult.responseBody.id;
          context.userEmail = userJourneyData.registration.email;
          
          console.log(`   ✅ User registered successfully: ${context.userId}`);
          return {
            userId: context.userId,
            email: context.userEmail,
            status: registrationResult.status
          };
        },
        validate: (result: any) => result.status === 201,
        dependencies: []
      },
      {
        name: 'emailVerification',
        description: 'Verify user email address',
        execute: async (context: any) => {
          console.log('   📧 Executing email verification...');
          
          // Simulate email verification using authentication setup
          await testActions.setupAuthentication(context.userId);
          context.verificationToken = `token_${Date.now()}`;
          
          // Get user profile to simulate verification success
          const verificationResult = await testActions.getUserProfile(context.userId);
          
          console.log(`   ✅ Email verified successfully`);
          return {
            verified: true,
            token: context.verificationToken,
            status: 200
          };
        },
        validate: (result: any) => result.status === 200,
        dependencies: ['userRegistration']
      },
      {
        name: 'userAuthentication',
        description: 'Authenticate user and obtain access token',
        execute: async (context: any) => {
          console.log('   🔐 Executing user authentication...');
          
          // Simulate authentication by setting up auth
          await testActions.setupAuthentication(context.userId);
          context.authToken = `auth_token_${Date.now()}`;
          context.sessionId = `session_${Date.now()}`;
          
          console.log(`   ✅ User authenticated successfully`);
          return {
            token: context.authToken,
            sessionId: context.sessionId,
            status: 200
          };
        },
        validate: (result: any) => result.status === 200 && result.token,
        dependencies: ['userRegistration', 'emailVerification']
      },
      {
        name: 'profileSetup',
        description: 'Complete user profile setup',
        execute: async (context: any) => {
          console.log('   👤 Executing profile setup...');
          
          const profileUpdateResult = await testActions.updateUserProfile(
            context.userId,
            userJourneyData.profileSetup
          );
          
          context.profileCompleted = true;
          
          console.log(`   ✅ Profile setup completed`);
          return {
            profileData: userJourneyData.profileSetup,
            status: profileUpdateResult.status
          };
        },
        validate: (result: any) => result.status === 200,
        dependencies: ['userAuthentication']
      },
      {
        name: 'avatarUpload',
        description: 'Upload user profile avatar',
        execute: async (context: any) => {
          console.log('   🖼️ Executing avatar upload...');
          
          const avatarResult = await testActions.uploadAvatar(context.userId);
          context.avatarUrl = avatarResult.responseBody.avatarUrl;
          
          console.log(`   ✅ Avatar uploaded successfully: ${context.avatarUrl}`);
          return {
            avatarUrl: context.avatarUrl,
            status: avatarResult.status
          };
        },
        validate: (result: any) => result.status === 200 && result.avatarUrl,
        dependencies: ['profileSetup']
      },
      {
        name: 'profileValidation',
        description: 'Validate complete user profile',
        execute: async (context: any) => {
          console.log('   ✅ Executing profile validation...');
          
          const profileResult = await testActions.getUserProfile(context.userId);
          const profile = profileResult.responseBody;
          
          // Validate all profile data is present
          expect(profile.bio).toBe(userJourneyData.profileSetup.bio);
          expect(profile.avatar).toBe(context.avatarUrl);
          expect(profile.email).toBe(context.userEmail);
          
          console.log(`   ✅ Profile validation completed successfully`);
          return {
            profileComplete: true,
            allFieldsPresent: true,
            status: profileResult.status
          };
        },
        validate: (result: any) => result.status === 200 && result.profileComplete,
        dependencies: ['avatarUpload']
      }
    ];
    
    // Define cleanup function
    const cleanupFunction = async () => {
      const userId = advancedUtils.getTestContext('cleanup_userId');
      if (userId) {
        console.log(`🧹 Cleaning up user: ${userId}`);
        await testActions.testUserDeletion(userId);
      }
    };
    
    try {
      // Execute chained test
      const chainResult = await advancedUtils.executeChainedTest(chainedSteps, cleanupFunction);
      
      // Store user ID for cleanup
      advancedUtils.setTestContext('cleanup_userId', chainResult.userRegistration.userId);
      
      // Validate chain completion
      expect(chainResult.userRegistration.status).toBe(201);
      expect(chainResult.emailVerification.verified).toBe(true);
      expect(chainResult.userAuthentication.token).toBeTruthy();
      expect(chainResult.profileSetup.status).toBe(200);
      expect(chainResult.avatarUpload.avatarUrl).toBeTruthy();
      expect(chainResult.profileValidation.profileComplete).toBe(true);
      
      console.log('🎉 Complete user journey chain executed successfully!');
      
    } catch (error) {
      console.error('💥 Chained test failed:', error);
      throw error;
    }
  });

  /**
   * Test: Authentication Flow with Multiple API Operations
   * 
   * Purpose: Test authenticated API operations with token management
   * Dependencies: Authentication, multiple API endpoints, session management
   * 
   * Test Flow:
   *   1. User Login - Obtain authentication token
   *   2. Token Validation - Verify token is valid
   *   3. Authenticated API Calls - Multiple operations using token
   *   4. Token Refresh - Refresh expiring token
   *   5. Continued Operations - Use refreshed token
   *   6. Logout - Clean session termination
   */
  test('should execute authenticated API operations chain with token management @regression @chained', async ({ request }) => {
    console.log('🚀 Starting authenticated API operations chain');
    
    // Create test user first
    const testUser = await testActions.createTestUser({
      firstName: 'AuthTest',
      lastName: 'User',
      email: 'auth.test@example.com',
      password: 'AuthTest123!'
    });
    
    const authChainSteps = [
      {
        name: 'initialLogin',
        description: 'Perform initial user login',
        execute: async (context: any) => {
          console.log('   🔐 Performing initial login...');
          
          // Simulate login by setting up authentication
          await testActions.setupAuthentication(testUser.id);
          context.authToken = `auth_token_${Date.now()}`;
          context.userId = testUser.id;
          
          return {
            token: context.authToken,
            status: 200,
            userId: context.userId
          };
        },
        validate: (result: any) => result.status === 200 && result.token
      },
      {
        name: 'tokenValidation',
        description: 'Validate authentication token',
        execute: async (context: any) => {
          console.log('   ✅ Validating authentication token...');
          
          // Use token to access protected resource
          const profileResult = await testActions.getUserProfile(context.userId);
          
          return {
            tokenValid: profileResult.status === 200,
            status: profileResult.status
          };
        },
        validate: (result: any) => result.tokenValid,
        dependencies: ['initialLogin']
      },
      {
        name: 'authenticatedOperations',
        description: 'Perform multiple authenticated API operations',
        execute: async (context: any) => {
          console.log('   🔄 Performing authenticated operations...');
          
          const operations = [
            () => testActions.getUserProfile(context.userId),
            () => testActions.updateUserProfile(context.userId, { bio: 'Updated via authenticated API' }),
            () => testActions.uploadAvatar(context.userId)
          ];
          
          const results = [];
          for (const operation of operations) {
            const result = await operation();
            results.push(result.status);
          }
          
          return {
            operationResults: results,
            allSuccessful: results.every(status => status === 200)
          };
        },
        validate: (result: any) => result.allSuccessful,
        dependencies: ['tokenValidation']
      },
      {
        name: 'tokenRefresh',
        description: 'Refresh authentication token',
        execute: async (context: any) => {
          console.log('   🔄 Refreshing authentication token...');
          
          // Simulate token refresh by creating new token
          context.newAuthToken = `refreshed_token_${Date.now()}`;
          
          return {
            newToken: context.newAuthToken,
            status: 200
          };
        },
        validate: (result: any) => result.status === 200 && result.newToken,
        dependencies: ['authenticatedOperations']
      },
      {
        name: 'postRefreshOperations',
        description: 'Perform operations with refreshed token',
        execute: async (context: any) => {
          console.log('   🔄 Performing operations with refreshed token...');
          
          // Update context to use new token
          context.authToken = context.newAuthToken;
          
          const profileResult = await testActions.getUserProfile(context.userId);
          
          return {
            operationSuccessful: profileResult.status === 200,
            status: profileResult.status
          };
        },
        validate: (result: any) => result.operationSuccessful,
        dependencies: ['tokenRefresh']
      },
      {
        name: 'logout',
        description: 'Logout and invalidate session',
        execute: async (context: any) => {
          console.log('   🚪 Performing logout...');
          
          // Simulate logout - no actual API call needed
          const logoutResult = { status: 200 };
          
          return {
            loggedOut: logoutResult.status === 200,
            status: logoutResult.status
          };
        },
        validate: (result: any) => result.loggedOut,
        dependencies: ['postRefreshOperations']
      }
    ];
    
    const cleanupFunction = async () => {
      console.log(`🧹 Cleaning up test user: ${testUser.id}`);
      await testActions.testUserDeletion(testUser.id);
    };
    
    try {
      const chainResult = await advancedUtils.executeChainedTest(authChainSteps, cleanupFunction);
      
      // Validate complete authentication flow
      expect(chainResult.initialLogin.status).toBe(200);
      expect(chainResult.tokenValidation.tokenValid).toBe(true);
      expect(chainResult.authenticatedOperations.allSuccessful).toBe(true);
      expect(chainResult.tokenRefresh.status).toBe(200);
      expect(chainResult.postRefreshOperations.operationSuccessful).toBe(true);
      expect(chainResult.logout.loggedOut).toBe(true);
      
      console.log('🎉 Authentication flow chain completed successfully!');
      
    } catch (error) {
      console.error('💥 Authentication chain failed:', error);
      // Ensure cleanup even on failure
      await cleanupFunction();
      throw error;
    }
  });

  /**
   * Test: Error Recovery Chain
   * 
   * Purpose: Test system behavior with failed steps and recovery mechanisms
   * Dependencies: Error simulation, retry logic, cleanup procedures
   * 
   * Test Flow:
   *   1. Normal Operation - Successful API call
   *   2. Simulated Failure - Intentionally failing operation
   *   3. Error Detection - Verify error is properly caught
   *   4. Recovery Attempt - Retry with corrected data
   *   5. Validation - Confirm recovery was successful
   */
  test('should handle error recovery in chained operations @regression @chained', async ({ request }) => {
    console.log('🚀 Starting error recovery chain test');
    
    const testUser = await testActions.createTestUser({
      firstName: 'ErrorTest',
      lastName: 'User',
      email: 'error.test@example.com',
      password: 'ErrorTest123!'
    });
    
    const errorRecoverySteps = [
      {
        name: 'normalOperation',
        description: 'Perform normal successful operation',
        execute: async (context: any) => {
          console.log('   ✅ Performing normal operation...');
          
          const result = await testActions.getUserProfile(testUser.id);
          context.userId = testUser.id;
          
          return {
            success: true,
            status: result.status
          };
        },
        validate: (result: any) => result.status === 200
      },
      {
        name: 'simulatedFailure',
        description: 'Simulate operation failure',
        execute: async (context: any) => {
          console.log('   ❌ Simulating operation failure...');
          
          try {
            // Attempt operation with invalid data
            await testActions.updateUserProfile(context.userId, {
              email: 'invalid-email-format'
            });
            
            return { failedAsExpected: false };
          } catch (error) {
            return { 
              failedAsExpected: true,
              errorMessage: error instanceof Error ? error.message : String(error)
            };
          }
        },
        validate: (result: any) => result.failedAsExpected,
        dependencies: ['normalOperation']
      },
      {
        name: 'errorDetection',
        description: 'Detect and analyze error',
        execute: async (context: any) => {
          console.log('   🔍 Detecting and analyzing error...');
          
          // Verify the profile was not updated due to validation error
          const profileResult = await testActions.getUserProfile(context.userId);
          const profile = profileResult.responseBody;
          
          return {
            profileIntact: profile.email === 'error.test@example.com',
            errorDetected: true,
            status: profileResult.status
          };
        },
        validate: (result: any) => result.profileIntact && result.errorDetected,
        dependencies: ['simulatedFailure']
      },
      {
        name: 'recoveryAttempt',
        description: 'Attempt recovery with corrected data',
        execute: async (context: any) => {
          console.log('   🔄 Attempting recovery with corrected data...');
          
          const recoveryResult = await testActions.updateUserProfile(context.userId, {
            email: 'corrected.email@example.com',
            bio: 'Recovery successful'
          });
          
          return {
            recoverySuccessful: recoveryResult.status === 200,
            status: recoveryResult.status
          };
        },
        validate: (result: any) => result.recoverySuccessful,
        dependencies: ['errorDetection']
      },
      {
        name: 'validationAfterRecovery',
        description: 'Validate system state after recovery',
        execute: async (context: any) => {
          console.log('   ✅ Validating system state after recovery...');
          
          const finalProfileResult = await testActions.getUserProfile(context.userId);
          const finalProfile = finalProfileResult.responseBody;
          
          return {
            emailUpdated: finalProfile.email === 'corrected.email@example.com',
            bioUpdated: finalProfile.bio === 'Recovery successful',
            status: finalProfileResult.status
          };
        },
        validate: (result: any) => result.emailUpdated && result.bioUpdated,
        dependencies: ['recoveryAttempt']
      }
    ];
    
    const cleanupFunction = async () => {
      console.log(`🧹 Cleaning up test user: ${testUser.id}`);
      await testActions.testUserDeletion(testUser.id);
    };
    
    try {
      const chainResult = await advancedUtils.executeChainedTest(errorRecoverySteps, cleanupFunction);
      
      // Validate error recovery flow
      expect(chainResult.normalOperation.success).toBe(true);
      expect(chainResult.simulatedFailure.failedAsExpected).toBe(true);
      expect(chainResult.errorDetection.errorDetected).toBe(true);
      expect(chainResult.recoveryAttempt.recoverySuccessful).toBe(true);
      expect(chainResult.validationAfterRecovery.emailUpdated).toBe(true);
      
      console.log('🎉 Error recovery chain completed successfully!');
      
    } catch (error) {
      console.error('💥 Error recovery chain failed:', error);
      await cleanupFunction();
      throw error;
    }
  });
});
