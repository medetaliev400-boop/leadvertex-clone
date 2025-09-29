# Обновленная FastAPI конфигурация для поддержки поддоменов

from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import logging
import time
from contextlib import asynccontextmanager
from typing import Optional

# Import API routers
from app.api.admin import auth, projects, orders, products, leadvertex_api
from app.core.config import settings
from app.core.database import async_engine, Base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting LeadVertex Clone application...")
    
    # Create database tables
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    logger.info("Database tables created successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    await async_engine.dispose()

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Full-featured CRM system clone of LeadVertex.ru",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# CORS middleware с поддержкой поддоменов
allowed_origins = [
    "https://moonline.pw",
    "https://www.moonline.pw",
]

# Добавляем wildcard поддомены, если не в production
if settings.DEBUG:
    allowed_origins.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"  # Для разработки
    ])
else:
    # В production используем regex для поддоменов
    import re
    
    class SubdomainCORSMiddleware(CORSMiddleware):
        def is_allowed_origin(self, origin: str) -> bool:
            if origin in self.allow_origins:
                return True
            
            # Проверяем поддомены
            subdomain_pattern = r"https://[a-zA-Z0-9-]+\.moonline\.com$"
            if re.match(subdomain_pattern, origin):
                return True
                
            return super().is_allowed_origin(origin)
    
    app.add_middleware(
        SubdomainCORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins if not settings.DEBUG else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Trusted host middleware с поддержкой поддоменов
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=[
            "moonline.pw", 
            "*.moonline.pw",
            "api.moonline.pw",
            "backend.moonline.pw"
        ]
    )

# Middleware для извлечения информации о проекте из заголовков
@app.middleware("http")
async def extract_project_info(request: Request, call_next):
    start_time = time.time()
    
    # Извлекаем информацию о проекте из заголовков
    project_domain = request.headers.get("x-project-domain", "")
    project_subdomain = request.headers.get("x-project-subdomain", "")
    original_host = request.headers.get("x-original-host", "")
    
    # Определяем тип проекта
    project_type = "admin"
    project_id = None
    
    if project_subdomain and project_subdomain != "www":
        project_type = "project"
        # Здесь можно добавить логику для получения project_id по subdomain
        # project_id = await get_project_by_subdomain(project_subdomain)
    
    # Добавляем информацию в state запроса
    request.state.project_type = project_type
    request.state.project_subdomain = project_subdomain
    request.state.project_domain = project_domain
    request.state.project_id = project_id
    
    response = await call_next(request)
    
    # Добавляем заголовки ответа
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Project-Type"] = project_type
    if project_subdomain:
        response.headers["X-Project-Subdomain"] = project_subdomain
    
    return response

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception on {request.url}: {str(exc)}", exc_info=True)
    
    if settings.DEBUG:
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "detail": str(exc),
                "path": str(request.url)
            }
        )
    else:
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )

# Функция для получения информации о проекте
async def get_current_project(request: Request):
    """Получить информацию о текущем проекте из заголовков"""
    return {
        "type": getattr(request.state, "project_type", "admin"),
        "subdomain": getattr(request.state, "project_subdomain", ""),
        "domain": getattr(request.state, "project_domain", ""),
        "project_id": getattr(request.state, "project_id", None),
    }

# Include API routers

# LeadVertex-compatible API (с поддержкой проектов)
app.include_router(
    leadvertex_api.router,
    prefix="/api/admin",
    tags=["LeadVertex Compatible API"]
)

# Modern REST API for admin panel
app.include_router(
    auth.router,
    prefix="/api/admin/auth",
    tags=["Authentication"]
)

app.include_router(
    projects.router,
    prefix="/api/admin/projects",
    tags=["Projects"]
)

app.include_router(
    orders.router,
    prefix="/api/admin/orders",
    tags=["Orders"]
)

app.include_router(
    products.router,
    prefix="/api/admin/products",
    tags=["Products"]
)

# API для создания поддоменов
@app.post("/api/admin/projects/{project_id}/subdomain")
async def create_project_subdomain(
    project_id: int, 
    subdomain: str,
    request: Request
):
    """
    Создать поддомен для проекта
    Этот endpoint будет вызываться при создании нового проекта
    """
    try:
        # 1. Проверяем, что поддомен доступен
        # 2. Сохраняем связь project_id <-> subdomain в БД
        # 3. Создаем DNS запись (через API хостинга)
        
        project_info = await get_current_project(request)
        
        # Пример логики создания поддомена
        result = {
            "project_id": project_id,
            "subdomain": subdomain,
            "full_domain": f"{subdomain}.moonline.pw",
            "status": "created",
            "admin_url": f"https://moonline.pw/projects/{project_id}",
            "public_url": f"https://{subdomain}.moonline.pw"
        }
        
        logger.info(f"Created subdomain {subdomain} for project {project_id}")
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to create subdomain: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to create subdomain: {str(e)}")

# Health check с информацией о проекте
@app.get("/health")
async def health_check(request: Request):
    """Health check endpoint"""
    project_info = await get_current_project(request)
    
    return {
        "status": "healthy",
        "version": settings.PROJECT_VERSION,
        "timestamp": time.time(),
        "project": project_info
    }

# Root endpoint с информацией о проекте
@app.get("/")
async def root(request: Request):
    """Root endpoint"""
    project_info = await get_current_project(request)
    
    return {
        "message": "LeadVertex Clone API",
        "version": settings.PROJECT_VERSION,
        "docs": "/api/docs" if settings.DEBUG else None,
        "project": project_info
    }

# Static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )