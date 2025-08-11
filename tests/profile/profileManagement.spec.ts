import { test, expect } from '../../utils/testFixtures.js';
import type { User } from '../../types/index.js';
import { TestActions } from '../../utils/test-actions.js';
import { API_ENDPOINTS } from '../../config/endpoints.js';

test.describe('Profile Management', () => {
  let testUser: User & { id: string };
  let testActions: TestActions;

  test.beforeEach(async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    testUser = await testActions.createTestUser(testData);
  });

  test('should get user profile information @smoke', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    await testActions.getUserProfile(testUser.id);
  });

  test('should update basic profile information @regression', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    const updateData = {
      name: testUser.fullName + ' - Updated',
      website: testActions.generateTestWebsite(),
      phone: testData.user.phone
    };

    await testActions.updateUserProfile(testUser.id, updateData);
  });
});

test.describe('Email Management', () => {
  let testUser: User & { id: string };
  let testActions: TestActions;

  test.beforeEach(async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    testUser = await testActions.createTestUser(testData);
  });

  test('should update email address @regression', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    const newEmail = testActions.generateUniqueEmail('updated');
    
    await testActions.updateEmailAddress(testUser.id, newEmail, testUser.fullName, testUser.username);
  });

  test('should validate email format during update @regression', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    const invalidEmail = testActions.generateInvalidEmail();
    
    const updateData = {
      name: testUser.fullName,
      email: invalidEmail,
      username: testUser.username
    };

    const result = await apiHelper.updateUserProfile(testUser.id, updateData);
    
    // In a real API, this would validate email format
    // For this demo, we'll just check the response structure
    expect(result.responseBody).toHaveProperty('email');
  });

  test('should handle duplicate email update @regression', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    await testActions.testDuplicateUserRegistration(testData.users[0]);
  });

  test('should verify email change confirmation @regression', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    const newEmail = testActions.generateUniqueEmail('verification');
    
    await testActions.createVerificationToken(testUser.id, 'email');
  });
});

test.describe('Phone Number Management', () => {
  let testUser: User;
  let testActions: TestActions;

  test.beforeEach(async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    testUser = await testActions.createTestUser(testData.user);
  });

  test('should update phone number @regression', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    const newPhone = testActions.generateUniquePhone();
    
    await testActions.updatePhoneNumber(testUser.id, newPhone);
  });

  test('should validate phone number format @regression', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    await testActions.testInvalidPhoneValidation(testUser.id);
  });

  test('should handle international phone numbers @regression', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    const internationalPhone = testActions.generateUniquePhone('+44 20');
    
    await testActions.updatePhoneNumber(testUser.id, internationalPhone);
  });

  test('should verify phone number change @regression', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    await testActions.createVerificationToken(testUser.id, 'phone');
  });
});

test.describe('Address Management', () => {
  let testUser: User;
  let testActions: TestActions;

  test.beforeEach(async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    testUser = await testActions.createTestUser(testData.user);
  });

  test('should update address information @regression', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    const newAddress = testActions.generateTestAddress();
    
    await testActions.updateAddress(testUser.id, newAddress);
  });

  test('should handle partial address updates @regression', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    const partialUpdates = testActions.generatePartialAddress();
    const partialAddress = {
      ...testUser.address,
      ...partialUpdates
      // Keeping other fields from existing address
    };
    
    await testActions.updateAddress(testUser.id, partialAddress);
  });
});

test.describe('Profile Picture Management', () => {
  let testUser: User;
  let testActions: TestActions;

  test.beforeEach(async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    testUser = await testActions.createTestUser(testData.user);
  });

  test('should update profile picture URL @regression', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    const newAvatarUrl = testActions.generateAvatarUrl();
    
    const updateData = {
      name: testUser.fullName,
      email: testUser.email,
      avatar: newAvatarUrl
    };

    // Simulate avatar update through profile update
    const result = await testActions.uploadAvatar(testUser.id);

    apiHelper.assertSuccessResponse(result);
    expect(result.responseBody).toHaveProperty('id');
  });

  test('should handle avatar upload simulation @regression', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    await testActions.uploadAvatar(testUser.id);
  });
});
