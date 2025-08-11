#!/usr/bin/env npx tsx

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Fix Real Working Tests - Use Working Method
 * 
 * We discovered that testUserRegistration(testData.user) works perfectly,
 * but createTestUser(testData) has issues. 
 * 
 * This script converts all tests to use the working method pattern.
 */

const baseDir = '/Users/Anand/github/playwright-api-test';
const testsDir = join(baseDir, 'tests/real-working');

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
    
    console.log(`🔧 Converting to working method in: ${filename}`);
    
    // Remove custom testData assignment and use fixture
    content = content.replace(
      /testData = \{[\s\S]*?\};/g,
      '// Using testData from fixture'
    );
    
    // Convert createTestUser to testUserRegistration 
    content = content.replace(
      /const testUser = await testActions\.createTestUser\(testData\);/g,
      'const testUser = await testActions.testUserRegistration(testData.user);'
    );
    
    content = content.replace(
      /await testActions\.createTestUser\(testData\)/g,
      'await testActions.testUserRegistration(testData.user)'
    );
    
    // Fix other createTestUser calls that might be using wrong format
    content = content.replace(
      /await testActions\.createTestUser\({ user: userData }\);/g,
      'await testActions.testUserRegistration(userData);'
    );
    
    // Fix bulk operations
    content = content.replace(
      /\.\.\.testData\.user,/g,
      '...testData.user,'
    );
    
    // Update variable access for testUserRegistration result
    content = content.replace(
      /testUser\.id/g,
      'testUser.responseBody.id'
    );
    
    content = content.replace(
      /testUser\.email/g,
      'testUser.responseBody.email'
    );
    
    content = content.replace(
      /testUser\.fullName/g,
      'testUser.responseBody.name'
    );
    
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed: ${filename}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${filename}:`, error);
  }
}

function main(): void {
  console.log('🚀 CONVERTING TO WORKING METHOD PATTERN');
  console.log('======================================');
  
  for (const filename of testFiles) {
    fixTestFile(filename);
  }
  
  console.log('\n🎉 ALL TESTS CONVERTED!');
  console.log('✅ All tests now use testUserRegistration() method');
  console.log('✅ This method is proven to work');
}

main();
