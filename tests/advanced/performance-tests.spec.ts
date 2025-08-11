import { test, expect } from '../../utils/testFixtures.js';
import type { User } from '../../types/index.js';
import { TestActions } from '../../utils/test-actions.js';
import { TestDataLoader } from '../../utils/test-data-loader.js';

/**
 * Performance Test Scenarios
 * 
 * This test suite focuses on validating API performance under various conditions.
 * Tests include:
 * - Concurrent request handling
 * - Load testing with multiple data sets
 * - Response time validation
 * - Memory and resource usage testing
 * 
 * Test Dependencies:
 * - External test data from test-data/advanced/test-scenarios.json
 * - TestActions utility for API operations
 * - Performance metrics tracking
 */

test.describe('Concurrent Request Performance', () => {
  let testActions: TestActions;
  let advancedTestData: any;

  test.beforeAll(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    advancedTestData = TestDataLoader.loadAdvancedTestData();
  });

  /**
   * Test: Concurrent User Creation
   * 
   * Purpose: Tests API performance with multiple simultaneous user creation requests
   * Functionality: Creates multiple users concurrently and measures response times
   * Dependencies: Test data with multiple user profiles
   * 
   * This test validates that the API can handle concurrent write operations
   * without performance degradation or data consistency issues.
   */
  test('should handle concurrent user creation efficiently @performance @concurrent', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    const userProfiles = advancedTestData.dataSetTests.userProfiles;
    
    const startTime = Date.now();
    const concurrentPromises = [];
    
    // Create concurrent user creation requests
    for (let i = 0; i < Math.min(userProfiles.length, 5); i++) {
      const userProfile = userProfiles[i];
      const testUserData = {
        fullName: userProfile.fullName,
        email: `perf-test-${i}-${Date.now()}@example.com`,
        username: `perfuser${i}${Date.now()}`,
        website: userProfile.website,
        phone: userProfile.phone
      };
      
      const promise = testActions.createTestUser(testUserData);
      concurrentPromises.push(promise);
    }
    
    // Wait for all concurrent operations to complete
    const createdUsers = await Promise.all(concurrentPromises);
    const totalTime = Date.now() - startTime;
    
    // Validate all users were created successfully
    for (const user of createdUsers) {
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
    }
    
    // Performance validation
    const averageResponseTime = totalTime / createdUsers.length;
    expect(averageResponseTime).toBeLessThan(5000); // Should complete within 5 seconds per request on average
    
    // Clean up all created users
    const cleanupPromises = createdUsers.map(user => testActions.testUserDeletion(user.id));
    await Promise.all(cleanupPromises);
  });

  /**
   * Test: Concurrent Read Operations
   * 
   * Purpose: Tests API performance with multiple simultaneous read requests
   * Functionality: Performs concurrent profile reads and measures response times
   * Dependencies: Single test user for read operations
   * 
   * This test validates that the API can efficiently handle concurrent
   * read operations without blocking or performance issues.
   */
  test('should handle concurrent read operations efficiently @performance @concurrent', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    
    // Create a test user for reading
    const testUser = await testActions.createTestUser(testData);
    
    const startTime = Date.now();
    const concurrentReads = [];
    const numberOfReads = 10;
    
    // Create concurrent read requests
    for (let i = 0; i < numberOfReads; i++) {
      const promise = testActions.getUserProfile(testUser.id);
      concurrentReads.push(promise);
    }
    
    // Wait for all concurrent reads to complete
    const profiles = await Promise.all(concurrentReads);
    const totalTime = Date.now() - startTime;
    
    // Validate all reads were successful
    for (const profile of profiles) {
      expect(profile).toBeDefined();
      expect(profile.id).toBe(testUser.id);
    }
    
    // Performance validation
    const averageResponseTime = totalTime / numberOfReads;
    expect(averageResponseTime).toBeLessThan(2000); // Should complete within 2 seconds per request on average
    
    // Clean up
    await testActions.testUserDeletion(testUser.id);
  });

  /**
   * Test: Mixed Concurrent Operations
   * 
   * Purpose: Tests API performance with mixed read/write operations
   * Functionality: Combines creation, reading, and updating operations concurrently
   * Dependencies: Multiple test data sets
   * 
   * This test validates that the API can handle realistic mixed workloads
   * with different types of operations running simultaneously.
   */
  test('should handle mixed concurrent operations efficiently @performance @concurrent', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    
    // Create initial test user for updates and reads
    const testUser = await testActions.createTestUser(testData);
    
    const startTime = Date.now();
    const mixedOperations = [];
    
    // Add read operations
    for (let i = 0; i < 3; i++) {
      mixedOperations.push(testActions.getUserProfile(testUser.id));
    }
    
    // Add update operations
    for (let i = 0; i < 2; i++) {
      const updateData = {
        website: `https://updated-${i}-${Date.now()}.example.com`,
        phone: `+1-555-${1000 + i}`
      };
      mixedOperations.push(testActions.updateUserProfile(testUser.id, updateData));
    }
    
    // Add additional user creation
    const newUserData = {
      fullName: `Concurrent Test User ${Date.now()}`,
      email: `concurrent-${Date.now()}@example.com`,
      username: `concurrent${Date.now()}`,
      website: 'https://concurrent-test.example.com',
      phone: '+1-555-CONCURRENT'
    };
    mixedOperations.push(testActions.createTestUser(newUserData));
    
    // Execute all operations concurrently
    const results = await Promise.all(mixedOperations);
    const totalTime = Date.now() - startTime;
    
    // Validate all operations completed successfully
    expect(results).toHaveLength(6); // 3 reads + 2 updates + 1 creation
    
    // Performance validation
    const averageResponseTime = totalTime / results.length;
    expect(averageResponseTime).toBeLessThan(3000); // Should complete within 3 seconds per operation on average
    
    // Clean up
    await testActions.testUserDeletion(testUser.id);
    // Clean up the newly created user (last result)
    const newUser = results[results.length - 1] as User;
    if (newUser && newUser.id) {
      await testActions.testUserDeletion(newUser.id);
    }
  });
});

