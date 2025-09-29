# API endpoint для создания и управления проектами с поддоменами

from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import logging
import httpx
import json
from datetime import datetime

from app.core.database import get_async_session
from app.core.config import settings
from app.models.projects import Project, ProjectSettings
from app.schemas.projects import ProjectCreate, ProjectResponse, ProjectSubdomainCreate
from app.services.beget_dns import BegetDNSManager

router = APIRouter()
logger = logging.getLogger(__name__)

# Инициализируем менеджер DNS
dns_manager = BegetDNSManager()

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_async_session),
    request: Request = None
):
    """
    Создать новый проект
    Автоматически создает поддомен, если указан
    """
    try:
        # 1. Проверяем уникальность поддомена
        if project_data.subdomain:
            existing = await db.execute(
                select(Project).where(Project.subdomain == project_data.subdomain)
            )
            if existing.first():
                raise HTTPException(
                    status_code=400, 
                    detail=f"Subdomain '{project_data.subdomain}' already exists"
                )

        # 2. Создаем проект в БД
        new_project = Project(
            name=project_data.name,
            description=project_data.description,
            subdomain=project_data.subdomain,
            owner_id=1,  # TODO: получить из токена аутентификации
            status="active",
            created_at=datetime.utcnow()
        )
        
        db.add(new_project)
        await db.commit()
        await db.refresh(new_project)

        # 3. Создаем настройки проекта
        project_settings = ProjectSettings(
            project_id=new_project.id,
            theme=project_data.settings.get("theme", "default"),
            language=project_data.settings.get("language", "ru"),
            currency=project_data.settings.get("currency", "RUB"),
            timezone=project_data.settings.get("timezone", "Europe/Moscow")
        )
        
        db.add(project_settings)
        await db.commit()

        # 4. Создаем поддомен через DNS API (если указан)
        subdomain_created = False
        if project_data.subdomain:
            try:
                subdomain_created = await dns_manager.create_subdomain(
                    subdomain=project_data.subdomain,
                    ip=settings.FRONTEND_SERVER_IP
                )
                
                if subdomain_created:
                    # Обновляем статус поддомена в БД
                    new_project.subdomain_status = "created"
                    new_project.subdomain_created_at = datetime.utcnow()
                    await db.commit()
                    
                    logger.info(f"Subdomain created for project {new_project.id}: {project_data.subdomain}")
                else:
                    logger.error(f"Failed to create subdomain for project {new_project.id}")
                    new_project.subdomain_status = "failed"
                    await db.commit()
                    
            except Exception as e:
                logger.error(f"Error creating subdomain: {str(e)}")
                new_project.subdomain_status = "failed"
                await db.commit()

        # 5. Формируем ответ
        response_data = {
            "id": new_project.id,
            "name": new_project.name,
            "description": new_project.description,
            "subdomain": new_project.subdomain,
            "status": new_project.status,
            "created_at": new_project.created_at,
            "urls": {
                "admin": f"https://{settings.MAIN_DOMAIN}/projects/{new_project.id}",
                "public": f"https://{new_project.subdomain}.{settings.MAIN_DOMAIN}" if new_project.subdomain else None,
                "api": f"{settings.API_BASE_URL}/api/projects/{new_project.id}"
            },
            "subdomain_status": getattr(new_project, 'subdomain_status', None),
            "subdomain_created": subdomain_created
        }

        return response_data

    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")


