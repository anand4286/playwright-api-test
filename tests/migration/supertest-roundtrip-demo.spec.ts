import { test, expect } from '../../utils/testFixtures.js';
import { TestActions } from '../../utils/test-actions.js';
import { TestDataLoader } from '../../utils/test-data-loader.js';

/**
 * Supertest Round-Trip Conversion Demo
 * 
 * This test demonstrates the full migration workflow:
 * 1. Run Playwright tests with Supertest-style logging
 * 2. Generate logs in Supertest format
 * 3. Convert logs back to Playwright tests
 * 4. Validate the round-trip conversion
 * 
 * Tags: @supertest @migration @roundtrip
 */
test.describe('Supertest Round-Trip Migration Demo', () => {
  let testActions: TestActions;
  let testData: any;

  test.beforeEach(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    testData = TestDataLoader.loadDemoData();
    
    // Enable Supertest format logging for this test
    testActions.enableSupertestFormat(true);
    
    // Setup test user for demo
    testData.user = await testActions.createTestUser(testData);
  });

  /**
   * Demo Test 1: User Authentication Flow
   * 
   * This test will generate logs in Supertest format that can be
   * converted back to Playwright tests for migration validation
   */
  test('should authenticate user with valid credentials for migration demo @supertest @migration', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    testActions.enableSupertestFormat(true);
    
    // Start Supertest-style test logging
    testActions.startSupertestTest('success User Authentication', ['supertest', 'migration', 'auth']);
    
    // Step 1: Setup Authentication
    testActions.endSupertestStep('User Authentication Setup');
    apiHelper.setStep('Setup User Authentication');
    
    const authResult = await testActions.setupAuthentication(testData.user.id);
    apiHelper.assertSuccessResponse(authResult);
    expect(authResult.responseBody.id).toBeDefined();
    
    // Step 2: Get User Profile
    testActions.endSupertestStep('User Profile Retrieval');
    apiHelper.setStep('Get User Profile');
    
    const profileResult = await testActions.getUserProfile(testData.user.id);
    apiHelper.assertSuccessResponse(profileResult);
    expect(profileResult.responseBody.email).toBe(testData.user.email);
    
    // End test logging
    testActions.endSupertestStep('Authentication Flow Complete');
  });

  /**
   * Demo Test 2: User Profile Update Flow
   * 
   * Another test that generates Supertest-style logs for conversion
   */
  test('should update user profile successfully for migration demo @supertest @migration', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    testActions.enableSupertestFormat(true);
    
    // Start Supertest-style test logging
    testActions.startSupertestTest('success User Profile Update', ['supertest', 'migration', 'profile']);
    
    // Step 1: Authenticate User
    testActions.endSupertestStep('User Authentication');
    apiHelper.setStep('Setup User Authentication');
    
    const authResult = await testActions.setupAuthentication(testData.user.id);
    apiHelper.assertSuccessResponse(authResult);
    
    // Step 2: Update Profile
    testActions.endSupertestStep('Profile Update');
    apiHelper.setStep('Update User Profile');
    
    const updateData = {
      fullName: 'Updated Test User',
      phone: '+1-555-0199',
      address: {
        street: '456 Updated St',
        city: 'Updated City',
        state: 'Updated State',
        zipCode: '54321'
      }
    };
    
    const updateResult = await testActions.updateUserProfile(testData.user.id, updateData);
    apiHelper.assertSuccessResponse(updateResult);
    expect(updateResult.responseBody.fullName).toBe(updateData.fullName);
    
    // Step 3: Verify Update
    testActions.endSupertestStep('Profile Verification');
    apiHelper.setStep('Verify Profile Update');
    
    const verifyResult = await testActions.getUserProfile(testData.user.id);
    apiHelper.assertSuccessResponse(verifyResult);
    expect(verifyResult.responseBody.fullName).toBe(updateData.fullName);
    expect(verifyResult.responseBody.phone).toBe(updateData.phone);
    
    // End test logging
    testActions.endSupertestStep('Profile Update Flow Complete');
  });

  test.afterEach(async () => {
    // Disable Supertest format after each test
    testActions.enableSupertestFormat(false);
  });
});
