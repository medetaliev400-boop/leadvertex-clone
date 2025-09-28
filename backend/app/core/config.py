from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://leadvertex:leadvertex123@localhost/leadvertex"
    DATABASE_URL_SYNC: str = "postgresql://leadvertex:leadvertex123@localhost/leadvertex"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    # Security
    SECRET_KEY: str = "leadvertex-super-secret-key-2025"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"
    
    # API Settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "LeadVertex Clone"
    PROJECT_VERSION: str = "1.0.0"
    
    # File uploads
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # External API Keys
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # SMS Providers
    SMS_RU_API_ID: Optional[str] = None
    SMSC_LOGIN: Optional[str] = None
    SMSC_PASSWORD: Optional[str] = None
    
    # Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    
    # Telephony
    ASTERISK_HOST: Optional[str] = None
    ASTERISK_PORT: int = 5038
    ASTERISK_USERNAME: Optional[str] = None
    ASTERISK_SECRET: Optional[str] = None
    
    # External Services
    CDEK_CLIENT_ID: Optional[str] = None
    CDEK_CLIENT_SECRET: Optional[str] = None
    RUSSIANPOST_TOKEN: Optional[str] = None
    BOXBERRY_TOKEN: Optional[str] = None
    
    # Development
    DEBUG: bool = True
    TESTING: bool = False
    
    class Config:
        env_file = ".env"

settings = Settings()