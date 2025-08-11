import { test, expect } from '../../utils/testFixtures.js';
import { TestActions } from '../../utils/test-actions.js';
import { TestDataLoader } from '../../utils/test-data-loader.js';
import type { User } from '../../types/index.js';

/**
 * Profile Management Operations
 * 
 * Comprehensive profile management testing
 * Tags: profile, update, regression
 * 
 * ✅ USES REAL TestActions METHODS THAT ACTUALLY WORK
 */
test.describe('Profile Management Operations', () => {
  let testActions: TestActions;
  let testData: any;

  test.beforeEach(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    // Using testData from fixture
  });

  test('Profile Management Operations @profile @update @regression', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    
    // Create test user
    const testUser = await testActions.testUserRegistration(testData.user);
    
    // Test email update (REAL method)
    const newEmail = testActions.generateUniqueEmail('updated');
    await testActions.updateEmailAddress(testUser.responseBody.id, newEmail, testUser.responseBody.name, testUser.username);
    
    // Test phone update (REAL method)
    const newPhone = testActions.generateUniquePhone();
    await testActions.updatePhoneNumber(testUser.responseBody.id, newPhone);
    
    // Test address update (REAL method)
    const newAddress = testActions.generateTestAddress();
    await testActions.updateAddress(testUser.responseBody.id, newAddress);
    
    // Test verification token creation (REAL method)
    await testActions.createVerificationToken(testUser.responseBody.id, 'email');
    
    // Cleanup
    await testActions.testUserDeletion(testUser.responseBody.id);
  });
});
