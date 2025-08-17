import { test, expect, APIClient } from './setup';

describe('Analytics API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.iotplatform.com/v2');
  });


  test.describe('getDashboard', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/dashboards/{dashboardId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/dashboards/{dashboardId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n