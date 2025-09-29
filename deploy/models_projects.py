# Модели базы данных для проектов с поддоменами

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from app.core.database import Base

class Project(Base):
    __tablename__ = "projects"
    
    # Основные поля
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Поддомен
    subdomain = Column(String(63), unique=True, nullable=True, index=True)
    subdomain_status = Column(String(20), default="pending")  # pending, created, failed
    subdomain_created_at = Column(DateTime, nullable=True)
    
    # Владелец и статус
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(20), default="active", index=True)  # active, inactive, suspended, deleted
    
    # Временные метки
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Связи
    owner = relationship("User", back_populates="projects")
    settings = relationship("ProjectSettings", back_populates="project", uselist=False)
    orders = relationship("Order", back_populates="project")
    products = relationship("Product", back_populates="project")
    
    # Индексы для поиска
    __table_args__ = (
        Index('ix_project_owner_status', 'owner_id', 'status'),
        Index('ix_project_subdomain_status', 'subdomain', 'subdomain_status'),
    )

class ProjectSettings(Base):
    __tablename__ = "project_settings"
    
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Основные настройки
    theme = Column(String(50), default="default")
    language = Column(String(5), default="ru")
    currency = Column(String(3), default="RUB")
    timezone = Column(String(50), default="Europe/Moscow")
    
    # Настройки интеграций
    payment_methods = Column(JSON, default=dict)  # Настройки платежных систем
    delivery_services = Column(JSON, default=dict)  # Настройки служб доставки
    analytics_codes = Column(JSON, default=dict)  # Коды аналитики (GA, Yandex.Metrica)
    
    # SEO настройки
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(Text, nullable=True)
    meta_keywords = Column(Text, nullable=True)
    
    # Настройки домена
    custom_domain = Column(String(255), nullable=True)  # Собственный домен
    ssl_enabled = Column(Boolean, default=True)
    
    # Дополнительные настройки (JSON)
    additional_settings = Column(JSON, default=dict)
    
    # Временные метки
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Связи
    project = relationship("Project", back_populates="settings")

class SubdomainHistory(Base):
    __tablename__ = "subdomain_history"
    
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Информация о поддомене
    subdomain = Column(String(63), nullable=False)
    action = Column(String(20), nullable=False)  # created, updated, deleted
    status = Column(String(20), nullable=False)  # success, failed, pending
    
    # Детали операции
    dns_provider = Column(String(50), default="beget")
    ip_address = Column(String(45), nullable=True)  # IPv4 или IPv6
    error_message = Column(Text, nullable=True)
    
    # Метаданные
    user_agent = Column(String(255), nullable=True)
    ip_requester = Column(String(45), nullable=True)
    
    # Временные метки
    created_at = Column(DateTime, default=func.now())
    
    # Связи
    project = relationship("Project")
    
    # Индексы
    __table_args__ = (
        Index('ix_subdomain_history_project_action', 'project_id', 'action'),
        Index('ix_subdomain_history_status_created', 'status', 'created_at'),
    )

class ProjectDomain(Base):
    __tablename__ = "project_domains"
    
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Информация о домене
    domain = Column(String(255), nullable=False, unique=True)
    domain_type = Column(String(20), nullable=False)  # subdomain, custom, alias
    
    # Статус домена
    status = Column(String(20), default="active")  # active, inactive, pending, failed
    ssl_status = Column(String(20), default="pending")  # pending, active, failed, expired
    ssl_expires_at = Column(DateTime, nullable=True)
    
    # DNS настройки
    dns_provider = Column(String(50), default="beget")
    nameservers = Column(JSON, default=list)
    dns_records = Column(JSON, default=dict)
    
    # Верификация
    verified = Column(Boolean, default=False)
    verification_code = Column(String(100), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    # Временные метки
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Связи
    project = relationship("Project")
    
    # Индексы
    __table_args__ = (
        Index('ix_project_domains_project_type', 'project_id', 'domain_type'),
        Index('ix_project_domains_status', 'status'),
    )

# Модель пользователя (базовая)
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=True)
    full_name = Column(String(255), nullable=True)
    
    # Аутентификация
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    
    # Лимиты
    max_projects = Column(Integer, default=10)
    max_subdomains = Column(Integer, default=10)
    
    # Временные метки
    created_at = Column(DateTime, default=func.now())
    last_login_at = Column(DateTime, nullable=True)
    
    # Связи
    projects = relationship("Project", back_populates="owner")

# Добавляем недостающие модели для полной функциональности
class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Основная информация о заказе
    order_number = Column(String(50), unique=True, nullable=False)
    status = Column(String(20), default="new")
    
    # Связи
    project = relationship("Project", back_populates="orders")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Основная информация о продукте
    name = Column(String(255), nullable=False)
    price = Column(Integer, nullable=False)  # В копейках
    
    # Связи
    project = relationship("Project", back_populates="products")