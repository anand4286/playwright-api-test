import { test as base, expect } from '@playwright/test';

export interface TestData {
  apiKey?: string;
  bearerToken?: string;
  userId?: string;
  petId?: string;
  orderId?: string;
}

export const test = base.extend<TestData>({
  apiKey: async ({}, use) => {
    const apiKey = process.env.API_KEY || 'special-key';
    await use(apiKey);
  },
  
  bearerToken: async ({}, use) => {
    const token = process.env.BEARER_TOKEN || '';
    await use(token);
  },
  
  userId: async ({}, use) => {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await use(userId);
  },
  
  petId: async ({}, use) => {
    const petId = Math.floor(Math.random() * 1000000).toString();
    await use(petId);
  },
  
  orderId: async ({}, use) => {
    const orderId = Math.floor(Math.random() * 1000).toString();
    await use(orderId);
  }
});

export { expect };

export class APIClient {
  constructor(private request: any, private baseURL: string) {}
  
  async get(endpoint: string, options: any = {}) {
    return await this.request.get(this.baseURL + endpoint, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    });
  }
  
  async post(endpoint: string, data: any = {}, options: any = {}) {
    return await this.request.post(this.baseURL + endpoint, {
      data,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    });
  }
  
  async put(endpoint: string, data: any = {}, options: any = {}) {
    return await this.request.put(this.baseURL + endpoint, {
      data,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    });
  }
  
  async delete(endpoint: string, options: any = {}) {
    return await this.request.delete(this.baseURL + endpoint, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    });
  }
}