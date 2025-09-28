from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from enum import Enum

# Base schemas
class BaseResponse(BaseModel):
    """Base response schema"""
    success: bool = True
    message: Optional[str] = None

class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(1, ge=1)
    limit: int = Field(50, ge=1, le=1000)
    
class PaginatedResponse(BaseModel):
    """Paginated response"""
    items: List[Any]
    total: int
    page: int
    limit: int
    pages: int

# User schemas
class UserRole(str, Enum):
    ADMIN = "admin"
    OPERATOR = "operator"
    DESIGNER = "designer"
    WEBMASTER = "webmaster"
    REPRESENTATIVE = "representative"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    BLOCKED = "blocked"
    PENDING = "pending"

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole = UserRole.OPERATOR

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    
class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

class UserResponse(UserBase):
    id: int
    username: Optional[str]
    avatar_url: Optional[str]
    status: UserStatus
    is_email_confirmed: bool
    created_at: datetime
    last_login_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

# Project schemas
class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    domain: Optional[str] = None

class ProjectCreate(ProjectBase):
    tariff: str = "Free"

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    domain: Optional[str] = None
    webhook_url: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

class ProjectResponse(ProjectBase):
    id: int
    subdomain: Optional[str]
    tariff: str
    max_orders_per_month: int
    is_unlimited_orders: bool
    is_active: bool
    is_trial: bool
    trial_ends_at: Optional[datetime]
    api_key: Optional[str]
    created_at: datetime
    owner_id: int
    
    class Config:
        from_attributes = True

class ProjectInfo(BaseModel):
    """API response for getProjectInfo"""
    name: str
    title: str
    tariff: str
    created_at: datetime = Field(alias="createdAt")
    active_to: Optional[datetime] = Field(alias="activeTo")
    max_orders: str = Field(alias="maxOrders")
    orders_for_the_period: int = Field(alias="ordersForThePeriod")
    today_orders: int = Field(alias="todayOrders")
    today_accepted: int = Field(alias="todayAccepted")
    
    class Config:
        allow_population_by_field_name = True

# Order Status schemas
class OrderStatusBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field("#007bff", pattern=r"^#[0-9A-Fa-f]{6}$")
    group: str = Field(..., pattern=r"^(processing|accepted|shipped|paid|canceled|return|spam)$")
    goods_quantity_action: int = Field(0, ge=-1, le=1)

class OrderStatusCreate(OrderStatusBase):
    position: int = 0
    notify_client_sms: bool = False
    notify_client_email: bool = False
    sms_template: Optional[str] = None
    email_template: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    position: Optional[int] = None
    notify_client_sms: Optional[bool] = None
    notify_client_email: Optional[bool] = None
    sms_template: Optional[str] = None
    email_template: Optional[str] = None
    is_active: Optional[bool] = None

class OrderStatusResponse(OrderStatusBase):
    id: int
    position: int
    notify_client_sms: bool
    notify_client_email: bool
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class StatusListItem(BaseModel):
    """API response for getStatusList"""
    name: str
    group: str
    orders: str  # String representation of count
    goods_quantity: Optional[int] = Field(alias="goodsQuantity")
    
    class Config:
        allow_population_by_field_name = True

# Order schemas
class OrderSource(str, Enum):
    LANDING = "landing"
    API = "api"
    MANUAL = "manual"
    EXCEL_IMPORT = "excel_import"
    CALL = "call"
    CPA = "cpa"

class OrderBase(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_phone: str = Field(..., min_length=10, max_length=20)
    customer_email: Optional[EmailStr] = None
    
    country: str = "Россия"
    region: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    
    total_amount: Decimal = Field(0, ge=0)
    comment: Optional[str] = None
    
    # UTM parameters
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    
    # Custom fields
    custom_fields: Optional[Dict[str, Any]] = None

class OrderCreate(OrderBase):
    status_id: Optional[int] = None
    external_id: Optional[str] = None
    landing_url: Optional[str] = None

class OrderUpdate(BaseModel):
    customer_name: Optional[str] = Field(None, min_length=1, max_length=255)
    customer_phone: Optional[str] = Field(None, min_length=10, max_length=20)
    customer_email: Optional[EmailStr] = None
    
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    
    total_amount: Optional[Decimal] = Field(None, ge=0)
    comment: Optional[str] = None
    internal_comment: Optional[str] = None
    
    status_id: Optional[int] = None
    operator_id: Optional[int] = None
    
    shipping_service: Optional[str] = None
    shipping_cost: Optional[Decimal] = Field(None, ge=0)
    tracking_number: Optional[str] = None
    
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None
    
    next_call_at: Optional[datetime] = None
    custom_fields: Optional[Dict[str, Any]] = None

class OrderResponse(OrderBase):
    id: int
    project_id: int
    status_id: int
    operator_id: Optional[int]
    
    source: str
    external_id: Optional[str]
    
    shipping_service: Optional[str]
    shipping_cost: Decimal
    tracking_number: Optional[str]
    
    payment_method: Optional[str]
    payment_status: str
    paid_amount: Decimal
    
    calls_count: int
    last_call_result: Optional[str]
    next_call_at: Optional[datetime]
    call_attempts: int
    
    created_at: datetime
    updated_at: Optional[datetime]
    status_updated_at: datetime
    approved_at: Optional[datetime]
    shipped_at: Optional[datetime]
    canceled_at: Optional[datetime]
    
    # Relations
    status: Optional[OrderStatusResponse] = None
    operator: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

# Product schemas
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    sku: Optional[str] = Field(None, max_length=100)
    
    price: Decimal = Field(..., ge=0)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    discount_price: Optional[Decimal] = Field(None, ge=0)
    
    track_inventory: bool = True
    stock_quantity: int = Field(0, ge=0)
    low_stock_threshold: int = Field(10, ge=0)
    
    weight: Optional[Decimal] = Field(None, ge=0)
    dimensions: Optional[Dict[str, float]] = None
    
    is_active: bool = True
    is_digital: bool = False

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    sku: Optional[str] = Field(None, max_length=100)
    
    price: Optional[Decimal] = Field(None, ge=0)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    discount_price: Optional[Decimal] = Field(None, ge=0)
    
    track_inventory: Optional[bool] = None
    stock_quantity: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    
    weight: Optional[Decimal] = Field(None, ge=0)
    dimensions: Optional[Dict[str, float]] = None
    
    is_active: Optional[bool] = None
    is_digital: Optional[bool] = None
    
    custom_fields: Optional[Dict[str, Any]] = None

class ProductResponse(ProductBase):
    id: int
    project_id: int
    reserved_quantity: int
    images: List[str]
    documents: List[str]
    tags: List[str]
    custom_fields: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True