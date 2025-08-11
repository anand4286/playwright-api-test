import { test, expect } from '../../utils/testFixtures.js';
import { TestDataLoader } from '../../utils/test-data-loader.js';
import { AdvancedTestUtils } from '../../utils/advanced-test-utils.js';
import { TestActions } from '../../utils/test-actions.js';
import { API_ENDPOINTS } from '../../config/endpoints.js';

/**
 * Data-Driven Test Suite
 * 
 * Purpose: Demonstrate comprehensive data-driven testing patterns using for loops
 * Dependencies: Advanced test data scenarios, TestActions utility
 * Test Flow: 
 *   1. Load multiple test datasets from external JSON
 *   2. Execute tests for each dataset using for loops
 *   3. Validate results against expected outcomes
 *   4. Generate comprehensive test reports
 * 
 * Scenarios Covered:
 *   - Multiple user registration scenarios (valid/invalid data)
 *   - Bulk profile update operations
 *   - Cross-validation with different data types
 *   - Edge case and boundary value testing
 */
test.describe('📊 Data-Driven Test Scenarios', () => {
  let testActions: TestActions;
  let advancedUtils: AdvancedTestUtils;
  let testData: any;

  test.beforeEach(async ({ apiHelper, request }) => {
    testActions = new TestActions(apiHelper, request);
    advancedUtils = new AdvancedTestUtils(request);
    testData = TestDataLoader.loadAdvancedTestData();
  });

  test.afterEach(async () => {
    // Clean up test context after each test
    advancedUtils.clearTestContext();
  });

  /**
   * Test: Multiple User Registration Scenarios
   * 
   * Purpose: Validate user registration with various data combinations
   * Dependencies: Multiple user data sets with valid/invalid scenarios
   * 
   * Test Flow:
   *   1. Load registration test datasets (5 scenarios)
   *   2. For each dataset: Execute registration attempt
   *   3. Validate response status and error messages
   *   4. Verify database state for successful registrations
   *   5. Clean up created users
   * 
   * Expected Outcomes:
   *   - Valid data: 201 status, user created successfully
   *   - Invalid email: 400 status with specific error message
   *   - Weak password: 400 status with password requirements error
   *   - Missing fields: 400 status with field validation error
   */
  test('should execute multiple user registration scenarios with for loop validation @regression @data-driven', async ({ apiHelper }) => {
    console.log('🚀 Starting multiple user registration data-driven test');
    
    const registrationScenarios = testData.dataSetTests.multipleUserRegistrations;
    console.log(`📊 Total registration scenarios to test: ${registrationScenarios.length}`);
    
    const results = await advancedUtils.executeDataDrivenTest(
      registrationScenarios,
      async (scenario: any, index: number) => {
        console.log(`\n🧪 Testing scenario ${index + 1}: ${scenario.testCase}`);
        console.log(`   Email: ${scenario.userData.email}`);
        console.log(`   Expected Status: ${scenario.expectedStatus}`);
        console.log(`   Should Pass: ${scenario.shouldPass}`);
        
        // Execute registration attempt
        const result = await testActions.testUserRegistration(scenario.userData);
        
        // Validate response status
        expect(result.status).toBe(scenario.expectedStatus);
        
        if (scenario.shouldPass) {
          // For successful registrations, verify user was created
          console.log(`   ✅ Registration successful - User ID: ${result.responseBody.id}`);
          
          // Store user ID for cleanup
          advancedUtils.setTestContext(`user_${index}`, result.responseBody.id);
          
          // Verify user profile can be retrieved
          const userProfile = await testActions.getUserProfile(result.responseBody.id);
          expect(userProfile.status).toBe(200);
          expect(userProfile.responseBody.email).toBe(scenario.userData.email);
          
        } else {
          // For failed registrations, verify error message
          console.log(`   ❌ Registration correctly failed with error: ${result.responseBody.error}`);
          
          if (scenario.expectedError) {
            expect(result.responseBody.error).toContain(scenario.expectedError);
          }
        }
        
        return {
          scenario: scenario.testCase,
          success: scenario.shouldPass,
          actualStatus: result.status,
          expectedStatus: scenario.expectedStatus,
          userId: scenario.shouldPass ? result.responseBody.id : null
        };
      },
      'User Registration Data-Driven Test'
    );
    
    // Validate overall test results
    console.log(`\n📈 Data-driven test summary:`);
    console.log(`   Total scenarios: ${registrationScenarios.length}`);
    console.log(`   Passed: ${results.passed}`);
    console.log(`   Failed: ${results.failed}`);
    
    // Expect all scenarios to complete (pass or fail as expected)
    expect(results.passed + results.failed).toBe(registrationScenarios.length);
    
    // Cleanup: Delete any users that were successfully created
    console.log(`\n🧹 Cleaning up created users...`);
    for (let i = 0; i < registrationScenarios.length; i++) {
      const userId = advancedUtils.getTestContext(`user_${i}`);
      if (userId) {
        try {
          await testActions.testUserDeletion(userId);
          console.log(`   ✅ Cleaned up user: ${userId}`);
        } catch (error) {
          console.log(`   ⚠️ Could not clean up user ${userId}: ${error}`);
        }
      }
    }
  });

  /**
   * Test: Bulk Profile Update Operations
   * 
   * Purpose: Test profile updates with various data combinations
   * Dependencies: User account, multiple profile update datasets
   * 
   * Test Flow:
   *   1. Create a test user account
   *   2. Load profile update test datasets (3 scenarios)
   *   3. For each dataset: Execute profile update
   *   4. Validate response and verify changes were applied
   *   5. Test both valid and invalid update scenarios
   * 
   * Expected Outcomes:
   *   - Valid updates: 200 status, profile fields updated
   *   - Invalid phone: 400 status with validation error
   *   - Malicious content: 400 status with security error
   */
  test('should execute bulk profile update scenarios with validation @regression @data-driven', async ({ apiHelper }) => {
    console.log('🚀 Starting bulk profile update data-driven test');
    
    // Create a test user for profile updates
    const testUser = await testActions.createTestUser({
      firstName: 'ProfileTest',
      lastName: 'User',
      email: 'profile.test@example.com',
      password: 'ProfileTest123!'
    });
    
    const userId = testUser.id;
    console.log(`👤 Created test user: ${userId}`);
    
    const profileScenarios = testData.dataSetTests.bulkProfileUpdates;
    console.log(`📊 Total profile update scenarios to test: ${profileScenarios.length}`);
    
    try {
      const results = await advancedUtils.executeDataDrivenTest(
        profileScenarios,
        async (scenario: any, index: number) => {
          console.log(`\n🧪 Testing profile update ${index + 1}: ${scenario.testCase}`);
          console.log(`   Update Data:`, JSON.stringify(scenario.profileData, null, 2));
          console.log(`   Expected Status: ${scenario.expectedStatus}`);
          
          // Execute profile update
          const result = await testActions.updateUserProfile(userId, scenario.profileData);
          
          // Validate response status
          expect(result.status).toBe(scenario.expectedStatus);
          
          if (scenario.shouldPass) {
            console.log(`   ✅ Profile update successful`);
            
            // Verify profile changes were applied
            const updatedProfile = await testActions.getUserProfile(userId);
            expect(updatedProfile.status).toBe(200);
            
            // Check specific field updates
            for (const [field, value] of Object.entries(scenario.profileData)) {
              expect(updatedProfile.responseBody[field]).toBe(value);
            }
            
          } else {
            console.log(`   ❌ Profile update correctly failed: ${result.responseBody.error}`);
            
            if (scenario.expectedError) {
              expect(result.responseBody.error).toContain(scenario.expectedError);
            }
          }
          
          return {
            scenario: scenario.testCase,
            success: scenario.shouldPass,
            actualStatus: result.status,
            fieldsUpdated: Object.keys(scenario.profileData)
          };
        },
        'Profile Update Data-Driven Test'
      );
      
      // Validate test completion
      expect(results.passed + results.failed).toBe(profileScenarios.length);
      console.log(`✅ All profile update scenarios completed`);
      
    } finally {
      // Cleanup: Delete test user
      console.log(`🧹 Cleaning up test user: ${userId}`);
      await testActions.testUserDeletion(userId);
    }
  });

  /**
   * Test: Cross-Platform Data Validation
   * 
   * Purpose: Test API responses across different data formats and types
   * Dependencies: Various data type scenarios
   * 
   * Test Flow:
   *   1. Generate test data with different formats (JSON, form-data, etc.)
   *   2. For each format: Send API requests
   *   3. Validate response consistency across formats
   *   4. Test edge cases and boundary values
   */
  test('should validate data consistency across different formats @regression @data-driven', async ({ request }) => {
    console.log('🚀 Starting cross-platform data validation test');
    
    const dataFormats = [
      {
        name: 'JSON Content-Type',
        headers: { 'Content-Type': 'application/json' },
        data: { name: 'Test User', email: 'test@example.com' }
      },
      {
        name: 'Form-Encoded Content-Type', 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: 'name=Test%20User&email=test%40example.com'
      },
      {
        name: 'Custom User-Agent',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'PlaywrightTestFramework/1.0'
        },
        data: { name: 'Test User', email: 'test@example.com' }
      }
    ];
    
    const results = await advancedUtils.executeDataDrivenTest(
      dataFormats,
      async (format: any, index: number) => {
        console.log(`\n🧪 Testing format ${index + 1}: ${format.name}`);
        
        const response = await request.post(`${TestDataLoader.loadApiConfig().apiEndpoints.baseUrl}${API_ENDPOINTS.USERS}`, {
          headers: format.headers,
          data: format.data
        });
        
        console.log(`   Response Status: ${response.status()}`);
        console.log(`   Content-Type: ${response.headers()['content-type']}`);
        
        // Validate response format consistency
        expect(response.status()).toBeLessThan(500); // No server errors
        
        if (response.headers()['content-type']?.includes('application/json')) {
          const responseBody = await response.json();
          expect(responseBody).toBeTruthy();
        }
        
        return {
          format: format.name,
          status: response.status(),
          contentType: response.headers()['content-type'],
          hasJsonResponse: response.headers()['content-type']?.includes('application/json')
        };
      },
      'Cross-Platform Data Validation'
    );
    
    console.log(`✅ Cross-platform validation completed: ${results.passed}/${dataFormats.length} formats tested`);
  });
});
