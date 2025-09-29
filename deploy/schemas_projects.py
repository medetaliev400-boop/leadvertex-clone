# Схемы данных для проектов с поддоменами

from pydantic import BaseModel, validator
from typing import Optional, Dict, Any
from datetime import datetime
import re

class ProjectSubdomainCreate(BaseModel):
    subdomain: str
    
    @validator('subdomain')
    def validate_subdomain(cls, v):
        # Проверяем формат поддомена
        if not re.match(r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$', v):
            raise ValueError('Subdomain must contain only letters, numbers and hyphens')
        
        if len(v) < 3:
            raise ValueError('Subdomain must be at least 3 characters long')
            
        if len(v) > 63:
            raise ValueError('Subdomain must not exceed 63 characters')
            
        # Запрещенные поддомены
        forbidden = ['www', 'api', 'admin', 'mail', 'ftp', 'test', 'dev', 'staging']
        if v.lower() in forbidden:
            raise ValueError(f'Subdomain "{v}" is reserved')
            
        return v.lower()

class ProjectSettings(BaseModel):
    theme: str = "default"
    language: str = "ru"
    currency: str = "RUB"
    timezone: str = "Europe/Moscow"
    
    class Config:
        extra = "allow"  # Разрешить дополнительные поля

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    subdomain: Optional[str] = None
    settings: Dict[str, Any] = {}
    
    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Project name must be at least 2 characters long')
        return v.strip()
    
    @validator('subdomain', pre=True, always=True)
    def validate_subdomain_optional(cls, v):
        if v is None or v == "":
            return None
        
        # Применяем те же правила, что и для ProjectSubdomainCreate
        if not re.match(r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$', v):
            raise ValueError('Subdomain must contain only letters, numbers and hyphens')
        
        if len(v) < 3:
            raise ValueError('Subdomain must be at least 3 characters long')
            
        if len(v) > 63:
            raise ValueError('Subdomain must not exceed 63 characters')
            
        forbidden = ['www', 'api', 'admin', 'mail', 'ftp', 'test', 'dev', 'staging']
        if v.lower() in forbidden:
            raise ValueError(f'Subdomain "{v}" is reserved')
            
        return v.lower()

class ProjectURLs(BaseModel):
    admin: str
    public: Optional[str] = None
    api: str

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    subdomain: Optional[str] = None
    status: str
    created_at: datetime
    urls: ProjectURLs
    subdomain_status: Optional[str] = None
    subdomain_created_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None and len(v.strip()) < 2:
            raise ValueError('Project name must be at least 2 characters long')
        return v.strip() if v else v
    
    @validator('status')
    def validate_status(cls, v):
        allowed_statuses = ['active', 'inactive', 'suspended', 'deleted']
        if v is not None and v not in allowed_statuses:
            raise ValueError(f'Status must be one of: {", ".join(allowed_statuses)}')
        return v

class ProjectSubdomainResponse(BaseModel):
    project_id: int
    subdomain: str
    full_domain: str
    status: str
    admin_url: str
    public_url: str
    created_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ProjectListResponse(BaseModel):
    projects: list[ProjectResponse]
    total: int
    page: int
    per_page: int
    pages: int

# Схема для статистики поддоменов
class SubdomainStats(BaseModel):
    total_projects: int
    active_subdomains: int
    pending_subdomains: int
    failed_subdomains: int
    most_popular_domains: list[str]

# Схема для проверки доступности поддомена
class SubdomainAvailability(BaseModel):
    subdomain: str
    available: bool
    reason: Optional[str] = None
    suggestions: list[str] = []