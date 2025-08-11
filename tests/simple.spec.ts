import { test, expect } from '@playwright/test';

test.describe('Simple API Test', () => {
  test('should make a basic API call', async ({ request }) => {
    const response = await request.get('https://jsonplaceholder.typicode.com/posts/1');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('id', 1);
    expect(data).toHaveProperty('userId');
    expect(data).toHaveProperty('title');
  });
});
