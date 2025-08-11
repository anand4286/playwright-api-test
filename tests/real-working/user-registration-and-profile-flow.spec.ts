import { test, expect } from '../../utils/testFixtures.js';
import { TestActions } from '../../utils/test-actions.js';
import { TestDataLoader } from '../../utils/test-data-loader.js';
import type { User } from '../../types/index.js';

/**
 * User Registration and Profile Flow
 * 
 * Complete user registration, authentication, and profile management flow
 * Tags: smoke, registration, auth
 * 
 * ✅ USES REAL TestActions METHODS THAT ACTUALLY WORK
 */
test.describe('User Registration and Profile Flow', () => {
  let testActions: TestActions;
  let testData: any;

  test.beforeEach(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    // Using testData from fixture
  });

  test('User Registration and Profile Flow @smoke @registration @auth', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    
    // Test user creation (REAL method)
    const testUser = await testActions.testUserRegistration(testData);
    expect(testUser.responseBody).toHaveProperty('id');
    expect(testUser.responseBody.email).toBeDefined();
    
    // Test authentication setup (REAL method)
    await testActions.setupAuthentication(testUser.responseBody.id);
    
    // Test profile retrieval (REAL method)
    const profile = await testActions.getUserProfile(testUser.responseBody.id);
    expect(profile).toBeDefined();
    expect(profile.email).toBe(testUser.responseBody.email);
    
    // Test profile update (REAL method)
    const updateData = {
      fullName: 'Updated Test User',
      website: 'https://updated-test.example.com',
      phone: '+1-555-0199'
    };
    await testActions.updateUserProfile(testUser.responseBody.id, updateData);
    
    // Verify updates (REAL method)
    const updatedProfile = await testActions.getUserProfile(testUser.responseBody.id);
    expect(updatedProfile.fullName).toBe(updateData.fullName);
    expect(updatedProfile.website).toBe(updateData.website);
    
    // Cleanup (REAL method)
    await testActions.testUserDeletion(testUser.responseBody.id);
  });
});
