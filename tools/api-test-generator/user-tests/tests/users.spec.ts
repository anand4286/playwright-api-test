import { test, expect, APIClient } from './setup';

describe('Users API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.example.com/v1');
  });


  test.describe('GET /users', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/users');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/users/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('POST /users', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/users');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/users/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('GET /users/{userId}', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/users/{userId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/users/{userId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('PUT /users/{userId}', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.put('/users/{userId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.put('/users/{userId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('DELETE /users/{userId}', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.delete('/users/{userId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.delete('/users/{userId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n