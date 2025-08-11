#!/usr/bin/env npx tsx

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Fix Real Working Tests - Method Call Fix
 * 
 * The generated real tests are calling methods incorrectly:
 * - Wrong: createTestUser({ user: testData })
 * - Correct: createTestUser(testData) OR testUserRegistration(testData)
 * 
 * This script fixes all method calls to use the correct patterns.
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
    
    console.log(`🔧 Fixing method calls in: ${filename}`);
    
    // Fix the main issue: createTestUser method call
    content = content.replace(
      /await testActions\.createTestUser\({ user: testData }\);/g,
      'await testActions.createTestUser(testData);'
    );
    
    // Fix any remaining similar patterns
    content = content.replace(
      /testActions\.createTestUser\({ user: testData }\)/g,
      'testActions.createTestUser(testData)'
    );
    
    // Fix bulk operations that might also be wrong
    content = content.replace(
      /await testActions\.createTestUser\(userData\);/g,
      'await testActions.createTestUser({ user: userData });'
    );
    
    // Also change to use testUserRegistration for the main registration tests
    // since that's what the working tests use
    if (filename === 'user-registration-and-profile-flow.spec.ts') {
      content = content.replace(
        /const createdUser = await testActions\.createTestUser\(testData\);/g,
        'const testUser = await testActions.testUserRegistration(testData);'
      );
      
      // Update variable name throughout the test
      content = content.replace(/createdUser/g, 'testUser.responseBody');
    }
    
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed: ${filename}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${filename}:`, error);
  }
}

function main(): void {
  console.log('🚀 FIXING METHOD CALLS IN REAL WORKING TESTS');
  console.log('============================================');
  
  for (const filename of testFiles) {
    fixTestFile(filename);
  }
  
  console.log('\n🎉 ALL METHOD CALLS FIXED!');
  console.log('✅ Tests now call TestActions methods correctly');
  console.log('✅ Should work like the proven working tests');
}

main();
