from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, and_, or_, desc, asc, text
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.core.database import get_async_db
from app.core.security import get_current_user, Permission
from app.models.user import User, OrderStatus
from app.models.order import Order, OrderItem, OrderHistory, Product
from app.schemas.main import (
    OrderCreate, OrderUpdate, OrderResponse, OrderStatusCreate, 
    OrderStatusUpdate, OrderStatusResponse, BaseResponse, 
    PaginationParams, PaginatedResponse
)

router = APIRouter()

# Order Status Management

@router.get("/statuses", response_model=List[OrderStatusResponse])
async def get_order_statuses(
    project_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get all order statuses for project"""
    await Permission.require_project_access(current_user, project_id, db)
    
    stmt = (
        select(OrderStatus)
        .where(OrderStatus.project_id == project_id)
        .order_by(OrderStatus.position)
    )
    
    result = await db.execute(stmt)
    statuses = result.scalars().all()
    
    return statuses

@router.post("/statuses", response_model=OrderStatusResponse)
async def create_order_status(
    status_data: OrderStatusCreate,
    project_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Create new order status"""
    await Permission.require_project_access(current_user, project_id, db, "can_manage_users")
    
    # Get max position
    stmt = select(func.max(OrderStatus.position)).where(OrderStatus.project_id == project_id)
    result = await db.execute(stmt)
    max_position = result.scalar() or 0
    
    db_status = OrderStatus(
        project_id=project_id,
        name=status_data.name,
        color=status_data.color,
        group=status_data.group,
        position=max_position + 1,
        goods_quantity_action=status_data.goods_quantity_action,
        notify_client_sms=status_data.notify_client_sms,
        notify_client_email=status_data.notify_client_email,
        sms_template=status_data.sms_template,
        email_template=status_data.email_template
    )
    
    db.add(db_status)
    await db.commit()
    await db.refresh(db_status)
    
    return db_status

@router.put("/statuses/{status_id}", response_model=OrderStatusResponse)
async def update_order_status(
    status_id: int,
    status_data: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Update order status"""
    # Get status and check project access
    stmt = select(OrderStatus).where(OrderStatus.id == status_id)
    result = await db.execute(stmt)
    status = result.scalar_one_or_none()
    
    if not status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Status not found"
        )
    
    await Permission.require_project_access(current_user, status.project_id, db, "can_manage_users")
    
    # Update fields
    update_data = status_data.dict(exclude_unset=True)
    if update_data:
        stmt = update(OrderStatus).where(OrderStatus.id == status_id).values(**update_data)
        await db.execute(stmt)
        await db.commit()
        await db.refresh(status)
    
    return status

@router.delete("/statuses/{status_id}", response_model=BaseResponse)
async def delete_order_status(
    status_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Delete order status"""
    # Get status and check project access
    stmt = select(OrderStatus).where(OrderStatus.id == status_id)
    result = await db.execute(stmt)
    status = result.scalar_one_or_none()
    
    if not status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Status not found"
        )
    
    await Permission.require_project_access(current_user, status.project_id, db, "can_manage_users")
    
    # Check if status has orders
    stmt = select(func.count(Order.id)).where(Order.status_id == status_id)
    result = await db.execute(stmt)
    order_count = result.scalar()
    
    if order_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete status with {order_count} orders"
        )
    
    await db.delete(status)
    await db.commit()
    
    return BaseResponse(message="Status deleted successfully")

# Order Management

