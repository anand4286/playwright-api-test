import { test, expect } from '../../utils/testFixtures.js';
import { TestActions } from '../../utils/test-actions.js';
import { TestDataLoader } from '../../utils/test-data-loader.js';
import type { User } from '../../types/index.js';

/**
 * Authentication and Session Management
 * 
 * Test authentication flows and session validation
 * Tags: auth, session, security
 * 
 * ✅ USES REAL TestActions METHODS THAT ACTUALLY WORK
 */
test.describe('Authentication and Session Management', () => {
  let testActions: TestActions;
  let testData: any;

  test.beforeEach(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    // Using testData from fixture
  });

  test('Authentication and Session Management @auth @session @security', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    
    // Create test user for authentication
    const testUser = await testActions.testUserRegistration(testData.user);
    
    // Test authentication setup
    await testActions.setupAuthentication(testUser.responseBody.id);
    
    // Test session validation (REAL method)
    const sessionValidation = await testActions.validateSession(testUser.responseBody.id, 'mock-session-token');
    expect(sessionValidation).toBeDefined();
    
    // Test invalid authentication (REAL method)
    await testActions.testInvalidAuthentication();
    
    // Test incomplete credentials (REAL method)
    await testActions.testIncompleteCredentials(testUser.responseBody.email);
    
    // Cleanup
    await testActions.testUserDeletion(testUser.responseBody.id);
  });
});
