import { faker } from '@faker-js/faker';

export interface PetData {
  id?: number;
  category?: CategoryData;
  name: string;
  photoUrls: string[];
  tags?: TagData[];
  status: 'available' | 'pending' | 'sold';
}

export interface CategoryData {
  id: number;
  name: string;
}

export interface TagData {
  id: number;
  name: string;
}

export interface OrderData {
  id?: number;
  petId: number;
  quantity: number;
  shipDate: string;
  status: 'placed' | 'approved' | 'delivered';
  complete: boolean;
}

export interface UserData {
  id?: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  userStatus: number;
}

export interface EnvironmentConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retries: number;
}

export class PetstoreDataFactory {
  private static instance: PetstoreDataFactory;
  private environment: string;
  private testCounter: number = 0;

  constructor(environment: string = 'dev') {
    this.environment = environment;
    // Set seed for reproducible tests in non-prod environments
    if (environment !== 'prod') {
      faker.seed(12345);
    }
  }

  public static getInstance(environment?: string): PetstoreDataFactory {
    if (!PetstoreDataFactory.instance) {
      PetstoreDataFactory.instance = new PetstoreDataFactory(environment);
    }
    return PetstoreDataFactory.instance;
  }

  public createValidPet(overrides: Partial<PetData> = {}): PetData {
    this.testCounter++;
    return {
      id: faker.number.int({ min: 1000, max: 999999 }),
      category: this.createCategory(),
      name: `${faker.animal.dog()}_${this.testCounter}`,
      photoUrls: [
        faker.image.avatar(),
        faker.image.avatar()
      ],
      tags: [this.createTag(), this.createTag()],
      status: 'available',
      ...overrides
    };
  }

  public createPetWithoutRequiredFields(): Partial<PetData> {
    return {
      id: faker.number.int({ min: 1, max: 999999 }),
      category: this.createCategory(),
      tags: [this.createTag()]
      // Missing required fields: name, photoUrls
    };
  }

  public createPetWithInvalidData(): any {
    return {
      id: 'invalid_id', // Should be number
      category: 'invalid_category', // Should be object
      name: '', // Empty name
      photoUrls: 'invalid_urls', // Should be array
      status: 'invalid_status' // Invalid enum value
    };
  }

  public createCategory(overrides: Partial<CategoryData> = {}): CategoryData {
    return {
      id: faker.number.int({ min: 1, max: 100 }),
      name: faker.animal.type(),
      ...overrides
    };
  }

  public createTag(overrides: Partial<TagData> = {}): TagData {
    return {
      id: faker.number.int({ min: 1, max: 100 }),
      name: faker.helpers.arrayElement(['friendly', 'energetic', 'calm', 'playful', 'smart']),
      ...overrides
    };
  }

  public createValidOrder(petId?: number, overrides: Partial<OrderData> = {}): OrderData {
    return {
      id: faker.number.int({ min: 1, max: 999999 }),
      petId: petId || faker.number.int({ min: 1, max: 999999 }),
      quantity: faker.number.int({ min: 1, max: 10 }),
      shipDate: faker.date.future().toISOString(),
      status: 'placed',
      complete: false,
      ...overrides
    };
  }

  public createInvalidOrder(): any {
    return {
      id: 'invalid_id',
      petId: 'invalid_pet_id',
      quantity: -1, // Invalid quantity
      shipDate: 'invalid_date',
      status: 'invalid_status',
      complete: 'not_boolean'
    };
  }

  public createValidUser(overrides: Partial<UserData> = {}): UserData {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const timestamp = Date.now();
    
    return {
      id: faker.number.int({ min: 1, max: 999999 }),
      username: `${firstName.toLowerCase()}_${timestamp}_${this.testCounter}`,
      firstName,
      lastName,
      email: faker.internet.email({ firstName, lastName }),
      password: 'TestPass123!',
      phone: faker.phone.number(),
      userStatus: 1,
      ...overrides
    };
  }

  public createUsersArray(count: number = 3): UserData[] {
    return Array.from({ length: count }, () => this.createValidUser());
  }

  public createInvalidUser(): any {
    return {
      id: 'invalid_id',
      username: '', // Empty username
      firstName: 123, // Should be string
      lastName: null,
      email: 'invalid_email',
      password: '', // Empty password
      phone: 123456, // Should be string
      userStatus: 'invalid' // Should be number
    };
  }

  // Environment-specific configuration
  public getEnvironmentConfig(): EnvironmentConfig {
    const configs: { [key: string]: EnvironmentConfig } = {
      dev: {
        baseUrl: 'https://petstore.swagger.io/v2',
        apiKey: 'special-key',
        timeout: 10000,
        retries: 2
      },
      staging: {
        baseUrl: 'https://petstore.swagger.io/v2',
        apiKey: 'special-key',
        timeout: 15000,
        retries: 2
      },
      qa: {
        baseUrl: 'https://petstore.swagger.io/v2',
        apiKey: 'special-key',
        timeout: 20000,
        retries: 3
      },
      prod: {
        baseUrl: 'https://petstore.swagger.io/v2',
        apiKey: 'special-key',
        timeout: 30000,
        retries: 1
      }
    };

    return configs[this.environment] || configs.dev;
  }

  // Boundary test data
  public createBoundaryTestData() {
    return {
      maxInteger: 2147483647,
      minInteger: -2147483648,
      maxLongId: 9223372036854775807,
      minLongId: -9223372036854775808,
      emptyString: '',
      maxString: 'a'.repeat(1000),
      specialCharacters: '!@#$%^&*()[]{}|;:,.<>?',
      unicodeString: '测试数据🐕🐱'
    };
  }

  // Get test data for specific requirement
  public getTestDataForRequirement(requirementId: string): any {
    const testDataMap: { [key: string]: any } = {
      'REQ-PET-001': {
        valid: this.createValidPet(),
        invalid: this.createPetWithInvalidData(),
        missingFields: this.createPetWithoutRequiredFields()
      },
      'REQ-PET-002': {
        valid: this.createValidPet(),
        invalid: this.createPetWithInvalidData()
      },
      'REQ-STO-001': {
        valid: this.createValidOrder(),
        invalid: this.createInvalidOrder()
      },
      'REQ-USE-001': {
        valid: this.createValidUser(),
        invalid: this.createInvalidUser(),
        array: this.createUsersArray()
      }
    };

    return testDataMap[requirementId] || {
      valid: this.createValidPet(),
      invalid: this.createPetWithInvalidData()
    };
  }

  public resetCounter(): void {
    this.testCounter = 0;
  }
}
