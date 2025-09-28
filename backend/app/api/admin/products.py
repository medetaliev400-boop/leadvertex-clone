from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, and_, or_, desc, asc
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from decimal import Decimal
from app.core.database import get_async_db
from app.core.security import get_current_user, Permission
from app.models.user import User
from app.models.order import Product, StockMovement, Order, OrderItem
from app.schemas.main import (
    ProductCreate, ProductUpdate, ProductResponse, BaseResponse,
    PaginationParams, PaginatedResponse
)

router = APIRouter()

@router.get("/", response_model=PaginatedResponse)
async def get_products(
    project_id: int = Query(...),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=1000),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    low_stock: Optional[bool] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get products with filtering and pagination"""
    await Permission.require_project_access(current_user, project_id, db)
    
    # Build conditions
    conditions = [Product.project_id == project_id]
    
    if search:
        search_conditions = [
            Product.name.ilike(f"%{search}%"),
            Product.description.ilike(f"%{search}%"),
            Product.sku.ilike(f"%{search}%")
        ]
        conditions.append(or_(*search_conditions))
    
    if is_active is not None:
        conditions.append(Product.is_active == is_active)
    
    if low_stock:
        conditions.append(Product.stock_quantity <= Product.low_stock_threshold)
    
    # Count total
    count_stmt = select(func.count(Product.id)).where(and_(*conditions))
    result = await db.execute(count_stmt)
    total = result.scalar()
    
    # Get products
    offset = (page - 1) * limit
    
    order_column = getattr(Product, sort_by, Product.created_at)
    if sort_order.lower() == "desc":
        order_clause = desc(order_column)
    else:
        order_clause = asc(order_column)
    
    stmt = (
        select(Product)
        .where(and_(*conditions))
        .order_by(order_clause)
        .offset(offset)
        .limit(limit)
    )
    
    result = await db.execute(stmt)
    products = result.scalars().all()
    
    pages = (total + limit - 1) // limit
    
    return PaginatedResponse(
        items=products,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get specific product"""
    stmt = select(Product).where(Product.id == product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    await Permission.require_project_access(current_user, product.project_id, db)
    
    return product

@router.post("/", response_model=ProductResponse)
async def create_product(
    project_id: int = Query(...),
    product_data: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Create new product"""
    await Permission.require_project_access(current_user, project_id, db, "can_edit_orders")
    
    # Check SKU uniqueness if provided
    if product_data.sku:
        stmt = select(Product).where(
            and_(
                Product.project_id == project_id,
                Product.sku == product_data.sku
            )
        )
        result = await db.execute(stmt)
        existing_product = result.scalar_one_or_none()
        
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product with this SKU already exists"
            )
    
    db_product = Product(
        project_id=project_id,
        **product_data.dict()
    )
    
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    
    # Create initial stock movement if stock quantity > 0
    if product_data.stock_quantity > 0:
        movement = StockMovement(
            product_id=db_product.id,
            user_id=current_user.id,
            movement_type="in",
            quantity=product_data.stock_quantity,
            reason="Initial stock",
            stock_before=0,
            stock_after=product_data.stock_quantity
        )
        db.add(movement)
        await db.commit()
    
    return db_product

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Update product"""
    # Get product
    stmt = select(Product).where(Product.id == product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    await Permission.require_project_access(current_user, product.project_id, db, "can_edit_orders")
    
    # Check SKU uniqueness if being updated
    if product_data.sku and product_data.sku != product.sku:
        stmt = select(Product).where(
            and_(
                Product.project_id == product.project_id,
                Product.sku == product_data.sku,
                Product.id != product_id
            )
        )
        result = await db.execute(stmt)
        existing_product = result.scalar_one_or_none()
        
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product with this SKU already exists"
            )
    
    # Handle stock quantity change
    old_stock = product.stock_quantity
    update_data = product_data.dict(exclude_unset=True)
    new_stock = update_data.get("stock_quantity")
    
    if new_stock is not None and new_stock != old_stock:
        # Create stock movement
        movement_type = "in" if new_stock > old_stock else "out"
        quantity = abs(new_stock - old_stock)
        
        movement = StockMovement(
            product_id=product_id,
            user_id=current_user.id,
            movement_type=movement_type,
            quantity=quantity,
            reason="Manual adjustment",
            stock_before=old_stock,
            stock_after=new_stock
        )
        db.add(movement)
    
    # Update product
    if update_data:
        update_data["updated_at"] = func.now()
        stmt = update(Product).where(Product.id == product_id).values(**update_data)
        await db.execute(stmt)
        await db.commit()
        await db.refresh(product)
    
    return product

@router.delete("/{product_id}", response_model=BaseResponse)
async def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Delete product"""
    # Get product
    stmt = select(Product).where(Product.id == product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    await Permission.require_project_access(current_user, product.project_id, db, "can_edit_orders")
    
    # Check if product is used in orders
    stmt = select(func.count(OrderItem.id)).where(OrderItem.product_id == product_id)
    result = await db.execute(stmt)
    order_count = result.scalar()
    
    if order_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete product used in {order_count} orders"
        )
    
    await db.delete(product)
    await db.commit()
    
    return BaseResponse(message="Product deleted successfully")

@router.post("/{product_id}/stock/adjust", response_model=BaseResponse)
async def adjust_stock(
    product_id: int,
    quantity: int,
    reason: str = "Manual adjustment",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Adjust product stock"""
    # Get product
    stmt = select(Product).where(Product.id == product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    await Permission.require_project_access(current_user, product.project_id, db, "can_edit_orders")
    
    if not product.track_inventory:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product does not track inventory"
        )
    
    old_stock = product.stock_quantity
    new_stock = max(0, old_stock + quantity)
    
    # Update stock
    stmt = update(Product).where(Product.id == product_id).values(
        stock_quantity=new_stock,
        updated_at=func.now()
    )
    await db.execute(stmt)
    
    # Create stock movement
    movement_type = "in" if quantity > 0 else "out"
    movement = StockMovement(
        product_id=product_id,
        user_id=current_user.id,
        movement_type=movement_type,
        quantity=abs(quantity),
        reason=reason,
        stock_before=old_stock,
        stock_after=new_stock
    )
    db.add(movement)
    await db.commit()
    
    return BaseResponse(message=f"Stock adjusted from {old_stock} to {new_stock}")

@router.get("/{product_id}/stock/movements", response_model=List[Dict[str, Any]])
async def get_stock_movements(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get stock movement history for product"""
    # Get product
    stmt = select(Product).where(Product.id == product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    await Permission.require_project_access(current_user, product.project_id, db)
    
    # Get movements with user and order info
    stmt = (
        select(StockMovement, User, Order)
        .outerjoin(User, StockMovement.user_id == User.id)
        .outerjoin(Order, StockMovement.order_id == Order.id)
        .where(StockMovement.product_id == product_id)
        .order_by(desc(StockMovement.created_at))
    )
    
    result = await db.execute(stmt)
    movements = result.all()
    
    movement_data = []
    for movement, user, order in movements:
        movement_data.append({
            "id": movement.id,
            "movement_type": movement.movement_type,
            "quantity": movement.quantity,
            "reason": movement.reason,
            "stock_before": movement.stock_before,
            "stock_after": movement.stock_after,
            "created_at": movement.created_at,
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name
            } if user else None,
            "order": {
                "id": order.id,
                "customer_name": order.customer_name
            } if order else None
        })
    
    return movement_data

@router.get("/{product_id}/statistics", response_model=Dict[str, Any])
async def get_product_statistics(
    product_id: int,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get product statistics"""
    # Get product
    stmt = select(Product).where(Product.id == product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    await Permission.require_project_access(current_user, product.project_id, db)
    
    from datetime import datetime, timedelta
    date_from = datetime.now() - timedelta(days=days)
    
    # Total orders with this product
    stmt = (
        select(
            func.count(OrderItem.id).label("total_orders"),
            func.sum(OrderItem.quantity).label("total_quantity"),
            func.sum(OrderItem.total).label("total_revenue")
        )
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            and_(
                OrderItem.product_id == product_id,
                Order.created_at >= date_from
            )
        )
    )
    
    result = await db.execute(stmt)
    stats = result.first()
    
    # Stock movements
    stmt = (
        select(
            func.sum(func.case((StockMovement.movement_type == "in", StockMovement.quantity), else_=0)).label("stock_in"),
            func.sum(func.case((StockMovement.movement_type == "out", StockMovement.quantity), else_=0)).label("stock_out")
        )
        .where(
            and_(
                StockMovement.product_id == product_id,
                StockMovement.created_at >= date_from
            )
        )
    )
    
    result = await db.execute(stmt)
    stock_stats = result.first()
    
    return {
        "period_days": days,
        "current_stock": product.stock_quantity,
        "reserved_stock": product.reserved_quantity,
        "available_stock": product.stock_quantity - product.reserved_quantity,
        "low_stock_threshold": product.low_stock_threshold,
        "is_low_stock": product.stock_quantity <= product.low_stock_threshold,
        "orders": {
            "total_orders": stats.total_orders or 0,
            "total_quantity_sold": stats.total_quantity or 0,
            "total_revenue": float(stats.total_revenue or 0)
        },
        "stock_movements": {
            "stock_in": stock_stats.stock_in or 0,
            "stock_out": stock_stats.stock_out or 0
        }
    }

@router.get("/low-stock", response_model=List[ProductResponse])
async def get_low_stock_products(
    project_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get products with low stock"""
    await Permission.require_project_access(current_user, project_id, db)
    
    stmt = (
        select(Product)
        .where(
            and_(
                Product.project_id == project_id,
                Product.track_inventory == True,
                Product.is_active == True,
                Product.stock_quantity <= Product.low_stock_threshold
            )
        )
        .order_by(asc(Product.stock_quantity))
    )
    
    result = await db.execute(stmt)
    products = result.scalars().all()
    
    return products