@router.get("/", response_model=PaginatedResponse)
async def get_orders(
    project_id: int = Query(...),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=1000),
    status_id: Optional[int] = Query(None),
    operator_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get orders with filtering and pagination"""
    await Permission.require_project_access(current_user, project_id, db, "can_view_orders")
    
    # Build base query
    conditions = [Order.project_id == project_id]
    
    if status_id:
        conditions.append(Order.status_id == status_id)
    
    if operator_id:
        conditions.append(Order.operator_id == operator_id)
    
    if search:
        search_conditions = [
            Order.customer_name.ilike(f"%{search}%"),
            Order.customer_phone.ilike(f"%{search}%"),
            Order.customer_email.ilike(f"%{search}%"),
            Order.id == int(search) if search.isdigit() else False
        ]
        conditions.append(or_(*search_conditions))
    
    if date_from:
        conditions.append(Order.created_at >= date_from)
    
    if date_to:
        conditions.append(Order.created_at <= date_to)
    
    # Count total orders
    count_stmt = select(func.count(Order.id)).where(and_(*conditions))
    result = await db.execute(count_stmt)
    total = result.scalar()
    
    # Get orders with pagination
    offset = (page - 1) * limit
    
    # Build order by clause
    order_column = getattr(Order, sort_by, Order.created_at)
    if sort_order.lower() == "desc":
        order_clause = desc(order_column)
    else:
        order_clause = asc(order_column)
    
    stmt = (
        select(Order)
        .options(
            selectinload(Order.status),
            selectinload(Order.operator),
            selectinload(Order.items)
        )
        .where(and_(*conditions))
        .order_by(order_clause)
        .offset(offset)
        .limit(limit)
    )
    
    result = await db.execute(stmt)
    orders = result.scalars().all()
    
    # Calculate pagination info
    pages = (total + limit - 1) // limit
    
    return PaginatedResponse(
        items=orders,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get specific order"""
    stmt = (
        select(Order)
        .options(
            selectinload(Order.status),
            selectinload(Order.operator),
            selectinload(Order.items),
            selectinload(Order.history)
        )
        .where(Order.id == order_id)
    )
    
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    await Permission.require_project_access(current_user, order.project_id, db, "can_view_orders")
    
    return order

