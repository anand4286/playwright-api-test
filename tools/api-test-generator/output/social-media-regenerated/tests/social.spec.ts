import { test, expect, APIClient } from './setup';

describe('Social API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.socialmedia.com/v1');
  });


  test.describe('followUser', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/users/{userId}/follow');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/users/{userId}/follow/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('unfollowUser', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.delete('/users/{userId}/follow');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.delete('/users/{userId}/follow/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('likePost', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/posts/{postId}/like');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/posts/{postId}/like/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('unlikePost', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.delete('/posts/{postId}/like');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.delete('/posts/{postId}/like/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n