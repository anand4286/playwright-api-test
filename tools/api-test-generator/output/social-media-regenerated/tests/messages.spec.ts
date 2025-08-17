import { test, expect, APIClient } from './setup';

describe('Messages API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.socialmedia.com/v1');
  });


  test.describe('getConversations', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/messages');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/messages/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('sendMessage', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/messages');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/messages/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('getConversationMessages', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/messages/{conversationId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/messages/{conversationId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n