@router.post("/", response_model=OrderResponse)
async def create_order(
    project_id: int = Query(...),
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Create new order"""
    await Permission.require_project_access(current_user, project_id, db, "can_edit_orders")
    
    # Get default status if not provided
    status_id = order_data.status_id
    if not status_id:
        stmt = (
            select(OrderStatus)
            .where(and_(
                OrderStatus.project_id == project_id,
                OrderStatus.group == "processing"
            ))
            .order_by(OrderStatus.position)
        )
        result = await db.execute(stmt)
        default_status = result.scalar_one_or_none()
        
        if not default_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No default status found"
            )
        
        status_id = default_status.id
    
    # Create order
    db_order = Order(
        project_id=project_id,
        status_id=status_id,
        operator_id=current_user.id,
        source="manual",
        **order_data.dict(exclude={"status_id"})
    )
    
    db.add(db_order)
    await db.commit()
    await db.refresh(db_order)
    
    # Add to history
    history = OrderHistory(
        order_id=db_order.id,
        user_id=current_user.id,
        action="order_created",
        comment="Order created manually"
    )
    db.add(history)
    await db.commit()
    
    # Reload with relations
    stmt = (
        select(Order)
        .options(
            selectinload(Order.status),
            selectinload(Order.operator),
            selectinload(Order.items)
        )
        .where(Order.id == db_order.id)
    )
    
    result = await db.execute(stmt)
    order = result.scalar_one()
    
    return order

@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: int,
    order_data: OrderUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Update order"""
    # Get order
    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    await Permission.require_project_access(current_user, order.project_id, db, "can_edit_orders")
    
    # Track changes for history
    changes = []
    update_data = order_data.dict(exclude_unset=True)
    
    for field, new_value in update_data.items():
        old_value = getattr(order, field)
        if old_value != new_value:
            changes.append({
                "field": field,
                "old_value": str(old_value) if old_value else None,
                "new_value": str(new_value) if new_value else None
            })
    
    # Update order
    if update_data:
        update_data["updated_at"] = func.now()
        
        # Update status timestamp if status changed
        if "status_id" in update_data:
            update_data["status_updated_at"] = func.now()
            
            # Set approved/shipped/canceled timestamps based on status group
            stmt = select(OrderStatus).where(OrderStatus.id == update_data["status_id"])
            result = await db.execute(stmt)
            new_status = result.scalar_one_or_none()
            
            if new_status:
                if new_status.group == "accepted" and not order.approved_at:
                    update_data["approved_at"] = func.now()
                elif new_status.group == "shipped" and not order.shipped_at:
                    update_data["shipped_at"] = func.now()
                elif new_status.group in ["canceled", "return", "spam"] and not order.canceled_at:
                    update_data["canceled_at"] = func.now()
        
        stmt = update(Order).where(Order.id == order_id).values(**update_data)
        await db.execute(stmt)
        await db.commit()
        
        # Add history entries
        for change in changes:
            history = OrderHistory(
                order_id=order_id,
                user_id=current_user.id,
                action="field_updated",
                field_name=change["field"],
                old_value=change["old_value"],
                new_value=change["new_value"]
            )
            db.add(history)
        
        await db.commit()
    
    # Reload with relations
    stmt = (
        select(Order)
        .options(
            selectinload(Order.status),
            selectinload(Order.operator),
            selectinload(Order.items)
        )
        .where(Order.id == order_id)
    )
    
    result = await db.execute(stmt)
    order = result.scalar_one()
    
    return order

@router.delete("/{order_id}", response_model=BaseResponse)
async def delete_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Delete order"""
    # Get order
    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    await Permission.require_project_access(current_user, order.project_id, db, "can_delete_orders")
    
    # Add to history before deletion
    history = OrderHistory(
        order_id=order_id,
        user_id=current_user.id,
        action="order_deleted",
        comment="Order deleted"
    )
    db.add(history)
    await db.commit()
    
    await db.delete(order)
    await db.commit()
    
    return BaseResponse(message="Order deleted successfully")

@router.post("/{order_id}/assign", response_model=BaseResponse)
async def assign_order(
    order_id: int,
    operator_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Assign order to operator"""
    # Get order
    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    await Permission.require_project_access(current_user, order.project_id, db, "can_edit_orders")
    
    # Verify operator has access to project
    await Permission.require_project_access(
        await get_user_by_id(operator_id, db), 
        order.project_id, 
        db
    )
    
    # Update assignment
    old_operator_id = order.operator_id
    stmt = update(Order).where(Order.id == order_id).values(
        operator_id=operator_id,
        updated_at=func.now()
    )
    await db.execute(stmt)
    await db.commit()
    
    # Add to history
    history = OrderHistory(
        order_id=order_id,
        user_id=current_user.id,
        action="operator_assigned",
        old_value=str(old_operator_id) if old_operator_id else None,
        new_value=str(operator_id)
    )
    db.add(history)
    await db.commit()
    
    return BaseResponse(message="Order assigned successfully")

@router.get("/{order_id}/history", response_model=List[Dict[str, Any]])
async def get_order_history(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get order history"""
    # Get order to check access
    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    await Permission.require_project_access(current_user, order.project_id, db, "can_view_orders")
    
    # Get history with user info
    stmt = (
        select(OrderHistory, User)
        .outerjoin(User, OrderHistory.user_id == User.id)
        .where(OrderHistory.order_id == order_id)
        .order_by(desc(OrderHistory.created_at))
    )
    
    result = await db.execute(stmt)
    history_items = result.all()
    
    history_data = []
    for history, user in history_items:
        history_data.append({
            "id": history.id,
            "action": history.action,
            "field_name": history.field_name,
            "old_value": history.old_value,
            "new_value": history.new_value,
            "comment": history.comment,
            "created_at": history.created_at,
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name
            } if user else None
        })
    
    return history_data

async def get_user_by_id(user_id: int, db: AsyncSession) -> User:
    """Helper function to get user by ID"""
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user