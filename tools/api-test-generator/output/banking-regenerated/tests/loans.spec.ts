import { test, expect, APIClient } from './setup';

describe('Loans API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, 'https://api.digitalbank.com/v3');
  });


  test.describe('getLoans', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.get('/loans');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.get('/loans/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('makeLoanPayment', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.post('/loans/{loanId}/payments');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.post('/loans/{loanId}/payments/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});\n