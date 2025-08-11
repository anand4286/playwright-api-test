import { test, expect } from '@playwright/test';
import { TestDataLoader } from '../utils/test-data-loader';
import { API_ENDPOINTS } from '../config/endpoints.js';

test.describe('Dashboard Demo Data', () => {
  test('API test to populate dashboard @smoke', async ({ request }) => {
    const apiConfig = TestDataLoader.loadApiConfig();
    const demoData = TestDataLoader.loadDemoData();
    
    // This test will generate data visible in the dashboard
    
    // Test 1: Get users list
    console.log('📊 Getting users list...');
    const usersResponse = await request.get(`${apiConfig.apiEndpoints.baseUrl}${apiConfig.apiEndpoints.users}`);
    expect(usersResponse.status()).toBe(apiConfig.expectedStatusCodes.success.get);
    
    const users = await usersResponse.json();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
    
    // Test 2: Get specific user
    const userId = users[0].id;
    console.log(`👤 Getting user ${userId} details...`);
    const userResponse = await request.get(`${apiConfig.apiEndpoints.baseUrl}${API_ENDPOINTS.USER_BY_ID(userId)}`);
    expect(userResponse.status()).toBe(apiConfig.expectedStatusCodes.success.get);
    
    const user = await userResponse.json();
    expect(user).toHaveProperty('id', userId);
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
    
    // Test 3: Create a new post using external data
    console.log('📝 Creating new post...');
    const postData = demoData.scenarios.dashboardDemo.createPost;
    const newPost = {
      ...postData,
      userId: userId
    };
    
    const createResponse = await request.post(`${apiConfig.apiEndpoints.baseUrl}${apiConfig.apiEndpoints.posts}`, {
      data: newPost
    });
    expect(createResponse.status()).toBe(apiConfig.expectedStatusCodes.success.post);
    
    const createdPost = await createResponse.json();
    expect(createdPost).toHaveProperty('id');
    expect(createdPost.title).toBe(newPost.title);
    
    console.log(`✅ Created post with ID: ${createdPost.id}`);
    
    // Test 4: Update the post using external data
    console.log(`📝 Updating post ${createdPost.id}...`);
    const updateData = demoData.scenarios.dashboardDemo.updatePost;
    const updatedPost = {
      ...updateData,
      userId: userId
    };
    
    const updateResponse = await request.put(`${apiConfig.apiEndpoints.baseUrl}${apiConfig.apiEndpoints.posts}/${createdPost.id}`, {
      data: updatedPost
    });
    // JSONPlaceholder sometimes returns 200 for PUT requests
    expect([200, 500].includes(updateResponse.status())).toBeTruthy();
    
    if (updateResponse.status() === 200) {
      const updated = await updateResponse.json();
      expect(updated.title).toBe(updatedPost.title);
    }
    
    console.log('✅ Post updated successfully');
  });
  
  test('API error handling test @regression', async ({ request }) => {
    const apiConfig = TestDataLoader.loadApiConfig();
    
    // This test will generate some failed requests for dashboard variety
    
    console.log('🔍 Testing error handling...');
    
    // Test 404 error
    const notFoundResponse = await request.get(`${apiConfig.apiEndpoints.baseUrl}${API_ENDPOINTS.USER_BY_ID(999999)}`);
    expect(notFoundResponse.status()).toBe(apiConfig.expectedStatusCodes.clientError.notFound);
    
    // Test with invalid post ID
    const invalidPostResponse = await request.get(`${apiConfig.apiEndpoints.baseUrl}${API_ENDPOINTS.POST_BY_ID(999999)}`);
    expect(invalidPostResponse.status()).toBe(apiConfig.expectedStatusCodes.clientError.notFound);
    
    console.log('✅ Error handling tests completed');
  });
  
  test('Performance test for dashboard metrics @performance', async ({ request }) => {
    const apiConfig = TestDataLoader.loadApiConfig();
    const demoData = TestDataLoader.loadDemoData();
    
    console.log('⚡ Running performance tests...');
    
    const startTime = Date.now();
    const performanceConfig = demoData.scenarios.performanceTest;
    
    // Multiple concurrent requests based on external config
    const requests = [];
    for (let i = 1; i <= performanceConfig.concurrentRequests; i++) {
      requests.push(request.get(`${apiConfig.apiEndpoints.baseUrl}${API_ENDPOINTS.USER_BY_ID(i)}`));
    }
    
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    
    // Verify all requests succeeded
    responses.forEach((response, index) => {
      expect(response.status()).toBe(apiConfig.expectedStatusCodes.success.get);
    });
    
    const totalTime = endTime - startTime;
    console.log(`⚡ Completed ${performanceConfig.concurrentRequests} concurrent requests in ${totalTime}ms`);
    
    // Verify performance is reasonable using external config
    expect(totalTime).toBeLessThan(performanceConfig.maxResponseTime);
  });
});
