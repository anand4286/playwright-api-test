import { test, expect } from '@playwright/test';

// Test setup and configuration
const API_BASE_URL = 'https://petstore.swagger.io/v2';
const API_KEY = 'special-key'; // Demo API key

/**
 * API Client for Petstore operations
 */
class PetStoreAPI {
  constructor(private request: any) {}

  async getPetsByStatus(status: 'available' | 'pending' | 'sold') {
    return this.request.get(`${API_BASE_URL}/pet/findByStatus?status=${status}`, {
      headers: { 'Accept': 'application/json' }
    });
  }

  async getPetById(petId: number) {
    return this.request.get(`${API_BASE_URL}/pet/${petId}`, {
      headers: { 'Accept': 'application/json' }
    });
  }

  async createPet(petData: any) {
    return this.request.post(`${API_BASE_URL}/pet`, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: petData
    });
  }

  async updatePet(petData: any) {
    return this.request.put(`${API_BASE_URL}/pet`, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: petData
    });
  }

  async deletePet(petId: number) {
    return this.request.delete(`${API_BASE_URL}/pet/${petId}`, {
      headers: { 
        'api_key': API_KEY
      }
    });
  }
}

// Test data fixtures
const testPetData = {
  id: Math.floor(Math.random() * 1000000),
  name: 'TestPet-' + Date.now(),
  category: {
    id: 1,
    name: 'TestCategory'
  },
  photoUrls: ['https://example.com/pet-photo.jpg'],
  tags: [
    {
      id: 1,
      name: 'TestTag'
    }
  ],
  status: 'available'
};

