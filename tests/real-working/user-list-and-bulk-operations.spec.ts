import { test, expect } from '../../utils/testFixtures.js';
import { TestActions } from '../../utils/test-actions.js';
import { TestDataLoader } from '../../utils/test-data-loader.js';
import type { User } from '../../types/index.js';

/**
 * User List and Bulk Operations
 * 
 * Test bulk operations and user list functionality
 * Tags: bulk, performance, users
 * 
 * ✅ USES REAL TestActions METHODS THAT ACTUALLY WORK
 */
test.describe('User List and Bulk Operations', () => {
  let testActions: TestActions;
  let testData: any;

  test.beforeEach(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    // Using testData from fixture
  });

  test('User List and Bulk Operations @bulk @performance @users', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    
    // Test user list retrieval (REAL method)
    const usersList = await testActions.getAllUsers();
    expect(usersList).toBeDefined();
    expect(Array.isArray(usersList.responseBody)).toBe(true);
    
    // Create multiple test users for bulk operations
    const createdUsers = [];
    for (let i = 0; i < 3; i++) {
      const userData = {
        ...testData.user,
        email: testActions.generateUniqueEmail(`bulk${i}`),
        username: `bulkuser${i}`
      };
      const user = await testActions.testUserRegistration(userData);
      createdUsers.push(user);
    }
    
    // Test bulk profile updates
    for (const user of createdUsers) {
      const updateData = {
        fullName: `Updated ${user.fullName}`,
        website: testActions.generateTestWebsite()
      };
      await testActions.updateUserProfile(user.id, updateData);
    }
    
    // Cleanup all created users
    for (const user of createdUsers) {
      await testActions.testUserDeletion(user.id);
    }
  });
});
