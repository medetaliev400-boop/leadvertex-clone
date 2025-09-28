from datetime import datetime, timedelta
from typing import Any, Union, Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.database import get_async_db
from app.models.user import User, UserRole
import secrets
import string

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Security
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def generate_api_key() -> str:
    """Generate a secure API key"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(64))

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(
            credentials.credentials, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {"user_id": user_id, "payload": payload}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(
    token_data: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_async_db)
) -> User:
    """Get current authenticated user"""
    user_id = token_data["user_id"]
    
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )
    
    return user

async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

async def get_current_operator(current_user: User = Depends(get_current_user)) -> User:
    """Require operator role or higher"""
    if current_user.role not in [UserRole.ADMIN, UserRole.OPERATOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operator access required"
        )
    return current_user

class APIKeyAuth:
    """API Key authentication for external integrations"""
    
    def __init__(self, required_project: bool = True):
        self.required_project = required_project
    
    async def __call__(
        self, 
        token: str,
        db: AsyncSession = Depends(get_async_db)
    ) -> dict:
        """Verify API key and return project info"""
        from app.models.user import Project
        
        stmt = select(Project).where(Project.api_key == token)
        result = await db.execute(stmt)
        project = result.scalar_one_or_none()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key"
            )
        
        if not project.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Project is inactive"
            )
        
        return {"project": project}

# Permission system
class Permission:
    """Permission checking utilities"""
    
    @staticmethod
    async def can_access_project(
        user: User, 
        project_id: int, 
        db: AsyncSession,
        required_permission: Optional[str] = None
    ) -> bool:
        """Check if user can access specific project"""
        from app.models.user import ProjectUser
        
        # Project owner always has access
        if user.role == UserRole.ADMIN:
            return True
        
        # Check project membership
        stmt = select(ProjectUser).where(
            ProjectUser.user_id == user.id,
            ProjectUser.project_id == project_id
        )
        result = await db.execute(stmt)
        project_user = result.scalar_one_or_none()
        
        if not project_user:
            return False
        
        # Check specific permission if required
        if required_permission:
            return project_user.permissions.get(required_permission, False)
        
        return True
    
    @staticmethod
    async def require_project_access(
        user: User,
        project_id: int,
        db: AsyncSession,
        permission: Optional[str] = None
    ):
        """Raise exception if user doesn't have project access"""
        has_access = await Permission.can_access_project(
            user, project_id, db, permission
        )
        
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this project"
            )