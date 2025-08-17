import { test, expect, APIClient } from './setup';

describe('Transfers API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.digitalbank.com/v3');
  });


  test.describe('createTransfer', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/transfers');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/transfers/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('getTransfer', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/transfers/{transferId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/transfers/{transferId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('cancelTransfer', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.delete('/transfers/{transferId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.delete('/transfers/{transferId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n