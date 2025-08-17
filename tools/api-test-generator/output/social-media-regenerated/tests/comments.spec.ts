import { test, expect, APIClient } from './setup';

describe('Comments API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.socialmedia.com/v1');
  });


  test.describe('getPostComments', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/posts/{postId}/comments');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/posts/{postId}/comments/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('addComment', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/posts/{postId}/comments');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/posts/{postId}/comments/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('deleteComment', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.delete('/comments/{commentId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.delete('/comments/{commentId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('updateComment', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.patch('/comments/{commentId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.patch('/comments/{commentId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n