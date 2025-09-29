from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, DECIMAL, Enum as SQLEnum, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from enum import Enum
from app.core.database import Base

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

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile info
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    
    # System fields
    role = Column(SQLEnum(UserRole), default=UserRole.OPERATOR, nullable=False)
    status = Column(SQLEnum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    is_email_confirmed = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    
    # Settings
    settings = Column(JSON, default=dict)
    
    # Relations
    projects = relationship("ProjectUser", back_populates="user")
    created_projects = relationship("Project", back_populates="owner")
    orders = relationship("Order", back_populates="operator")
    call_logs = relationship("CallLog", back_populates="operator")
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    title = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    
    # Owner
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Project settings
    domain = Column(String(255), nullable=True)
    subdomain = Column(String(100), unique=True, nullable=True, index=True)
    
    # Tariff and limits
    tariff = Column(String(50), default="Free", nullable=False)
    max_orders_per_month = Column(Integer, default=100)
    is_unlimited_orders = Column(Boolean, default=False)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_trial = Column(Boolean, default=True)
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Settings and API
    api_key = Column(String(255), unique=True, nullable=True, index=True)
    webhook_url = Column(String(500), nullable=True)
    settings = Column(JSON, default=dict)
    
    # Relations
    owner = relationship("User", back_populates="created_projects")
    users = relationship("ProjectUser", back_populates="project")
    orders = relationship("Order", back_populates="project")
    products = relationship("Product", back_populates="project")
    statuses = relationship("OrderStatus", back_populates="project")
    landing_pages = relationship("LandingPage", back_populates="project")
    cpa_programs = relationship("CPAProgram", back_populates="project")
    
    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}', tariff='{self.tariff}')>"

class ProjectUser(Base):
    __tablename__ = "project_users"
    
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Permissions
    permissions = Column(JSON, default=dict)
    can_view_orders = Column(Boolean, default=True)
    can_edit_orders = Column(Boolean, default=False)
    can_delete_orders = Column(Boolean, default=False)
    can_view_statistics = Column(Boolean, default=False)
    can_manage_users = Column(Boolean, default=False)
    
    # Assignment settings for operators
    auto_assignment = Column(Boolean, default=True)
    max_orders_per_day = Column(Integer, default=100)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    project = relationship("Project", back_populates="users")
    user = relationship("User", back_populates="projects")
    
    __table_args__ = (
        UniqueConstraint('project_id', 'user_id', name='unique_project_user'),
    )

class OrderStatus(Base):
    __tablename__ = "order_statuses"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    name = Column(String(100), nullable=False)
    color = Column(String(7), default="#007bff")  # Hex color
    position = Column(Integer, default=0)
    
    # Status group affects behavior
    group = Column(String(20), nullable=False)  # processing, accepted, shipped, paid, canceled, return, spam
    
    # Warehouse actions
    goods_quantity_action = Column(Integer, default=0)  # 0=reset, -1=reserve, 1=return
    
    # Auto-transitions
    auto_transition_delay = Column(Integer, nullable=True)  # Minutes
    auto_transition_to_id = Column(Integer, ForeignKey("order_statuses.id"), nullable=True)
    
    # Notifications
    notify_client_sms = Column(Boolean, default=False)
    notify_client_email = Column(Boolean, default=False)
    sms_template = Column(Text, nullable=True)
    email_template = Column(Text, nullable=True)
    
    # System
    is_system = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    project = relationship("Project", back_populates="statuses")
    orders = relationship("Order", back_populates="status")
    auto_transition_to = relationship("OrderStatus", remote_side=[id])
    
    def __repr__(self):
        return f"<OrderStatus(id={self.id}, name='{self.name}', group='{self.group}')>"