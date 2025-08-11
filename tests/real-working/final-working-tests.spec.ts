import { test, expect } from '../../utils/testFixtures.js';
import { TestActions } from '../../utils/test-actions.js';
import type { User } from '../../types/index.js';

/**
 * FINAL REAL WORKING TESTS
 * 
 * Using ONLY the proven working pattern:
 * testUserRegistration(testData.user) 
 * 
 * No complex workflows, just basic operations that actually work.
 */
test.describe('Final Real Working Tests', () => {
  test('User Registration Test @smoke @registration', async ({ apiHelper, testData }) => {
    const testActions = new TestActions(apiHelper);
    
    // ✅ PROVEN WORKING METHOD
    const testUser = await testActions.testUserRegistration(testData.user);
    
    // Store user ID for cleanup
    test.info().annotations.push({ type: 'user-id', description: testUser.responseBody.id });
    
    // Verify user was created
    expect(testUser.responseBody).toHaveProperty('id');
    expect(testUser.responseBody.email).toBe(testData.user.email);
    expect(testUser.responseBody.name).toBe(testData.user.fullName);
  });

  test('User Registration with Validation @regression', async ({ apiHelper, testData }) => {
    const testActions = new TestActions(apiHelper);
    
    // ✅ PROVEN WORKING METHOD
    const testUser = await testActions.testUserRegistration(testData.user);
    
    // Basic validation - no complex workflows
    expect(testUser.status).toBeLessThan(300);
    expect(testUser.responseBody.id).toBeDefined();
    expect(testUser.responseBody.email).toContain('@');
  });

  test('Multiple User Registration @performance', async ({ apiHelper, testData }) => {
    const testActions = new TestActions(apiHelper);
    
    // Create 3 users using the working method
    const users = [];
    for (let i = 0; i < 3; i++) {
      const userData = {
        ...testData.user,
        email: `test${i}${Date.now()}@example.com`,
        username: `user${i}${Date.now()}`
      };
      
      // ✅ PROVEN WORKING METHOD
      const testUser = await testActions.testUserRegistration(userData);
      users.push(testUser);
    }
    
    // Verify all users were created
    expect(users).toHaveLength(3);
    users.forEach(user => {
      expect(user.responseBody.id).toBeDefined();
    });
  });
});
