import { test, expect } from '../../utils/testFixtures.js';
import { TestActions } from '../../utils/test-actions.js';
import type { User } from '../../types/index.js';

/**
 * Simplest Real Working Test
 * 
 * Copy exact approach from proven working test
 * Uses the same method calls as the successful tests
 * 
 * ✅ USES EXACT SAME PATTERN AS WORKING TESTS
 */
test.describe('Simple Real Working Test', () => {
  test('should register a new user successfully (copy of working test) @smoke @regression', async ({ apiHelper, testData }) => {
    const testActions = new TestActions(apiHelper);
    
    // Step 1: Register new user using TestActions - EXACT SAME AS WORKING TEST
    const testUser = await testActions.testUserRegistration(testData.user);
    
    // Store user ID for cleanup or further tests
    test.info().annotations.push({ type: 'user-id', description: testUser.id });
  });

  test('should create and manage user (copy working pattern) @smoke', async ({ apiHelper, testData }) => {
    const testActions = new TestActions(apiHelper);
    
    // Create user - EXACT SAME AS WORKING TESTS
    const testUser = await testActions.createTestUser(testData.user);
    
    // Get profile - EXACT SAME AS WORKING TESTS
    const profile = await testActions.getUserProfile(testUser.id);
    expect(profile.id).toBe(testUser.id);
    
    // Update profile - EXACT SAME AS WORKING TESTS
    const updateData = {
      name: testData.user.fullName + ' Updated',
      phone: testData.user.phone,
      website: testData.user.website
    };
    
    await testActions.updateUserProfile(testUser.id, updateData);
    
    // Cleanup - EXACT SAME AS WORKING TESTS
    await testActions.testUserDeletion(testUser.id);
  });
});
