import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ApiResponse,
  PaginatedResponse,
  User,
  Project,
  Product,
  Category,
  Order,
  OrderStatus,
  Call,
  TelephonySettings,
  AutomationRule,
  Webmaster,
  LandingPage,
  Report,
  Notification,
  OrderFilters,
  ProductFilters,
  CallFilters,
  BaseFilters,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

interface RegisterRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
}

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.token || localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.token = null;
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('token');
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/login', credentials);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/register', userData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      await this.api.post('/auth/logout');
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<User> = await this.api.get('/auth/me');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  // Project methods
  async getProjects(): Promise<ApiResponse<Project[]>> {
    try {
      const response: AxiosResponse<Project[]> = await this.api.get('/projects');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  async createProject(projectData: Partial<Project>): Promise<ApiResponse<Project>> {
    try {
      const response: AxiosResponse<Project> = await this.api.post('/projects', projectData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  async updateProject(projectId: number, projectData: Partial<Project>): Promise<ApiResponse<Project>> {
    try {
      const response: AxiosResponse<Project> = await this.api.put(`/projects/${projectId}`, projectData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  async deleteProject(projectId: number): Promise<ApiResponse> {
    try {
      await this.api.delete(`/projects/${projectId}`);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  // Product methods
  async getProducts(projectId: number, filters?: ProductFilters): Promise<ApiResponse<PaginatedResponse<Product>>> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }
      
      const response: AxiosResponse<PaginatedResponse<Product>> = await this.api.get(
        `/projects/${projectId}/products?${params.toString()}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  async createProduct(projectId: number, productData: Partial<Product>): Promise<ApiResponse<Product>> {
    try {
      const response: AxiosResponse<Product> = await this.api.post(`/projects/${projectId}/products`, productData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  async updateProduct(productId: number, productData: Partial<Product>): Promise<ApiResponse<Product>> {
    try {
      const response: AxiosResponse<Product> = await this.api.put(`/products/${productId}`, productData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  async deleteProduct(productId: number): Promise<ApiResponse> {
    try {
      await this.api.delete(`/products/${productId}`);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  // Category methods
  async getCategories(projectId: number): Promise<ApiResponse<Category[]>> {
    try {
      const response: AxiosResponse<Category[]> = await this.api.get(`/projects/${projectId}/categories`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  async createCategory(projectId: number, categoryData: Partial<Category>): Promise<ApiResponse<Category>> {
    try {
      const response: AxiosResponse<Category> = await this.api.post(`/projects/${projectId}/categories`, categoryData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  // Order methods
  async getOrders(projectId: number, filters?: OrderFilters): Promise<ApiResponse<PaginatedResponse<Order>>> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }
      
      const response: AxiosResponse<PaginatedResponse<Order>> = await this.api.get(
        `/projects/${projectId}/orders?${params.toString()}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  async createOrder(projectId: number, orderData: Partial<Order>): Promise<ApiResponse<Order>> {
    try {
      const response: AxiosResponse<Order> = await this.api.post(`/projects/${projectId}/orders`, orderData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  async updateOrder(orderId: number, orderData: Partial<Order>): Promise<ApiResponse<Order>> {
    try {
      const response: AxiosResponse<Order> = await this.api.put(`/orders/${orderId}`, orderData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  async deleteOrder(orderId: number): Promise<ApiResponse> {
    try {
      await this.api.delete(`/orders/${orderId}`);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  // Order Status methods
  async getOrderStatuses(projectId: number): Promise<ApiResponse<OrderStatus[]>> {
    try {
      const response: AxiosResponse<OrderStatus[]> = await this.api.get(`/projects/${projectId}/statuses`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  // Call methods
  async getCalls(projectId: number, filters?: CallFilters): Promise<ApiResponse<PaginatedResponse<Call>>> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }
      
      const response: AxiosResponse<PaginatedResponse<Call>> = await this.api.get(
        `/projects/${projectId}/calls?${params.toString()}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  async makeCall(projectId: number, phone: string, orderId?: number): Promise<ApiResponse<Call>> {
    try {
      const response: AxiosResponse<Call> = await this.api.post(`/projects/${projectId}/calls`, {
        phone,
        order_id: orderId,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  // Statistics methods
  async getDashboardStats(projectId: number): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.get(`/projects/${projectId}/stats/dashboard`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  async getConversionStats(projectId: number, filters?: any): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }
      
      const response: AxiosResponse<any> = await this.api.get(
        `/projects/${projectId}/stats/conversions?${params.toString()}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  async getOperatorStats(projectId: number, filters?: any): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }
      
      const response: AxiosResponse<any> = await this.api.get(
        `/projects/${projectId}/stats/operators?${params.toString()}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  // Legacy methods for backward compatibility
  async getStatuses(projectId: number): Promise<ApiResponse<OrderStatus[]>> {
    return this.getOrderStatuses(projectId);
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export types for use in components
export type {
  ApiResponse,
  PaginatedResponse,
  User,
  Project,
  Product,
  Category,
  Order,
  Call,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
};