@router.post("/{project_id}/subdomain")
async def create_project_subdomain(
    project_id: int,
    subdomain_data: ProjectSubdomainCreate,
    db: AsyncSession = Depends(get_async_session),
    request: Request = None
):
    """
    Создать поддомен для существующего проекта
    """
    try:
        # 1. Проверяем существование проекта
        project_result = await db.execute(select(Project).where(Project.id == project_id))
        project = project_result.first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = project[0]

        # 2. Проверяем, что у проекта еще нет поддомена
        if project.subdomain:
            raise HTTPException(
                status_code=400, 
                detail=f"Project already has subdomain: {project.subdomain}"
            )

        # 3. Проверяем уникальность поддомена
        existing = await db.execute(
            select(Project).where(Project.subdomain == subdomain_data.subdomain)
        )
        if existing.first():
            raise HTTPException(
                status_code=400, 
                detail=f"Subdomain '{subdomain_data.subdomain}' already exists"
            )

        # 4. Создаем поддомен через DNS API
        subdomain_created = await dns_manager.create_subdomain(
            subdomain=subdomain_data.subdomain,
            ip=settings.FRONTEND_SERVER_IP
        )

        if not subdomain_created:
            raise HTTPException(
                status_code=500, 
                detail="Failed to create DNS record for subdomain"
            )

        # 5. Обновляем проект в БД
        project.subdomain = subdomain_data.subdomain
        project.subdomain_status = "created"
        project.subdomain_created_at = datetime.utcnow()
        
        await db.commit()

        # 6. Возвращаем информацию о созданном поддомене
        return {
            "project_id": project_id,
            "subdomain": subdomain_data.subdomain,
            "full_domain": f"{subdomain_data.subdomain}.{settings.MAIN_DOMAIN}",
            "status": "created",
            "admin_url": f"https://{settings.MAIN_DOMAIN}/projects/{project_id}",
            "public_url": f"https://{subdomain_data.subdomain}.{settings.MAIN_DOMAIN}",
            "created_at": project.subdomain_created_at
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating subdomain for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create subdomain: {str(e)}")


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_async_session)
):
    """Получить список проектов"""
    try:
        result = await db.execute(
            select(Project).offset(skip).limit(limit).order_by(Project.created_at.desc())
        )
        projects = result.scalars().all()

        return [
            {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "subdomain": project.subdomain,
                "status": project.status,
                "created_at": project.created_at,
                "urls": {
                    "admin": f"https://{settings.MAIN_DOMAIN}/projects/{project.id}",
                    "public": f"https://{project.subdomain}.{settings.MAIN_DOMAIN}" if project.subdomain else None,
                    "api": f"{settings.API_BASE_URL}/api/projects/{project.id}"
                }
            }
            for project in projects
        ]

    except Exception as e:
        logger.error(f"Error listing projects: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch projects")


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_async_session),
    request: Request = None
):
    """Получить информацию о проекте"""
    try:
        # Определяем проект по ID или по поддомену
        project_info = await get_current_project(request)
        
        if project_info["type"] == "project" and project_info["project_id"]:
            # Запрос с поддомена - используем project_id из контекста
            project_id = project_info["project_id"]

        result = await db.execute(select(Project).where(Project.id == project_id))
        project = result.first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = project[0]

        return {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "subdomain": project.subdomain,
            "status": project.status,
            "created_at": project.created_at,
            "urls": {
                "admin": f"https://{settings.MAIN_DOMAIN}/projects/{project.id}",
                "public": f"https://{project.subdomain}.{settings.MAIN_DOMAIN}" if project.subdomain else None,
                "api": f"{settings.API_BASE_URL}/api/projects/{project.id}"
            },
            "request_context": project_info  # Для отладки
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch project")


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Удалить проект и его поддомен"""
    try:
        result = await db.execute(select(Project).where(Project.id == project_id))
        project = result.first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = project[0]

        # Удаляем поддомен через DNS API
        if project.subdomain:
            try:
                await dns_manager.delete_subdomain(project.subdomain)
                logger.info(f"Subdomain {project.subdomain} deleted for project {project_id}")
            except Exception as e:
                logger.error(f"Failed to delete subdomain: {str(e)}")

        # Удаляем проект из БД
        await db.delete(project)
        await db.commit()

        return {"message": f"Project {project_id} and its subdomain deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete project")


# Вспомогательная функция (импорт из main.py)
async def get_current_project(request: Request):
    """Получить информацию о текущем проекте из заголовков"""
    return {
        "type": getattr(request.state, "project_type", "admin"),
        "subdomain": getattr(request.state, "project_subdomain", ""),
        "domain": getattr(request.state, "project_domain", ""),
        "project_id": getattr(request.state, "project_id", None),
    }