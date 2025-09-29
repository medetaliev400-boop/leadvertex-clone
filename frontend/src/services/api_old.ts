import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
    avatar_url?: string;
    created_at: string;
  };
}

interface Project {
  id: number;
  name: string;
  title?: string;
  description?: string;
  subdomain?: string;
  tariff: string;
  is_active: boolean;
  created_at: string;
  owner_id: number;
}

interface Order {
  id: number;
  project_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  total_amount: number;
  status_id: number;
  status?: {
    id: number;
    name: string;
    color: string;
    group: string;
  };
  operator?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  created_at: string;
  updated_at?: string;
}

interface Product {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  cost_price?: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.setAuthToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string | null) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await this.api.post('/api/admin/auth/login-simple', {
        email,
        password,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      };
    }
  }

  async getCurrentUser(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/api/admin/auth/me');
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get user info',
      };
    }
  }

  // Projects endpoints
  async getProjects(): Promise<ApiResponse<Project[]>> {
    try {
      const response = await this.api.get('/api/admin/projects/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch projects',
      };
    }
  }

  async createProject(projectData: {
    name: string;
    title?: string;
    description?: string;
    tariff?: string;
  }): Promise<ApiResponse<Project>> {
    try {
      const response = await this.api.post('/api/admin/projects/', projectData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create project',
      };
    }
  }

  // Orders endpoints
  async getOrders(params: {
    project_id: number;
    page?: number;
    limit?: number;
    status_id?: number;
    search?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ApiResponse<PaginatedResponse<Order>>> {
    try {
      const response = await this.api.get('/api/admin/orders/', { params });
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch orders',
      };
    }
  }

  async getOrder(orderId: number): Promise<ApiResponse<Order>> {
    try {
      const response = await this.api.get(`/api/admin/orders/${orderId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch order',
      };
    }
  }

  async createOrder(
    projectId: number,
    orderData: {
      customer_name: string;
      customer_phone: string;
      customer_email?: string;
      total_amount: number;
      comment?: string;
    }
  ): Promise<ApiResponse<Order>> {
    try {
      const response = await this.api.post(
        `/api/admin/orders/?project_id=${projectId}`,
        orderData
      );
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create order',
      };
    }
  }

  async updateOrder(
    orderId: number,
    orderData: Partial<{
      customer_name: string;
      customer_phone: string;
      customer_email: string;
      total_amount: number;
      status_id: number;
      comment: string;
      internal_comment: string;
    }>
  ): Promise<ApiResponse<Order>> {
    try {
      const response = await this.api.put(`/api/admin/orders/${orderId}`, orderData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update order',
      };
    }
  }

  async deleteOrder(orderId: number): Promise<ApiResponse> {
    try {
      const response = await this.api.delete(`/api/admin/orders/${orderId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to delete order',
      };
    }
  }

  // Products endpoints
  async getProducts(params: {
    project_id: number;
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<PaginatedResponse<Product>>> {
    try {
      const response = await this.api.get('/api/admin/products/', { params });
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch products',
      };
    }
  }

  async createProduct(
    projectId: number,
    productData: {
      name: string;
      description?: string;
      sku?: string;
      price: number;
      cost_price?: number;
      stock_quantity: number;
      low_stock_threshold?: number;
    }
  ): Promise<ApiResponse<Product>> {
    try {
      const response = await this.api.post(
        `/api/admin/products/?project_id=${projectId}`,
        productData
      );
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create product',
      };
    }
  }

  async updateProduct(
    productId: number,
    productData: Partial<Product>
  ): Promise<ApiResponse<Product>> {
    try {
      const response = await this.api.put(`/api/admin/products/${productId}`, productData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update product',
      };
    }
  }

  async deleteProduct(productId: number): Promise<ApiResponse> {
    try {
      const response = await this.api.delete(`/api/admin/products/${productId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to delete product',
      };
    }
  }

  // Order statuses
  async getOrderStatuses(projectId: number): Promise<ApiResponse> {
    try {
      const response = await this.api.get(`/api/admin/orders/statuses?project_id=${projectId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch statuses',
      };
    }
  }

  // Statistics
  async getDashboardStats(projectId: number): Promise<ApiResponse> {
    try {
      const response = await this.api.get(`/api/admin/statistics/dashboard?project_id=${projectId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch statistics',
      };
    }
  }
}

export const apiService = new ApiService();
export type { ApiResponse, Project, Order, Product, PaginatedResponse };