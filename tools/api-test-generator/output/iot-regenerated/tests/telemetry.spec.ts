import { test, expect, APIClient } from './setup';

describe('Telemetry API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.iotplatform.com/v2');
  });


  test.describe('getDeviceTelemetry', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/devices/{deviceId}/telemetry');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/devices/{deviceId}/telemetry/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('sendTelemetry', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/devices/{deviceId}/telemetry');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/devices/{deviceId}/telemetry/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n