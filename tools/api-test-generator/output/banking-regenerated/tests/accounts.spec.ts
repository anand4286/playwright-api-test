import { test, expect, APIClient } from './setup';

describe('Accounts API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.digitalbank.com/v3');
  });


  test.describe('listAccounts', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/accounts');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/accounts/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('createAccount', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/accounts');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/accounts/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('getAccount', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/accounts/{accountId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/accounts/{accountId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('updateAccount', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.patch('/accounts/{accountId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.patch('/accounts/{accountId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n