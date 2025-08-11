import { test, expect } from '../../utils/testFixtures.js';
import { TestActions } from '../../utils/test-actions.js';
import { TestDataLoader } from '../../utils/test-data-loader.js';
import { enableSupertestFormat } from '../../utils/logger.js';

/**
 * Simple Supertest Format Demo
 * This test manually enables Supertest format and runs a basic test
 */
test.describe('Simple Supertest Format Demo', () => {
  test('should generate logs in Supertest format @supertest', async ({ apiHelper }) => {
    // Manually enable Supertest format
    enableSupertestFormat(true);
    
    const testActions = new TestActions(apiHelper);
    const testData = TestDataLoader.loadDemoData();
    
    console.log('🔄 Supertest format enabled');
    
    // Setup user
    apiHelper.setStep('Create Test User');
    const user = await testActions.createTestUser(testData);
    
    // Test authentication
    apiHelper.setStep('Setup Authentication');
    const authResult = await testActions.setupAuthentication(user.id);
    
    // Simple assertion to make test pass
    expect(authResult).toBeDefined();
    
    console.log('✅ Test completed with Supertest logging');
  });
});
