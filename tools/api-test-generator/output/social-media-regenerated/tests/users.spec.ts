import { test, expect, APIClient } from './setup';

describe('Users API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.socialmedia.com/v1');
  });


  test.describe('searchUsers', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/users');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/users/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('registerUser', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/users');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/users/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('getUserProfile', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/users/{userId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/users/{userId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('updateUserProfile', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.patch('/users/{userId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.patch('/users/{userId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n