import { test, expect, APIClient } from './setup';

describe('Notifications API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.socialmedia.com/v1');
  });


  test.describe('getNotifications', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/notifications');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/notifications/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('markNotificationRead', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.patch('/notifications/{notificationId}/read');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.patch('/notifications/{notificationId}/read/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n