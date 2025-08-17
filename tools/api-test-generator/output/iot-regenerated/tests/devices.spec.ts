import { test, expect, APIClient } from './setup';

describe('Devices API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.iotplatform.com/v2');
  });


  test.describe('listDevices', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/devices');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/devices/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('registerDevice', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/devices');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/devices/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('getDevice', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/devices/{deviceId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/devices/{deviceId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('deregisterDevice', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.delete('/devices/{deviceId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.delete('/devices/{deviceId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('updateDevice', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.patch('/devices/{deviceId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.patch('/devices/{deviceId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n