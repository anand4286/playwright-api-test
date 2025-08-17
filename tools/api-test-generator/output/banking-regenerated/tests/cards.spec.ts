import { test, expect, APIClient } from './setup';

describe('Cards API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.digitalbank.com/v3');
  });


  test.describe('getCards', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/cards');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/cards/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('blockCard', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/cards/{cardId}/block');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/cards/{cardId}/block/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n