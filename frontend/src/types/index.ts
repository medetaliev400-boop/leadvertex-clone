// Base interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// User interfaces
export interface User {
  id: number;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'operator' | 'designer' | 'webmaster' | 'representative' | string;
  avatar?: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

// Project interfaces
export interface Project {
  id: number;
  name: string;
  description: string;
  domain: string;
  currency: string;
  timezone: string;
  status: 'active' | 'paused' | 'expired' | 'demo';
  tariff_name: string;
  expires_at: string;
  auto_renewal: boolean;
  created_at: string;
  stats: ProjectStats;
}

export interface ProjectStats {
  total_orders: number;
  orders_today: number;
  total_revenue: number;
  conversion_rate: number;
  active_operators: number;
  active_products: number;
}

export interface ProjectSettings {
  id: number;
  project_id: number;
  telephony_enabled: boolean;
  sip_server?: string;
  outgoing_number?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  email_from?: string;
  webhook_url?: string;
  timezone: string;
  currency: string;
  auto_assign_orders: boolean;
  robo_calling_enabled: boolean;
  landing_domain?: string;
  created_at: string;
  updated_at: string;
}

// Product interfaces
export interface Product {
  id: number;
  name: string;
  description: string;
  alias: string;
  category_id: number | null;
  category_name?: string;
  unit: string;
  weight: number;
  purchase_price: number;
  prices: ProductPrice[];
  stock_quantity: number;
  track_stock: boolean;
  is_active: boolean;
  project_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductPrice {
  quantity: number;
  price: number;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  parent_id: number | null;
  products_count: number;
  created_at: string;
}

// Order interfaces
export interface Order {
  id: number;
  project_id: number;
  status_id: number;
  status_name: string;
  status_group: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  total_amount: number;
  comment?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  assigned_operator_id?: number;
  assigned_operator_name?: string;
  products: OrderProduct[];
  created_at: string;
  updated_at: string;
  last_call_at?: string;
  next_call_at?: string;
  calls_count: number;
  client_timezone?: string;
}

export interface OrderProduct {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrderStatus {
  id: number;
  name: string;
  group: 'processing' | 'approved' | 'shipped' | 'paid' | 'returned' | 'canceled' | 'spam';
  color: string;
  is_active: boolean;
  sort_order: number;
}

// Call interfaces
export interface Call {
  id: number;
  order_id?: number;
  operator_id: number;
  operator_name: string;
  phone_number: string;
  direction: 'incoming' | 'outgoing';
  status: 'answered' | 'no_answer' | 'busy' | 'failed';
  duration: number;
  recording_url?: string;
  started_at: string;
  ended_at?: string;
  notes?: string;
}

// Statistics interfaces
export interface DashboardStats {
  totalOrders: number;
  newOrdersToday: number;
  totalRevenue: number;
  conversionRate: number;
  topProducts: Array<{
    name: string;
    orders: number;
    revenue: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  dailyStats: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

// Telephony interfaces
export interface TelephonySettings {
  id: number;
  project_id: number;
  provider: 'manual' | 'sip' | 'api';
  sip_server?: string;
  sip_username?: string;
  sip_password?: string;
  outgoing_numbers: string[];
  caller_id?: string;
  recording_enabled: boolean;
  robo_calling_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Automation interfaces
export interface AutomationRule {
  id: number;
  project_id: number;
  name: string;
  description: string;
  trigger_type: 'order_created' | 'status_changed' | 'schedule' | 'no_answer';
  trigger_conditions: Record<string, any>;
  actions: AutomationAction[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationAction {
  type: 'send_sms' | 'send_email' | 'change_status' | 'assign_operator' | 'schedule_call' | 'robo_call';
  parameters: Record<string, any>;
  delay_minutes?: number;
}

// CPA Network interfaces
export interface Webmaster {
  id: number;
  name: string;
  email: string;
  phone?: string;
  balance: number;
  commission_rate: number;
  payment_method: string;
  is_active: boolean;
  registered_at: string;
  last_activity?: string;
}

export interface AffiliateLanding {
  id: number;
  project_id: number;
  name: string;
  url: string;
  description: string;
  is_active: boolean;
  conversion_rate: number;
  created_at: string;
}

// Landing Page interfaces
export interface LandingPage {
  id: number;
  project_id: number;
  name: string;
  url: string;
  template_id?: number;
  custom_code?: string;
  meta_title?: string;
  meta_description?: string;
  is_active: boolean;
  visits_count: number;
  orders_count: number;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
}

// Form interfaces
export interface FormField {
  id: number;
  project_id: number;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox';
  is_required: boolean;
  placeholder?: string;
  options?: string[];
  validation_rules?: Record<string, any>;
  sort_order: number;
  is_active: boolean;
}

// Payment interfaces
export interface PaymentMethod {
  id: number;
  project_id: number;
  name: string;
  type: 'cash' | 'card' | 'bank_transfer' | 'online';
  provider?: string;
  api_key?: string;
  secret_key?: string;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
}

// Shipping interfaces
export interface ShippingMethod {
  id: number;
  project_id: number;
  name: string;
  provider: string;
  api_credentials?: Record<string, any>;
  cost_calculation: 'fixed' | 'weight_based' | 'api';
  base_cost?: number;
  weight_rate?: number;
  is_active: boolean;
  created_at: string;
}

// Report interfaces
export interface Report {
  id: number;
  project_id: number;
  name: string;
  type: 'conversions' | 'operators' | 'products' | 'calls' | 'webmasters';
  filters: Record<string, any>;
  schedule?: 'daily' | 'weekly' | 'monthly';
  email_recipients: string[];
  is_active: boolean;
  created_at: string;
  last_generated?: string;
}

// Notification interfaces
export interface Notification {
  id: number;
  user_id: number;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  expires_at?: string;
}

// Filter interfaces
export interface BaseFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface OrderFilters extends BaseFilters {
  status_id?: number;
  operator_id?: number;
  date_from?: string;
  date_to?: string;
  source?: string;
  has_calls?: boolean;
}

export interface ProductFilters extends BaseFilters {
  category_id?: number;
  is_active?: boolean;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
}

export interface CallFilters extends BaseFilters {
  operator_id?: number;
  direction?: 'incoming' | 'outgoing';
  status?: string;
  date_from?: string;
  date_to?: string;
  min_duration?: number;
}

// API Error interface
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Export all interfaces
export type {
  // Add any additional exports here
};