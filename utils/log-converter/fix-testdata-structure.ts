#!/usr/bin/env npx tsx

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Fix Real Working Tests - TestData Structure Fix
 * 
 * The testData fixture expects a structure with a .user property:
 * { user: {...}, users: [...], authData: {...}, apiEndpoints: {...} }
 * 
 * But our tests are creating testData as the user object directly.
 * This fixes the structure to match the fixture expectations.
 */

const baseDir = '/Users/Anand/github/playwright-api-test';
const testsDir = join(baseDir, 'tests/real-working');

// Create proper testData structure (matches testFixtures.ts)
const properTestDataStructure = `{
      user: {
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
      },
      users: [],
      authData: {
        accessToken: 'test-token',
        refreshToken: 'test-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: 'read write'
      },
      apiEndpoints: {
        users: {
          create: '/api/users',
          read: '/api/users/:id',
          update: '/api/users/:id',
          delete: '/api/users/:id',
          list: '/api/users'
        },
        auth: {
          login: '/api/auth/login',
          logout: '/api/auth/logout',
          register: '/api/auth/register'
        }
      }
    }`;

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
    
    console.log(`🔧 Fixing testData structure in: ${filename}`);
    
    // Find and replace the testData assignment
    const oldPattern = /testData = \{[\s\S]*?"website": "https:\/\/test\.example\.com"\s*\};/;
    content = content.replace(oldPattern, `testData = ${properTestDataStructure};`);
    
    // Also fix the method calls to use the correct patterns
    // For bulk operations, we need to access testData.user
    content = content.replace(
      /\.\.\.testData,/g,
      '...testData.user,'
    );
    
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed: ${filename}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${filename}:`, error);
  }
}

function main(): void {
  console.log('🚀 FIXING TESTDATA STRUCTURE IN REAL WORKING TESTS');
  console.log('=================================================');
  
  for (const filename of testFiles) {
    fixTestFile(filename);
  }
  
  console.log('\n🎉 ALL TESTDATA STRUCTURES FIXED!');
  console.log('✅ Tests now use proper testData structure with .user property');
  console.log('✅ Should match the testFixtures.ts expectations');
}

main();
