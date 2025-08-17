import { test, expect, APIClient } from './setup';

describe('Locations API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.iotplatform.com/v2');
  });


  test.describe('listLocations', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/locations');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/locations/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('createLocation', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/locations');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/locations/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('getLocationDevices', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/locations/{locationId}/devices');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/locations/{locationId}/devices/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n