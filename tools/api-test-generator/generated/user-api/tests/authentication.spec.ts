import { test, expect, APIClient } from './setup';

describe('Authentication API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.example.com/v1');
  });


  test.describe('POST /auth/login', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/auth/login');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/auth/login/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n