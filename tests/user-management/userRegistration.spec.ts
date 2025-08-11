import { test, expect } from '../../utils/testFixtures.js';
import { User } from '../../types/index.js';
import { TestActions } from '../../utils/test-actions.js';

test.describe('User Registration Flow', () => {
  test('should register a new user successfully @smoke @regression', async ({ apiHelper, testData }) => {
    const testActions = new TestActions(apiHelper);
    
    // Step 1: Register new user using TestActions
    const testUser = await testActions.testUserRegistration(testData.user);
    
    // Store user ID for cleanup or further tests
    test.info().annotations.push({ type: 'user-id', description: testUser.id });
  });

  test('should handle duplicate email registration @regression', async ({ apiHelper, testData }) => {
    const testActions = new TestActions(apiHelper);
    const existingUser: User = testData.user;
    
    await testActions.testDuplicateUserRegistration(existingUser);
  });

  test('should validate required fields during registration @regression', async ({ apiHelper }) => {
    const testActions = new TestActions(apiHelper);
    await testActions.testIncompleteUserRegistration();
  });
});

test.describe('User Management Operations', () => {
  let testUser: User;
  let testActions: TestActions;
  
  test.beforeEach(async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    testUser = await testActions.createTestUser(testData.user);
  });

  test('should retrieve user profile @smoke', async ({ apiHelper }) => {
    const profile = await testActions.getUserProfile(testUser.id);
    expect(profile.id).toBe(testUser.id);
  });

  test('should update user profile successfully @regression', async ({ apiHelper, testData }) => {
    const updateData = {
      name: testData.user.fullName + ' Updated',
      phone: testData.user.phone,
      website: testData.user.website
    };
    
    await testActions.updateUserProfile(testUser.id, updateData);
  });

  test('should handle user not found scenario @regression', async ({ apiHelper }) => {
    const testActions = new TestActions(apiHelper);
    await testActions.testNonExistentUser();
  });

  test('should delete user account @regression', async ({ apiHelper }) => {
    const testActions = new TestActions(apiHelper);
    await testActions.testUserDeletion(testUser.id);
  });
});

test.describe('Bulk User Operations', () => {
  test('should handle multiple user creation @performance', async ({ apiHelper, testData }) => {
    const testActions = new TestActions(apiHelper);
    const users: User[] = testData.users.slice(0, 3); // Test with 3 users
    const createdUsers: User[] = [];
    
    for (const user of users) {
      const testUser = await testActions.createTestUser(user);
      createdUsers.push(testUser);
    }
    
    expect(createdUsers).toHaveLength(3);
    
    // Verify all users were created with unique IDs
    const userIds = createdUsers.map(user => user.id);
    const uniqueIds = [...new Set(userIds)];
    expect(uniqueIds).toHaveLength(3);
  });

  test('should retrieve list of users @smoke', async ({ apiHelper }) => {
    const testActions = new TestActions(apiHelper);
    await testActions.getAllUsers();
  });
});
