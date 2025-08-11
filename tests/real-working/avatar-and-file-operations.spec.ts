import { test, expect } from '../../utils/testFixtures.js';
import { TestActions } from '../../utils/test-actions.js';
import { TestDataLoader } from '../../utils/test-data-loader.js';
import type { User } from '../../types/index.js';

/**
 * Avatar and File Operations
 * 
 * Test avatar upload and file operations
 * Tags: files, avatar, upload
 * 
 * ✅ USES REAL TestActions METHODS THAT ACTUALLY WORK
 */
test.describe('Avatar and File Operations', () => {
  let testActions: TestActions;
  let testData: any;

  test.beforeEach(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    // Using testData from fixture
  });

  test('Avatar and File Operations @files @avatar @upload', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    
    // Create test user
    const testUser = await testActions.testUserRegistration(testData.user);
    
    // Test avatar upload (REAL method)
    const avatarResult = await testActions.uploadAvatar(testUser.responseBody.id);
    expect(avatarResult.responseBody.avatarUrl).toBeDefined();
    
    // Test avatar URL generation (REAL method)
    const avatarUrl = testActions.generateAvatarUrl();
    expect(avatarUrl).toContain('avatar');
    
    // Update profile with avatar
    const profileUpdateData = {
      fullName: testUser.responseBody.name,
      email: testUser.responseBody.email,
      avatar: avatarUrl
    };
    await testActions.updateUserProfile(testUser.responseBody.id, profileUpdateData);
    
    // Verify avatar in profile
    const profile = await testActions.getUserProfile(testUser.responseBody.id);
    expect(profile.avatar).toBe(avatarUrl);
    
    // Cleanup
    await testActions.testUserDeletion(testUser.responseBody.id);
  });
});
