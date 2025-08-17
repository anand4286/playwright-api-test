import { test, expect, APIClient } from './setup';

describe('store API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.example.com');
  });


  test.describe('getInventory', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/store/inventory');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/store/inventory/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('placeOrder', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/store/order');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/store/order/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('getOrderById', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/store/order/{orderId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/store/order/{orderId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('deleteOrder', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.delete('/store/order/{orderId}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.delete('/store/order/{orderId}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n