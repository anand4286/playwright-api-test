import { test, expect, APIClient } from './setup';

describe('Alerts API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.iotplatform.com/v2');
  });


  test.describe('getAlerts', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/alerts');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/alerts/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('acknowledgeAlert', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/alerts/{alertId}/acknowledge');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/alerts/{alertId}/acknowledge/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n