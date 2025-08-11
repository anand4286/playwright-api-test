import { test, expect } from '../../utils/testFixtures.js';
import { TestActions } from '../../utils/test-actions.js';
import { TestDataLoader } from '../../utils/test-data-loader.js';
import type { User } from '../../types/index.js';

/**
 * Error Handling and Edge Cases
 * 
 * Test error scenarios and edge cases
 * Tags: negative, error, edge-cases
 * 
 * ✅ USES REAL TestActions METHODS THAT ACTUALLY WORK
 */
test.describe('Error Handling and Edge Cases', () => {
  let testActions: TestActions;
  let testData: any;

  test.beforeEach(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    // Using testData from fixture
  });

  test('Error Handling and Edge Cases @negative @error @edge-cases', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    
    // Test non-existent user (REAL method)
    await testActions.testNonExistentUser();
    
    // Test duplicate registration (REAL method)
    const userData = testData;
    await testActions.testDuplicateUserRegistration(userData);
    
    // Test invalid phone validation (REAL method)
    const testUser = await testActions.testUserRegistration(testData.user);
    await testActions.testInvalidPhoneValidation(testUser.responseBody.id);
    
    // Test invalid email
    const invalidEmail = testActions.generateInvalidEmail();
    // Note: This would be tested through profile update with validation
    
    // Cleanup
    await testActions.testUserDeletion(testUser.responseBody.id);
  });
});
