import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { 
  User, 
  AuthData, 
  ApiEndpoints, 
  TestScenario, 
  GeneratedTestData 
} from '../types/index.js';

class DataGenerator {
  private seed: number;

  constructor() {
    this.seed = process.env.DATA_SEED ? parseInt(process.env.DATA_SEED) : Date.now();
    faker.seed(this.seed);
  }

  // Generate user data
  generateUser(): User {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    
    return {
      id: uuidv4(),
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      username: faker.internet.userName({ firstName, lastName }).toLowerCase(),
      password: faker.internet.password({ length: 12, memorable: true }),
      phone: faker.phone.number(),
      mobile: faker.phone.number(),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country()
      },
      company: {
        name: faker.company.name(),
        department: faker.commerce.department(),
        jobTitle: faker.person.jobTitle()
      },
      avatar: faker.image.avatar(),
      bio: faker.lorem.paragraph(),
      website: faker.internet.url(),
      createdAt: faker.date.recent(),
      updatedAt: new Date()
    };
  }

  // Generate authentication data
  generateAuthData(): AuthData {
    return {
      accessToken: faker.string.alphanumeric(64),
      refreshToken: faker.string.alphanumeric(32),
      tokenType: 'Bearer',
      expiresIn: 3600,
      scope: 'read write',
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000)
    };
  }

  // Generate API endpoints data
  generateApiEndpoints(): ApiEndpoints {
    return {
      auth: {
        register: '/api/v1/auth/register',
        login: '/api/v1/auth/login',
        logout: '/api/v1/auth/logout',
        refresh: '/api/v1/auth/refresh',
        forgotPassword: '/api/v1/auth/forgot-password',
        resetPassword: '/api/v1/auth/reset-password'
      },
      users: {
        profile: '/api/v1/users/profile',
        updateProfile: '/api/v1/users/profile',
        changePassword: '/api/v1/users/change-password',
        uploadAvatar: '/api/v1/users/avatar',
        deleteAccount: '/api/v1/users/account'
      },
      profile: {
        get: '/api/v1/profile',
        update: '/api/v1/profile',
        updateEmail: '/api/v1/profile/email',
        updatePhone: '/api/v1/profile/phone',
        updateAddress: '/api/v1/profile/address',
        preferences: '/api/v1/profile/preferences'
      }
    };
  }

  // Generate test scenarios data
  generateTestScenarios(): TestScenario[] {
    return [
      {
        id: uuidv4(),
        name: 'Complete User Registration Flow',
        description: 'End-to-end user registration with email verification',
        steps: [
          'Register new user',
          'Verify email address',
          'Complete profile setup',
          'Login with new credentials'
        ],
        expectedOutcome: 'User successfully registered and logged in',
        priority: 'High',
        tags: ['registration', 'smoke', 'critical-path']
      },
      {
        id: uuidv4(),
        name: 'User Profile Management',
        description: 'Update user profile information including email and phone',
        steps: [
          'Login with existing user',
          'Update email address',
          'Update phone number',
          'Update profile information',
          'Verify changes persisted'
        ],
        expectedOutcome: 'Profile information successfully updated',
        priority: 'High',
        tags: ['profile', 'regression', 'user-management']
      }
    ];
  }

  // Generate multiple users for testing
  generateBulkUsers(count: number = 10): User[] {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      users.push(this.generateUser());
    }
    return users;
  }

  // Save generated data to files
  saveDataToFile(data: any, filename: string): void {
    const dataDir = path.join(process.cwd(), 'test-data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Test data saved to: ${filePath}`);
  }

  // Generate all test data
  generateAllTestData(): GeneratedTestData {
    const testData: GeneratedTestData = {
      users: this.generateBulkUsers(50),
      apiEndpoints: this.generateApiEndpoints(),
      testScenarios: this.generateTestScenarios(),
      authData: this.generateAuthData(),
      generatedAt: new Date().toISOString(),
      seed: this.seed
    };

    this.saveDataToFile(testData, 'generated-test-data.json');
    this.saveDataToFile(testData.users, 'users.json');
    this.saveDataToFile(testData.apiEndpoints, 'api-endpoints.json');
    this.saveDataToFile(testData.testScenarios, 'test-scenarios.json');

    return testData;
  }
}

export default DataGenerator;

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new DataGenerator();
  generator.generateAllTestData();
  console.log('Test data generation completed!');
}
