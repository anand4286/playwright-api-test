import { test, expect, APIClient } from './setup';

describe('Posts API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.socialmedia.com/v1');
  });


  test.describe('getFeed', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/posts');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/posts/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('createPost', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/posts');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/posts/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('getPost', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/posts/{postId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/posts/{postId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('deletePost', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.delete('/posts/{postId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.delete('/posts/{postId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('updatePost', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.patch('/posts/{postId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.patch('/posts/{postId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n