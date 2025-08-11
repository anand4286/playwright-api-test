import { test, expect } from '../../utils/testFixtures.js';
import type { User } from '../../types/index.js';
import { TestDataLoader } from '../../utils/test-data-loader';
import { TestActions } from '../../utils/test-actions.js';

test.describe('Authentication Flow', () => {
  let testUser: User & { id: string };
  let testActions: TestActions;

  test.beforeAll(async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    // Create a test user for authentication tests
    testUser = await testActions.createTestUser(testData);
  });

  test('should authenticate user with valid credentials @smoke @critical-path', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    await testActions.setupAuthentication(testUser.id);
  });

  test('should reject invalid credentials @regression', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    await testActions.testInvalidAuthentication();
  });

  test('should handle missing credentials @regression', async ({ apiHelper }) => {
    const testActions = new TestActions(apiHelper);
    await testActions.testIncompleteCredentials(testUser.email);
  });
});

test.describe('Session Management', () => {
  let sessionData: { user: User & { id: string }, sessionToken: string };
  let testActions: TestActions;

  test.beforeEach(async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    sessionData = await testActions.setupSession(testData);
  });

  test('should maintain session with valid token @smoke', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    await testActions.validateSession(sessionData.user.id, sessionData.sessionToken);
  });

  test('should refresh authentication token @regression', async ({ apiHelper, testData }) => {
    await testActions.testTokenRefresh(sessionData.user.id, testData.authData.refreshToken);
  });

  test('should handle session timeout scenarios @regression', async ({ apiHelper }) => {
    await testActions.testSessionTimeout(sessionData.user.id);
  });

  test('should logout user successfully @smoke', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    await testActions.testLogout(sessionData.user.id, sessionData.sessionToken);
  });
});

test.describe('Password Management', () => {
  let testUser: User & { id: string };
  let testActions: TestActions;

  test.beforeEach(async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    testUser = await testActions.createTestUser(testData);
  });

  test('should change password with valid current password @regression', async ({ apiHelper, testData }) => {
    const newPassword = testActions.generateSecurePassword('New');
    await testActions.testPasswordChange(testUser.id, testData.authData.password, newPassword);
  });

  test('should reject password change with invalid current password @regression', async ({ apiHelper }) => {
    await testActions.testInvalidPasswordChange(testUser.id);
  });

  test('should handle forgot password request @regression', async ({ apiHelper }) => {
    await testActions.testPasswordReset(testUser.email);
  });

  test('should reset password with valid token @regression', async ({ apiHelper, testData }) => {
    await testActions.testPasswordResetWithToken(testUser.id, testData.authData.accessToken);
  });
});
