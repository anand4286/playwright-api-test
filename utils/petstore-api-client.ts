import { APIRequestContext, expect } from '@playwright/test';
import { PetData, OrderData, UserData } from '../test-data/petstore-data-factory';

export interface ApiResponse {
  status: number;
  data?: any;
  headers?: any;
  duration?: number;
}

export class PetstoreApiClient {
  private request: APIRequestContext;
  private baseUrl: string;
  private apiKey: string;
  private currentStep: string = '';
  private startTime: number = 0;

  constructor(request: APIRequestContext, baseUrl: string, apiKey: string) {
    this.request = request;
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  setStep(stepName: string): void {
    this.currentStep = stepName;
    this.startTime = Date.now();
    console.log(`🔸 ${stepName}`);
  }

  private async processResponse(response: any, operation: string): Promise<ApiResponse> {
    const duration = Date.now() - this.startTime;
    const status = response.status();
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = await response.text();
    }

    await this.logApiCall(operation, status, data, duration);
    
    return { status, data, duration };
  }

  // Pet Management Operations
  async addPet(petData: PetData): Promise<ApiResponse> {
    this.setStep(`Adding pet: ${petData.name}`);
    
    const response = await this.request.post(`${this.baseUrl}/pet`, {
      data: petData,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    return this.processResponse(response, `POST /pet`);
  }

  async updatePet(petData: PetData): Promise<ApiResponse> {
    this.setStep(`Updating pet: ${petData.name}`);
    
    const response = await this.request.put(`${this.baseUrl}/pet`, {
      data: petData,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    return this.processResponse(response, `PUT /pet`);
  }

  async getPetById(petId: number): Promise<ApiResponse> {
    this.setStep(`Getting pet by ID: ${petId}`);
    
    const response = await this.request.get(`${this.baseUrl}/pet/${petId}`, {
      headers: {
        'api_key': this.apiKey
      }
    });

    return this.processResponse(response, `GET /pet/${petId}`);
  }

  async findPetsByStatus(status: string[]): Promise<ApiResponse> {
    this.setStep(`Finding pets by status: ${status.join(', ')}`);
    
    const queryParams = status.map(s => `status=${s}`).join('&');
    const response = await this.request.get(`${this.baseUrl}/pet/findByStatus?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    return this.processResponse(response, `GET /pet/findByStatus?${queryParams}`);
  }

  async findPetsByTags(tags: string[]): Promise<ApiResponse> {
    this.setStep(`Finding pets by tags: ${tags.join(', ')}`);
    
    const queryParams = tags.map(t => `tags=${t}`).join('&');
    const response = await this.request.get(`${this.baseUrl}/pet/findByTags?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    return this.processResponse(response, `GET /pet/findByTags?${queryParams}`);
  }

  async updatePetWithForm(petId: number, name?: string, status?: string): Promise<ApiResponse> {
    this.setStep(`Updating pet ${petId} with form data`);
    
    const formData = new URLSearchParams();
    if (name) formData.append('name', name);
    if (status) formData.append('status', status);

    const response = await this.request.post(`${this.baseUrl}/pet/${petId}`, {
      data: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    return this.processResponse(response, `POST /pet/${petId}`);
  }

  async deletePet(petId: number): Promise<ApiResponse> {
    this.setStep(`Deleting pet: ${petId}`);
    
    const response = await this.request.delete(`${this.baseUrl}/pet/${petId}`, {
      headers: {
        'api_key': this.apiKey,
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    return this.processResponse(response, `DELETE /pet/${petId}`);
  }

  async uploadPetImage(petId: number, imageFile: Buffer, metadata?: string): Promise<ApiResponse> {
    this.setStep(`Uploading image for pet: ${petId}`);
    
    const response = await this.request.post(`${this.baseUrl}/pet/${petId}/uploadImage`, {
      multipart: {
        file: imageFile,
        additionalMetadata: metadata || ''
      },
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    return this.processResponse(response, `POST /pet/${petId}/uploadImage`);
  }

  // Store Operations
  async getStoreInventory(): Promise<ApiResponse> {
    this.setStep('Getting store inventory');
    
    const response = await this.request.get(`${this.baseUrl}/store/inventory`, {
      headers: {
        'api_key': this.apiKey
      }
    });

    return this.processResponse(response, `GET /store/inventory`);
  }

  async placeOrder(orderData: OrderData): Promise<ApiResponse> {
    this.setStep(`Placing order for pet: ${orderData.petId}`);
    
    const response = await this.request.post(`${this.baseUrl}/store/order`, {
      data: orderData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return this.processResponse(response, `POST /store/order`);
  }

  async getOrderById(orderId: number): Promise<ApiResponse> {
    this.setStep(`Getting order by ID: ${orderId}`);
    
    const response = await this.request.get(`${this.baseUrl}/store/order/${orderId}`);
    
    return this.processResponse(response, `GET /store/order/${orderId}`);
  }

  async deleteOrder(orderId: number): Promise<ApiResponse> {
    this.setStep(`Deleting order: ${orderId}`);
    
    const response = await this.request.delete(`${this.baseUrl}/store/order/${orderId}`);
    
    return this.processResponse(response, `DELETE /store/order/${orderId}`);
  }

  // User Operations
  async createUser(userData: UserData): Promise<ApiResponse> {
    this.setStep(`Creating user: ${userData.username}`);
    
    const response = await this.request.post(`${this.baseUrl}/user`, {
      data: userData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return this.processResponse(response, `POST /user`);
  }

  async createUsersWithArray(usersData: UserData[]): Promise<ApiResponse> {
    this.setStep(`Creating ${usersData.length} users with array`);
    
    const response = await this.request.post(`${this.baseUrl}/user/createWithArray`, {
      data: usersData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return this.processResponse(response, `POST /user/createWithArray`);
  }

  async createUsersWithList(usersData: UserData[]): Promise<ApiResponse> {
    this.setStep(`Creating ${usersData.length} users with list`);
    
    const response = await this.request.post(`${this.baseUrl}/user/createWithList`, {
      data: usersData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return this.processResponse(response, `POST /user/createWithList`);
  }

  async getUserByUsername(username: string): Promise<ApiResponse> {
    this.setStep(`Getting user: ${username}`);
    
    const response = await this.request.get(`${this.baseUrl}/user/${username}`);
    
    return this.processResponse(response, `GET /user/${username}`);
  }

  async updateUser(username: string, userData: UserData): Promise<ApiResponse> {
    this.setStep(`Updating user: ${username}`);
    
    const response = await this.request.put(`${this.baseUrl}/user/${username}`, {
      data: userData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return this.processResponse(response, `PUT /user/${username}`);
  }

  async deleteUser(username: string): Promise<ApiResponse> {
    this.setStep(`Deleting user: ${username}`);
    
    const response = await this.request.delete(`${this.baseUrl}/user/${username}`);
    
    return this.processResponse(response, `DELETE /user/${username}`);
  }

  async loginUser(username: string, password: string): Promise<ApiResponse> {
    this.setStep(`Logging in user: ${username}`);
    
    const response = await this.request.get(`${this.baseUrl}/user/login?username=${username}&password=${password}`);
    
    return this.processResponse(response, `GET /user/login`);
  }

  async logoutUser(): Promise<ApiResponse> {
    this.setStep('Logging out user');
    
    const response = await this.request.get(`${this.baseUrl}/user/logout`);
    
    return this.processResponse(response, `GET /user/logout`);
  }

  // Validation helpers
  validateResponse(response: ApiResponse, expectedStatus: number, requirementId?: string): ApiResponse {
    expect(response.status).toBe(expectedStatus);
    
    if (requirementId) {
      console.log(`✅ Requirement ${requirementId} validated - Status: ${response.status}`);
    }
    
    return response;
  }

  validateResponseContains(response: ApiResponse, expectedFields: string[]): void {
    if (typeof response.data === 'object' && response.data !== null) {
      expectedFields.forEach(field => {
        expect(response.data).toHaveProperty(field);
      });
    }
  }

  validateArrayResponse(response: ApiResponse, minLength: number = 0): void {
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThanOrEqual(minLength);
  }

  validateErrorResponse(response: ApiResponse, expectedStatus: number): void {
    expect(response.status).toBe(expectedStatus);
    
    // Validate error response structure if it exists
    if (response.data && typeof response.data === 'object') {
      // Common error response fields
      const errorFields = ['code', 'type', 'message'];
      const hasErrorField = errorFields.some(field => response.data.hasOwnProperty(field));
      if (hasErrorField) {
        console.log(`✅ Error response structure validated for status ${expectedStatus}`);
      }
    }
  }

  private async logApiCall(operation: string, status: number, responseData: any, duration: number): Promise<void> {
    const timestamp = new Date().toISOString();
    
    console.log(`🌐 API Call [${timestamp}]`);
    console.log(`   ${operation}`);
    console.log(`   Status: ${status} (${duration}ms)`);
    
    if (responseData && typeof responseData === 'object') {
      console.log(`   Response: ${JSON.stringify(responseData, null, 2).substring(0, 500)}${JSON.stringify(responseData).length > 500 ? '...' : ''}`);
    } else if (responseData) {
      console.log(`   Response: ${responseData.toString().substring(0, 200)}`);
    }
    
    // Log performance issues
    if (duration > 5000) {
      console.warn(`⚠️  Slow response detected: ${duration}ms`);
    }
  }

  // Utility methods
  async performHealthCheck(): Promise<boolean> {
    try {
      const response = await this.getStoreInventory();
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getApiKey(): string {
    return this.apiKey;
  }
}
