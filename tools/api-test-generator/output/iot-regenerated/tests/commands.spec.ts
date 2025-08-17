import { test, expect, APIClient } from './setup';

describe('Commands API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.iotplatform.com/v2');
  });


  test.describe('getDeviceCommands', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/devices/{deviceId}/commands');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/devices/{deviceId}/commands/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('sendDeviceCommand', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/devices/{deviceId}/commands');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/devices/{deviceId}/commands/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('getCommandStatus', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/commands/{commandId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/commands/{commandId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n