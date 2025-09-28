from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from app.core.database import get_async_db
from app.core.security import get_current_user, get_current_admin, generate_api_key, Permission
from app.models.user import User, Project, ProjectUser, UserRole
from app.schemas.main import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectInfo,
    BaseResponse, PaginationParams, PaginatedResponse
)

router = APIRouter()

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Create a new project"""
    # Generate unique subdomain
    import re
    import random
    import string
    
    base_subdomain = re.sub(r'[^a-zA-Z0-9]', '', project_data.name.lower())
    subdomain = base_subdomain
    
    # Check subdomain uniqueness
    counter = 1
    while True:
        stmt = select(Project).where(Project.subdomain == subdomain)
        result = await db.execute(stmt)
        if not result.scalar_one_or_none():
            break
        subdomain = f"{base_subdomain}{counter}"
        counter += 1
    
    # Create project
    db_project = Project(
        name=project_data.name,
        title=project_data.title,
        description=project_data.description,
        domain=project_data.domain,
        subdomain=subdomain,
        owner_id=current_user.id,
        tariff=project_data.tariff,
        api_key=generate_api_key(),
        trial_ends_at=datetime.utcnow() + timedelta(days=14)
    )
    
    db.add(db_project)
    await db.commit()
    await db.refresh(db_project)
    
    # Add owner to project users
    project_user = ProjectUser(
        project_id=db_project.id,
        user_id=current_user.id,
        can_view_orders=True,
        can_edit_orders=True,
        can_delete_orders=True,
        can_view_statistics=True,
        can_manage_users=True
    )
    
    db.add(project_user)
    await db.commit()
    
    return db_project

@router.get("/", response_model=List[ProjectResponse])
async def get_user_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get all projects for current user"""
    if current_user.role == UserRole.ADMIN:
        # Admin can see all projects
        stmt = select(Project).options(selectinload(Project.owner))
    else:
        # Regular users see only their projects
        stmt = (
            select(Project)
            .join(ProjectUser)
            .where(ProjectUser.user_id == current_user.id)
            .options(selectinload(Project.owner))
        )
    
    result = await db.execute(stmt)
    projects = result.scalars().all()
    
    return projects

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get specific project"""
    await Permission.require_project_access(current_user, project_id, db)
    
    stmt = select(Project).where(Project.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Update project"""
    await Permission.require_project_access(current_user, project_id, db, "can_manage_users")
    
    # Get project
    stmt = select(Project).where(Project.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Update fields
    update_data = project_data.dict(exclude_unset=True)
    if update_data:
        stmt = update(Project).where(Project.id == project_id).values(**update_data)
        await db.execute(stmt)
        await db.commit()
        await db.refresh(project)
    
    return project

@router.delete("/{project_id}", response_model=BaseResponse)
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Delete project (only owner or admin)"""
    stmt = select(Project).where(Project.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check permissions
    if project.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner or admin can delete project"
        )
    
    await db.delete(project)
    await db.commit()
    
    return BaseResponse(message="Project deleted successfully")

@router.post("/{project_id}/regenerate-api-key", response_model=Dict[str, str])
async def regenerate_api_key(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Regenerate project API key"""
    await Permission.require_project_access(current_user, project_id, db, "can_manage_users")
    
    new_api_key = generate_api_key()
    
    stmt = update(Project).where(Project.id == project_id).values(api_key=new_api_key)
    await db.execute(stmt)
    await db.commit()
    
    return {"api_key": new_api_key}

@router.get("/{project_id}/users", response_model=List[Dict[str, Any]])
async def get_project_users(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get all users in project"""
    await Permission.require_project_access(current_user, project_id, db)
    
    stmt = (
        select(ProjectUser, User)
        .join(User)
        .where(ProjectUser.project_id == project_id)
    )
    
    result = await db.execute(stmt)
    project_users = result.all()
    
    users_data = []
    for project_user, user in project_users:
        users_data.append({
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "permissions": project_user.permissions,
            "can_view_orders": project_user.can_view_orders,
            "can_edit_orders": project_user.can_edit_orders,
            "can_delete_orders": project_user.can_delete_orders,
            "can_view_statistics": project_user.can_view_statistics,
            "can_manage_users": project_user.can_manage_users,
            "created_at": project_user.created_at
        })
    
    return users_data

@router.post("/{project_id}/users", response_model=BaseResponse)
async def add_user_to_project(
    project_id: int,
    user_email: str,
    permissions: Dict[str, bool] = {},
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Add user to project"""
    await Permission.require_project_access(current_user, project_id, db, "can_manage_users")
    
    # Find user by email
    stmt = select(User).where(User.email == user_email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user is already in project
    stmt = select(ProjectUser).where(
        ProjectUser.project_id == project_id,
        ProjectUser.user_id == user.id
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already in project"
        )
    
    # Add user to project
    project_user = ProjectUser(
        project_id=project_id,
        user_id=user.id,
        permissions=permissions,
        can_view_orders=permissions.get("can_view_orders", True),
        can_edit_orders=permissions.get("can_edit_orders", False),
        can_delete_orders=permissions.get("can_delete_orders", False),
        can_view_statistics=permissions.get("can_view_statistics", False),
        can_manage_users=permissions.get("can_manage_users", False)
    )
    
    db.add(project_user)
    await db.commit()
    
    return BaseResponse(message="User added to project successfully")

@router.delete("/{project_id}/users/{user_id}", response_model=BaseResponse)
async def remove_user_from_project(
    project_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Remove user from project"""
    await Permission.require_project_access(current_user, project_id, db, "can_manage_users")
    
    # Check if user is project owner
    stmt = select(Project).where(Project.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    
    if project and project.owner_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove project owner"
        )
    
    # Remove user from project
    stmt = select(ProjectUser).where(
        ProjectUser.project_id == project_id,
        ProjectUser.user_id == user_id
    )
    result = await db.execute(stmt)
    project_user = result.scalar_one_or_none()
    
    if not project_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not in project"
        )
    
    await db.delete(project_user)
    await db.commit()
    
    return BaseResponse(message="User removed from project successfully")