test.describe('Pet Store API - Pet Operations', () => {
  let api: PetStoreAPI;

  test.beforeEach(async ({ request }) => {
    api = new PetStoreAPI(request);
  });

  test('should get available pets successfully', async () => {
    const response = await api.getPetsByStatus('available');
    
    expect(response.status()).toBe(200);
    
    const pets = await response.json();
    expect(Array.isArray(pets)).toBeTruthy();
    
    if (pets.length > 0) {
      expect(pets[0]).toHaveProperty('id');
      expect(pets[0]).toHaveProperty('name');
      expect(pets[0]).toHaveProperty('status', 'available');
    }
  });

  test('should get pending pets successfully', async () => {
    const response = await api.getPetsByStatus('pending');
    
    expect(response.status()).toBe(200);
    
    const pets = await response.json();
    expect(Array.isArray(pets)).toBeTruthy();
  });

  test('should get sold pets successfully', async () => {
    const response = await api.getPetsByStatus('sold');
    
    expect(response.status()).toBe(200);
    
    const pets = await response.json();
    expect(Array.isArray(pets)).toBeTruthy();
  });

  test('should create a new pet successfully', async () => {
    const response = await api.createPet(testPetData);
    
    expect(response.status()).toBe(200);
    
    const createdPet = await response.json();
    expect(createdPet).toHaveProperty('id');
    expect(createdPet.name).toBe(testPetData.name);
    expect(createdPet.status).toBe(testPetData.status);
    
    // Store the created pet ID for cleanup
    test.info().attach('createdPetId', { body: createdPet.id.toString() });
  });

  test('should get pet by ID successfully', async () => {
    // First create a pet
    const createResponse = await api.createPet(testPetData);
    expect(createResponse.status()).toBe(200);
    
    const createdPet = await createResponse.json();
    const petId = createdPet.id;
    
    // Then retrieve it by ID
    const getResponse = await api.getPetById(petId);
    expect(getResponse.status()).toBe(200);
    
    const retrievedPet = await getResponse.json();
    expect(retrievedPet.id).toBe(petId);
    expect(retrievedPet.name).toBe(testPetData.name);
  });

  test('should update an existing pet successfully', async () => {
    // First create a pet
    const createResponse = await api.createPet(testPetData);
    expect(createResponse.status()).toBe(200);
    
    const createdPet = await createResponse.json();
    
    // Update the pet
    const updatedPetData = {
      ...createdPet,
      name: 'UpdatedPet-' + Date.now(),
      status: 'pending'
    };
    
    const updateResponse = await api.updatePet(updatedPetData);
    expect(updateResponse.status()).toBe(200);
    
    const updatedPet = await updateResponse.json();
    expect(updatedPet.name).toBe(updatedPetData.name);
    expect(updatedPet.status).toBe('pending');
  });

  test('should delete a pet successfully', async () => {
    // First create a pet
    const createResponse = await api.createPet(testPetData);
    expect(createResponse.status()).toBe(200);
    
    const createdPet = await createResponse.json();
    const petId = createdPet.id;
    
    // Delete the pet
    const deleteResponse = await api.deletePet(petId);
    expect(deleteResponse.status()).toBe(200);
    
    // Verify the pet is deleted by trying to get it
    const getResponse = await api.getPetById(petId);
    expect(getResponse.status()).toBe(404);
  });

  // Negative test cases
  test('should return 404 for non-existent pet ID', async () => {
    const nonExistentId = 999999999;
    const response = await api.getPetById(nonExistentId);
    
    expect(response.status()).toBe(404);
  });

  test('should return 400 for invalid status parameter', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/pet/findByStatus?status=invalid`, {
      headers: { 'Accept': 'application/json' }
    });
    
    expect(response.status()).toBe(400);
  });

  test('should handle missing required fields when creating pet', async ({ request }) => {
    const invalidPetData = {
      // Missing required 'name' and 'photoUrls' fields
      category: {
        id: 1,
        name: 'TestCategory'
      },
      status: 'available'
    };
    
    const response = await request.post(`${API_BASE_URL}/pet`, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: invalidPetData
    });
    
    // API should return error for missing required fields
    expect([400, 405]).toContain(response.status());
  });
});

// Performance and load testing
test.describe('Pet Store API - Performance Tests', () => {
  let api: PetStoreAPI;

  test.beforeEach(async ({ request }) => {
    api = new PetStoreAPI(request);
  });

  test('should respond within acceptable time limits', async () => {
    const startTime = Date.now();
    
    const response = await api.getPetsByStatus('available');
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
  });

  test('should handle concurrent requests', async ({ request }) => {
    const concurrentRequests = Array.from({ length: 5 }, () => 
      new PetStoreAPI(request).getPetsByStatus('available')
    );
    
    const responses = await Promise.all(concurrentRequests);
    
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
  });
});

// Data validation tests
test.describe('Pet Store API - Data Validation', () => {
  let api: PetStoreAPI;

  test.beforeEach(async ({ request }) => {
    api = new PetStoreAPI(request);
  });

  test('should return pets with valid data structure', async () => {
    const response = await api.getPetsByStatus('available');
    expect(response.status()).toBe(200);
    
    const pets = await response.json();
    
    if (pets.length > 0) {
      const pet = pets[0];
      
      // Validate required fields
      expect(pet).toHaveProperty('id');
      expect(pet).toHaveProperty('name');
      expect(pet).toHaveProperty('photoUrls');
      expect(pet).toHaveProperty('status');
      
      // Validate data types
      expect(typeof pet.id).toBe('number');
      expect(typeof pet.name).toBe('string');
      expect(Array.isArray(pet.photoUrls)).toBeTruthy();
      expect(['available', 'pending', 'sold']).toContain(pet.status);
      
      // Validate optional fields if present
      if (pet.category) {
        expect(pet.category).toHaveProperty('id');
        expect(pet.category).toHaveProperty('name');
      }
      
      if (pet.tags) {
        expect(Array.isArray(pet.tags)).toBeTruthy();
        pet.tags.forEach((tag: any) => {
          expect(tag).toHaveProperty('id');
          expect(tag).toHaveProperty('name');
        });
      }
    }
  });
});
