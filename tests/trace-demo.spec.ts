import { test, expect } from '@playwright/test';
import { TestDataLoader } from '../utils/test-data-loader';
import { API_ENDPOINTS } from '../config/endpoints.js';

test.describe('Trace Demo', () => {
  test('simple API test for trace demonstration @smoke', async ({ request }) => {
    const apiConfig = TestDataLoader.loadApiConfig();
    
    // Make a simple API request to demonstrate tracing
    const response = await request.get(`${apiConfig.apiEndpoints.baseUrl}${API_ENDPOINTS.USER_BY_ID(1)}`);
    
    // Verify the response
    expect(response.status()).toBe(apiConfig.expectedStatusCodes.success.get);
    
    const userData = await response.json();
    // Verify response structure
    apiConfig.responseStructure.user.forEach((field: string) => {
      expect(userData).toHaveProperty(field);
    });
    
    console.log('User data received:', userData.name);
  });
  
  test('API test with multiple requests for trace analysis @regression', async ({ request }) => {
    const apiConfig = TestDataLoader.loadApiConfig();
    const demoData = TestDataLoader.loadDemoData();
    
    // Multiple requests to show trace capabilities
    const usersResponse = await request.get(`${apiConfig.apiEndpoints.baseUrl}${apiConfig.apiEndpoints.users}`);
    expect(usersResponse.status()).toBe(apiConfig.expectedStatusCodes.success.get);
    
    const users = await usersResponse.json();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
    
    // Get first user details
    const userResponse = await request.get(`${apiConfig.apiEndpoints.baseUrl}${API_ENDPOINTS.USER_BY_ID(users[0].id)}`);
    expect(userResponse.status()).toBe(apiConfig.expectedStatusCodes.success.get);
    
    // Create a post using data from external file
    const postData = demoData.scenarios.traceDemo.postData;
    const newPost = {
      ...postData,
      userId: users[0].id
    };
    
    const postResponse = await request.post(`${apiConfig.apiEndpoints.baseUrl}${apiConfig.apiEndpoints.posts}`, {
      data: newPost
    });
    expect(postResponse.status()).toBe(apiConfig.expectedStatusCodes.success.post);
    
    const createdPost = await postResponse.json();
    expect(createdPost).toHaveProperty('id');
    expect(createdPost.title).toBe(newPost.title);
    
    console.log('Created post with ID:', createdPost.id);
  });
});
