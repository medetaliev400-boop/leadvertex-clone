from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, DECIMAL, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from enum import Enum
from app.core.database import Base

class OrderSource(str, Enum):
    LANDING = "landing"
    API = "api"
    MANUAL = "manual"
    EXCEL_IMPORT = "excel_import"
    CALL = "call"
    CPA = "cpa"

class CallResult(str, Enum):
    NO_ANSWER = "no_answer"
    BUSY = "busy"
    ANSWERED = "answered"
    REJECTED = "rejected"
    INVALID_NUMBER = "invalid_number"

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Customer info
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(20), nullable=False, index=True)
    customer_email = Column(String(255), nullable=True)
    
    # Address
    country = Column(String(100), default="Россия")
    region = Column(String(255), nullable=True)
    city = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    postal_code = Column(String(20), nullable=True)
    
    # Order details
    total_amount = Column(DECIMAL(10, 2), nullable=False, default=0)
    comment = Column(Text, nullable=True)
    internal_comment = Column(Text, nullable=True)
    
    # Status and assignment
    status_id = Column(Integer, ForeignKey("order_statuses.id"), nullable=False)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Source and tracking
    source = Column(String(20), default=OrderSource.LANDING)
    utm_source = Column(String(255), nullable=True)
    utm_medium = Column(String(255), nullable=True)
    utm_campaign = Column(String(255), nullable=True)
    utm_content = Column(String(255), nullable=True)
    utm_term = Column(String(255), nullable=True)
    
    # External IDs
    external_id = Column(String(255), nullable=True, index=True)
    webmaster_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Landing page
    landing_page_id = Column(Integer, ForeignKey("landing_pages.id"), nullable=True)
    landing_url = Column(String(500), nullable=True)
    
    # Shipping
    shipping_service = Column(String(100), nullable=True)
    shipping_cost = Column(DECIMAL(10, 2), default=0)
    tracking_number = Column(String(255), nullable=True, index=True)
    
    # Payment
    payment_method = Column(String(50), nullable=True)
    payment_status = Column(String(20), default="pending")
    paid_amount = Column(DECIMAL(10, 2), default=0)
    
    # Call center
    calls_count = Column(Integer, default=0)
    last_call_result = Column(String(20), nullable=True)
    next_call_at = Column(DateTime(timezone=True), nullable=True)
    call_attempts = Column(Integer, default=0)
    
    # Automation
    robot_processed = Column(Boolean, default=False)
    auto_actions_enabled = Column(Boolean, default=True)
    
    # Geography and time
    customer_timezone = Column(String(50), nullable=True)
    customer_local_time = Column(DateTime(timezone=True), nullable=True)
    
    # Custom fields
    custom_fields = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    status_updated_at = Column(DateTime(timezone=True), server_default=func.now())
    approved_at = Column(DateTime(timezone=True), nullable=True)
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    canceled_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    project = relationship("Project", back_populates="orders")
    status = relationship("OrderStatus", back_populates="orders")
    operator = relationship("User", back_populates="orders", foreign_keys=[operator_id])
    webmaster = relationship("User", foreign_keys=[webmaster_id])
    landing_page = relationship("LandingPage", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    history = relationship("OrderHistory", back_populates="order", cascade="all, delete-orphan")
    call_logs = relationship("CallLog", back_populates="order")
    
    # Indexes
    __table_args__ = (
        Index('idx_order_project_status', 'project_id', 'status_id'),
        Index('idx_order_project_created', 'project_id', 'created_at'),
        Index('idx_order_operator_status', 'operator_id', 'status_id'),
        Index('idx_order_next_call', 'next_call_at'),
    )
    
    def __repr__(self):
        return f"<Order(id={self.id}, customer='{self.customer_name}', phone='{self.customer_phone}')>"

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    quantity = Column(Integer, nullable=False, default=1)
    price = Column(DECIMAL(10, 2), nullable=False)
    total = Column(DECIMAL(10, 2), nullable=False)
    
    # Product snapshot (in case product changes)
    product_name = Column(String(255), nullable=False)
    product_sku = Column(String(100), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

class OrderHistory(Base):
    __tablename__ = "order_history"
    
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    action = Column(String(100), nullable=False)  # status_change, comment_added, call_made, etc.
    field_name = Column(String(100), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    comment = Column(Text, nullable=True)
    
    # Context
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    order = relationship("Order", back_populates="history")
    user = relationship("User")

class CallLog(Base):
    __tablename__ = "call_logs"
    
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Call details
    phone_number = Column(String(20), nullable=False)
    direction = Column(String(10), nullable=False)  # inbound, outbound
    result = Column(String(20), nullable=True)
    duration = Column(Integer, default=0)  # seconds
    
    # Recording
    recording_url = Column(String(500), nullable=True)
    recording_duration = Column(Integer, nullable=True)
    
    # External call ID from telephony provider
    external_call_id = Column(String(255), nullable=True, index=True)
    
    # Call costs
    cost = Column(DECIMAL(10, 4), nullable=True)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    project = relationship("Project")
    order = relationship("Order", back_populates="call_logs")
    operator = relationship("User", back_populates="call_logs")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Basic info
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    sku = Column(String(100), nullable=True, index=True)
    
    # Pricing
    price = Column(DECIMAL(10, 2), nullable=False)
    cost_price = Column(DECIMAL(10, 2), nullable=True)
    discount_price = Column(DECIMAL(10, 2), nullable=True)
    
    # Inventory
    track_inventory = Column(Boolean, default=True)
    stock_quantity = Column(Integer, default=0)
    reserved_quantity = Column(Integer, default=0)
    low_stock_threshold = Column(Integer, default=10)
    
    # Product details
    weight = Column(DECIMAL(8, 3), nullable=True)  # kg
    dimensions = Column(JSON, nullable=True)  # {"length": 10, "width": 5, "height": 3}
    
    # Images and files
    images = Column(JSON, default=list)  # List of image URLs
    documents = Column(JSON, default=list)  # List of document URLs
    
    # SEO and marketing
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(Text, nullable=True)
    tags = Column(JSON, default=list)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_digital = Column(Boolean, default=False)
    
    # Custom fields
    custom_fields = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    project = relationship("Project", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    stock_movements = relationship("StockMovement", back_populates="product")
    
    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}', price={self.price})>"

class StockMovement(Base):
    __tablename__ = "stock_movements"
    
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    movement_type = Column(String(20), nullable=False)  # in, out, reserved, released, adjustment
    quantity = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=True)
    
    # Stock before and after
    stock_before = Column(Integer, nullable=False)
    stock_after = Column(Integer, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    product = relationship("Product", back_populates="stock_movements")
    order = relationship("Order")
    user = relationship("User")