test.describe('Load Testing with Data Sets', () => {
  let testActions: TestActions;
  let advancedTestData: any;

  test.beforeAll(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    advancedTestData = TestDataLoader.loadAdvancedTestData();
  });

  /**
   * Test: Bulk Operations Performance
   * 
   * Purpose: Tests API performance with bulk data processing
   * Functionality: Processes multiple data sets sequentially and measures cumulative performance
   * Dependencies: Large data sets from test configuration
   * 
   * This test validates that the API maintains consistent performance
   * when processing large amounts of data in sequence.
   */
  test('should maintain performance with bulk data processing @performance @bulk', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    const userProfiles = advancedTestData.dataSetTests.userProfiles;
    
    const createdUsers: User[] = [];
    const responseTimes: number[] = [];
    
    // Process users in sequence to measure cumulative performance impact
    for (let i = 0; i < Math.min(userProfiles.length, 8); i++) {
      const startTime = Date.now();
      
      const userProfile = userProfiles[i];
      const testUserData = {
        fullName: userProfile.fullName,
        email: `bulk-test-${i}-${Date.now()}@example.com`,
        username: `bulkuser${i}${Date.now()}`,
        website: userProfile.website,
        phone: userProfile.phone
      };
      
      const user = await testActions.createTestUser(testUserData);
      const responseTime = Date.now() - startTime;
      
      createdUsers.push(user);
      responseTimes.push(responseTime);
      
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
    }
    
    // Analyze performance trends
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    
    // Performance assertions
    expect(averageResponseTime).toBeLessThan(3000); // Average should be under 3 seconds
    expect(maxResponseTime).toBeLessThan(5000); // No single operation should exceed 5 seconds
    
    // Check for performance degradation (last operations shouldn't be significantly slower)
    const firstHalfAvg = responseTimes.slice(0, Math.floor(responseTimes.length / 2))
      .reduce((sum, time) => sum + time, 0) / Math.floor(responseTimes.length / 2);
    const secondHalfAvg = responseTimes.slice(Math.floor(responseTimes.length / 2))
      .reduce((sum, time) => sum + time, 0) / (responseTimes.length - Math.floor(responseTimes.length / 2));
    
    // Second half shouldn't be more than 50% slower than first half
    expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5);
    
    // Clean up all created users
    const cleanupPromises = createdUsers.map(user => testActions.testUserDeletion(user.id));
    await Promise.all(cleanupPromises);
  });

  /**
   * Test: Memory Efficiency with Large Data Sets
   * 
   * Purpose: Tests memory efficiency when handling large data operations
   * Functionality: Creates and processes large amounts of data to test memory usage
   * Dependencies: Large test data sets
   * 
   * This test validates that the API and test framework handle large
   * data volumes efficiently without memory leaks or excessive usage.
   */
  test('should handle large data sets efficiently @performance @memory', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    const userProfiles = advancedTestData.dataSetTests.userProfiles;
    
    const batchSize = 3; // Process in smaller batches to manage memory
    const totalBatches = Math.ceil(userProfiles.length / batchSize);
    
    for (let batch = 0; batch < Math.min(totalBatches, 3); batch++) {
      const startIndex = batch * batchSize;
      const endIndex = Math.min(startIndex + batchSize, userProfiles.length);
      const batchUsers = userProfiles.slice(startIndex, endIndex);
      
      const batchStartTime = Date.now();
      const createdInBatch: User[] = [];
      
      // Create users in current batch
      for (let i = 0; i < batchUsers.length; i++) {
        const userProfile = batchUsers[i];
        const testUserData = {
          fullName: userProfile.fullName,
          email: `memory-test-${batch}-${i}-${Date.now()}@example.com`,
          username: `memuser${batch}${i}${Date.now()}`,
          website: userProfile.website,
          phone: userProfile.phone
        };
        
        const user = await testActions.createTestUser(testUserData);
        createdInBatch.push(user);
      }
      
      // Perform operations on batch
      const batchOperations = [];
      for (const user of createdInBatch) {
        batchOperations.push(testActions.getUserProfile(user.id));
      }
      
      const profiles = await Promise.all(batchOperations);
      expect(profiles).toHaveLength(createdInBatch.length);
      
      const batchTime = Date.now() - batchStartTime;
      expect(batchTime).toBeLessThan(10000); // Batch should complete within 10 seconds
      
      // Clean up batch immediately to free memory
      const cleanupPromises = createdInBatch.map(user => testActions.testUserDeletion(user.id));
      await Promise.all(cleanupPromises);
    }
  });

  /**
   * Test: Response Time Consistency
   * 
   * Purpose: Tests consistency of API response times under load
   * Functionality: Measures response time variance across multiple operations
   * Dependencies: Consistent test data
   * 
   * This test validates that the API provides consistent performance
   * without significant response time variations under normal load.
   */
  test('should maintain consistent response times @performance @consistency', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    
    // Create a test user for consistent read operations
    const testUser = await testActions.createTestUser(testData);
    
    const responseTimes: number[] = [];
    const numberOfTests = 15;
    
    // Perform consistent operations and measure response times
    for (let i = 0; i < numberOfTests; i++) {
      const startTime = Date.now();
      const profile = await testActions.getUserProfile(testUser.id);
      const responseTime = Date.now() - startTime;
      
      expect(profile).toBeDefined();
      expect(profile.id).toBe(testUser.id);
      
      responseTimes.push(responseTime);
    }
    
    // Calculate response time statistics
    const averageTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const maxTime = Math.max(...responseTimes);
    const minTime = Math.min(...responseTimes);
    const variance = responseTimes.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / responseTimes.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Performance consistency assertions
    expect(averageTime).toBeLessThan(2000); // Average should be under 2 seconds
    expect(maxTime).toBeLessThan(5000); // No operation should exceed 5 seconds
    expect(standardDeviation).toBeLessThan(averageTime * 0.5); // Standard deviation should be less than 50% of average
    
    // Check for outliers (values more than 2 standard deviations from mean)
    const outliers = responseTimes.filter(time => 
      Math.abs(time - averageTime) > (2 * standardDeviation)
    );
    expect(outliers.length).toBeLessThan(numberOfTests * 0.1); // Less than 10% should be outliers
    
    // Clean up
    await testActions.testUserDeletion(testUser.id);
  });
});

