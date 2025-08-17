import { test, expect, APIClient } from './setup';

describe('Payments API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.digitalbank.com/v3');
  });


  test.describe('getBillPayments', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/payments/bills');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/payments/bills/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('scheduleBillPayment', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/payments/bills');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/payments/bills/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n