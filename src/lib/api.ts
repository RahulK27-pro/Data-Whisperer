// API client for backend communication

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Table operations
  async createTable(tableName: string, columns: Array<{ name: string; type: string; nullable?: boolean }>) {
    return this.request('/tables/create', {
      method: 'POST',
      body: JSON.stringify({ tableName, columns }),
    });
  }

  async listTables() {
    return this.request<string[]>('/tables/list');
  }

  async getTableSchema(tableName: string) {
    return this.request(`/tables/${tableName}/schema`);
  }

  async deleteTable(tableName: string) {
    return this.request(`/tables/${tableName}`, {
      method: 'DELETE',
    });
  }

  // Data operations
  async addData(tableName: string, data: Record<string, any>) {
    return this.request('/data/add', {
      method: 'POST',
      body: JSON.stringify({ tableName, data }),
    });
  }

  async bulkAddData(tableName: string, data: Array<Record<string, any>>) {
    return this.request('/data/bulk-add', {
      method: 'POST',
      body: JSON.stringify({ tableName, data }),
    });
  }

  async getData(tableName: string, limit = 100, offset = 0) {
    return this.request(`/data/${tableName}?limit=${limit}&offset=${offset}`);
  }

  async updateData(tableName: string, id: number, data: Record<string, any>) {
    return this.request(`/data/${tableName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteData(tableName: string, id: number) {
    return this.request(`/data/${tableName}/${id}`, {
      method: 'DELETE',
    });
  }

  // Context operations
  async saveContext(tableName: string, description: string) {
    return this.request('/context', {
      method: 'POST',
      body: JSON.stringify({ tableName, description }),
    });
  }

  async getContext(tableName: string) {
    return this.request(`/context/${tableName}`);
  }

  async getAllContexts() {
    return this.request('/context');
  }

  async deleteContext(tableName: string) {
    return this.request(`/context/${tableName}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
