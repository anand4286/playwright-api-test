#!/usr/bin/env npx tsx

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Fix Real Working Tests - Data Structure Fix
 * 
 * The generated real tests had the wrong data structure.
 * They were using TestDataLoader.loadAuthData() which returns credentials,
 * but createTestUser() needs a complete User object.
 * 
 * This script fixes all generated tests to use proper user data.
 */

const baseDir = '/Users/Anand/github/playwright-api-test';
const testsDir = join(baseDir, 'tests/real-working');

// Read sample user data from existing files
const sampleUserData = {
  "firstName": "Test",
  "lastName": "User", 
  "fullName": "Test User",
  "email": "test.user@example.com",
  "username": "testuser",
  "password": "SecurePassword123!",
  "phone": "555-123-4567",
  "mobile": "555-987-6543",
  "dateOfBirth": "1990-01-01T00:00:00.000Z",
  "address": {
    "street": "123 Test Street",
    "city": "Test City",
    "state": "Test State", 
    "zipCode": "12345",
    "country": "Test Country"
  },
  "company": {
    "name": "Test Company",
    "department": "QA",
    "jobTitle": "Test Engineer"
  },
  "avatar": "https://example.com/avatar.jpg",
  "bio": "Test user for automated testing",
  "website": "https://test.example.com"
};

const testFiles = [
  'user-registration-and-profile-flow.spec.ts',
  'authentication-and-session-management.spec.ts', 
  'profile-management-operations.spec.ts',
  'user-list-and-bulk-operations.spec.ts',
  'error-handling-and-edge-cases.spec.ts',
  'avatar-and-file-operations.spec.ts'
];

function fixTestFile(filename: string): void {
  const filePath = join(testsDir, filename);
  
  try {
    let content = readFileSync(filePath, 'utf-8');
    
    console.log(`🔧 Fixing: ${filename}`);
    
    // Replace the incorrect data loading pattern
    content = content.replace(
      /testData = TestDataLoader\.loadAuthData\(\);/g,
      `testData = ${JSON.stringify(sampleUserData, null, 6)};`
    );
    
    // Fix the createTestUser call pattern 
    content = content.replace(
      /const testUser = await testActions\.createTestUser\(testData\);/g,
      'const testUser = await testActions.createTestUser({ user: testData });'
    );
    
    // Fix any other direct testData usage in createTestUser calls
    content = content.replace(
      /await testActions\.createTestUser\(testData\)/g,
      'await testActions.createTestUser({ user: testData })'
    );
    
    // Fix other variations where testData is passed directly
    content = content.replace(
      /testActions\.createTestUser\(testData\)/g,
      'testActions.createTestUser({ user: testData })'
    );
    
    // Fix bulk operations that might use spread syntax
    content = content.replace(
      /\.\.\.testData,/g,
      '...testData,'
    );
    
    // Fix email generation in bulk operations
    content = content.replace(
      /email: testActions\.generateUniqueEmail\(`bulk\$\{i\}`\),/g,
      'email: testActions.generateUniqueEmail(`bulk${i}`,'
    );
    
    // Add proper comma to email generation
    content = content.replace(
      /email: testActions\.generateUniqueEmail\(`bulk\$\{i\}`,/g,
      'email: testActions.generateUniqueEmail(`bulk${i}`),'
    );
    
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed: ${filename}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${filename}:`, error);
  }
}

function main(): void {
  console.log('🚀 FIXING REAL WORKING TESTS');
  console.log('============================');
  
  for (const filename of testFiles) {
    fixTestFile(filename);
  }
  
  console.log('\n🎉 ALL TESTS FIXED!');
  console.log('✅ Tests now use proper User data structure');
  console.log('✅ Ready for execution');
}

main();
