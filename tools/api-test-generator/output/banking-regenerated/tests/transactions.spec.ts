import { test, expect, APIClient } from './setup';

describe('Transactions API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.digitalbank.com/v3');
  });


  test.describe('getAccountTransactions', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/accounts/{accountId}/transactions');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/accounts/{accountId}/transactions/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n