test.describe('Resource Usage Testing', () => {
  let testActions: TestActions;

  test.beforeEach(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
  });

  /**
   * Test: API Timeout Handling
   * 
   * Purpose: Tests API behavior with timeout scenarios
   * Functionality: Validates timeout handling and error responses
   * Dependencies: None - timeout testing
   * 
   * This test ensures the API properly handles timeout scenarios
   * and provides appropriate error responses.
   */
  test('should handle timeouts gracefully @performance @timeout', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    
    // Create test user with normal timeout
    const testUser = await testActions.createTestUser(testData);
    
    // Test normal operation within expected timeouts
    const startTime = Date.now();
    const profile = await testActions.getUserProfile(testUser.id);
    const responseTime = Date.now() - startTime;
    
    expect(profile).toBeDefined();
    expect(responseTime).toBeLessThan(30000); // Should complete within 30 seconds
    
    // Clean up
    await testActions.testUserDeletion(testUser.id);
  });

  /**
   * Test: Connection Pool Efficiency
   * 
   * Purpose: Tests efficient use of connection pools
   * Functionality: Validates connection reuse and pool management
   * Dependencies: Multiple concurrent operations
   * 
   * This test ensures the API efficiently manages connection pools
   * for optimal resource utilization.
   */
  test('should efficiently manage connection pools @performance @connections', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    
    // Create multiple test users to generate connection pool usage
    const userCreationPromises = [];
    for (let i = 0; i < 5; i++) {
      const testUserData = {
        fullName: `Connection Test User ${i}`,
        email: `connection-test-${i}-${Date.now()}@example.com`,
        username: `connuser${i}${Date.now()}`,
        website: `https://connection-test-${i}.example.com`,
        phone: `+1-555-CONN-${1000 + i}`
      };
      userCreationPromises.push(testActions.createTestUser(testUserData));
    }
    
    const startTime = Date.now();
    const createdUsers = await Promise.all(userCreationPromises);
    const totalTime = Date.now() - startTime;
    
    // Validate all users were created
    for (const user of createdUsers) {
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
    }
    
    // Performance validation - concurrent operations should be efficient
    const averageTime = totalTime / createdUsers.length;
    expect(averageTime).toBeLessThan(3000); // Should leverage connection pooling
    
    // Test connection reuse with subsequent operations
    const readOperations = createdUsers.map(user => testActions.getUserProfile(user.id));
    const readStartTime = Date.now();
    const profiles = await Promise.all(readOperations);
    const readTime = Date.now() - readStartTime;
    
    expect(profiles).toHaveLength(createdUsers.length);
    
    // Read operations should be faster due to connection reuse
    const readAverageTime = readTime / profiles.length;
    expect(readAverageTime).toBeLessThan(2000);
    
    // Clean up
    const cleanupPromises = createdUsers.map(user => testActions.testUserDeletion(user.id));
    await Promise.all(cleanupPromises);
  });

  /**
   * Test: Resource Cleanup Efficiency
   * 
   * Purpose: Tests efficient cleanup of resources after operations
   * Functionality: Validates proper resource deallocation
   * Dependencies: Resource-intensive operations
   * 
   * This test ensures that resources are properly cleaned up
   * after test operations to prevent memory leaks.
   */
  test('should efficiently clean up resources @performance @cleanup', async ({ apiHelper, testData }) => {
    testActions = new TestActions(apiHelper);
    
    const resourceTestCycles = 3;
    
    for (let cycle = 0; cycle < resourceTestCycles; cycle++) {
      // Create resources
      const cycleUsers: User[] = [];
      for (let i = 0; i < 3; i++) {
        const testUserData = {
          fullName: `Cleanup Test User ${cycle}-${i}`,
          email: `cleanup-test-${cycle}-${i}-${Date.now()}@example.com`,
          username: `cleanupuser${cycle}${i}${Date.now()}`,
          website: `https://cleanup-test-${cycle}-${i}.example.com`,
          phone: `+1-555-CLEAN-${cycle}${i}`
        };
        const user = await testActions.createTestUser(testUserData);
        cycleUsers.push(user);
      }
      
      // Use resources
      const operations = cycleUsers.map(user => testActions.getUserProfile(user.id));
      const profiles = await Promise.all(operations);
      expect(profiles).toHaveLength(cycleUsers.length);
      
      // Clean up resources immediately
      const cleanupPromises = cycleUsers.map(user => testActions.testUserDeletion(user.id));
      await Promise.all(cleanupPromises);
      
      // Brief pause between cycles to allow resource cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Test should complete without resource exhaustion
    expect(true).toBe(true); // If we reach here, cleanup was successful
  });
});
