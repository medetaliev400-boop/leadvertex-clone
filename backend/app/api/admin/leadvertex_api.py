from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, and_, or_, desc, asc
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from app.core.database import get_async_db
from app.core.security import get_current_user, APIKeyAuth
from app.models.user import User, Project, OrderStatus
from app.models.order import Order, OrderHistory
from app.schemas.main import (
    ProjectInfo, StatusListItem, OrderCreate, OrderUpdate, OrderResponse,
    BaseResponse, PaginationParams
)
from app.utils.timezone import get_customer_timezone, convert_to_local_time

router = APIRouter()

# LeadVertex Compatible API Endpoints

@router.get("/getProjectInfo.html")
async def get_project_info(
    token: str = Query(..., description="API token"),
    db: AsyncSession = Depends(get_async_db)
):
    """Get project information - LeadVertex API compatible"""
    # Authenticate using API key
    auth = APIKeyAuth()
    auth_data = await auth(token, db)
    project = auth_data["project"]
    
    # Get today's statistics
    today = datetime.now().date()
    
    # Count today's orders
    stmt = select(func.count(Order.id)).where(
        and_(
            Order.project_id == project.id,
            func.date(Order.created_at) == today
        )
    )
    result = await db.execute(stmt)
    today_orders = result.scalar() or 0
    
    # Count today's accepted orders (orders in 'accepted' group)
    stmt = (
        select(func.count(Order.id))
        .join(OrderStatus)
        .where(
            and_(
                Order.project_id == project.id,
                func.date(Order.created_at) == today,
                OrderStatus.group == "accepted"
            )
        )
    )
    result = await db.execute(stmt)
    today_accepted = result.scalar() or 0
    
    # Count orders for current month
    from datetime import datetime
    current_month = datetime.now().replace(day=1)
    
    stmt = select(func.count(Order.id)).where(
        and_(
            Order.project_id == project.id,
            Order.created_at >= current_month
        )
    )
    result = await db.execute(stmt)
    orders_for_period = result.scalar() or 0
    
    # Format response like LeadVertex
    response = {
        str(project.id): {
            "name": project.name,
            "title": project.title or project.name,
            "tariff": project.tariff,
            "createdAt": project.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "activeTo": project.trial_ends_at.strftime("%Y-%m-%d %H:%M:%S") if project.trial_ends_at else None,
            "maxOrders": "unlimited" if project.is_unlimited_orders else str(project.max_orders_per_month),
            "ordersForThePeriod": orders_for_period,
            "todayOrders": today_orders,
            "todayAccepted": today_accepted
        }
    }
    
    return response

@router.get("/getStatusList.html")
async def get_status_list(
    token: str = Query(..., description="API token"),
    db: AsyncSession = Depends(get_async_db)
):
    """Get list of order statuses - LeadVertex API compatible"""
    # Authenticate using API key
    auth = APIKeyAuth()
    auth_data = await auth(token, db)
    project = auth_data["project"]
    
    # Get all statuses for project with order counts
    stmt = (
        select(
            OrderStatus,
            func.count(Order.id).label("order_count")
        )
        .outerjoin(Order, and_(
            Order.status_id == OrderStatus.id,
            Order.project_id == project.id
        ))
        .where(OrderStatus.project_id == project.id)
        .group_by(OrderStatus.id)
        .order_by(OrderStatus.position)
    )
    
    result = await db.execute(stmt)
    statuses_with_counts = result.all()
    
    # Format response like LeadVertex
    response = {}
    for i, (status, order_count) in enumerate(statuses_with_counts):
        response[str(i)] = {
            "name": status.name,
            "group": status.group,
            "orders": str(order_count or 0),
            "goodsQuantity": status.goods_quantity_action
        }
    
    return response

@router.get("/getOrdersIdsInStatus.html")
async def get_orders_ids_in_status(
    token: str = Query(..., description="API token"),
    status: int = Query(..., description="Status ID"),
    db: AsyncSession = Depends(get_async_db)
):
    """Get all order IDs in specific status - LeadVertex API compatible"""
    # Authenticate using API key
    auth = APIKeyAuth()
    auth_data = await auth(token, db)
    project = auth_data["project"]
    
    # Get order IDs in status
    stmt = select(Order.id).where(
        and_(
            Order.project_id == project.id,
            Order.status_id == status
        )
    ).order_by(Order.created_at.desc())
    
    result = await db.execute(stmt)
    order_ids = result.scalars().all()
    
    # Return as list of strings (LeadVertex format)
    return [str(order_id) for order_id in order_ids]

@router.get("/getOrdersIdsByCondition.html")
async def get_orders_ids_by_condition(
    token: str = Query(..., description="API token"),
    id: Optional[int] = Query(None, description="Order ID"),
    status: Optional[str] = Query(None, description="Status ID(s), comma-separated"),
    datetime: Optional[str] = Query(None, description="Order date and time"),
    dateFrom: Optional[str] = Query(None, description="Start date"),
    dateTo: Optional[str] = Query(None, description="End date"),
    dateUpdFrom: Optional[str] = Query(None, description="Status change start date"),
    dateUpdTo: Optional[str] = Query(None, description="Status change end date"),
    dateModFrom: Optional[str] = Query(None, description="Last modification start date"),
    dateModTo: Optional[str] = Query(None, description="Last modification end date"),
    approvedFrom: Optional[str] = Query(None, description="Approved orders start date"),
    approvedTo: Optional[str] = Query(None, description="Approved orders end date"),
    shippedFrom: Optional[str] = Query(None, description="Shipped orders start date"),
    shippedTo: Optional[str] = Query(None, description="Shipped orders end date"),
    canceledFrom: Optional[str] = Query(None, description="Canceled orders start date"),
    canceledTo: Optional[str] = Query(None, description="Canceled orders end date"),
    db: AsyncSession = Depends(get_async_db)
):
    """Search orders by various conditions - LeadVertex API compatible"""
    # Authenticate using API key
    auth = APIKeyAuth()
    auth_data = await auth(token, db)
    project = auth_data["project"]
    
    # Build query conditions
    conditions = [Order.project_id == project.id]
    
    if id:
        conditions.append(Order.id == id)
    
    if status:
        status_ids = [int(s.strip()) for s in status.split(",")]
        conditions.append(Order.status_id.in_(status_ids))
    
    if datetime:
        try:
            dt = datetime.strptime(datetime, "%Y-%m-%d %H:%M:%S")
            conditions.append(Order.created_at == dt)
        except ValueError:
            pass
    
    if dateFrom:
        try:
            dt = datetime.strptime(dateFrom, "%Y-%m-%d %H:%M:%S")
            conditions.append(Order.created_at >= dt)
        except ValueError:
            pass
    
    if dateTo:
        try:
            dt = datetime.strptime(dateTo, "%Y-%m-%d %H:%M:%S")
            conditions.append(Order.created_at <= dt)
        except ValueError:
            pass
    
    if dateUpdFrom:
        try:
            dt = datetime.strptime(dateUpdFrom, "%Y-%m-%d %H:%M:%S")
            conditions.append(Order.status_updated_at >= dt)
        except ValueError:
            pass
    
    if dateUpdTo:
        try:
            dt = datetime.strptime(dateUpdTo, "%Y-%m-%d %H:%M:%S")
            conditions.append(Order.status_updated_at <= dt)
        except ValueError:
            pass
    
    if dateModFrom:
        try:
            dt = datetime.strptime(dateModFrom, "%Y-%m-%d %H:%M:%S")
            conditions.append(Order.updated_at >= dt)
        except ValueError:
            pass
    
    if dateModTo:
        try:
            dt = datetime.strptime(dateModTo, "%Y-%m-%d %H:%M:%S")
            conditions.append(Order.updated_at <= dt)
        except ValueError:
            pass
    
    if approvedFrom:
        try:
            dt = datetime.strptime(approvedFrom, "%Y-%m-%d %H:%M:%S")
            conditions.append(Order.approved_at >= dt)
        except ValueError:
            pass
    
    if approvedTo:
        try:
            dt = datetime.strptime(approvedTo, "%Y-%m-%d %H:%M:%S")
            conditions.append(Order.approved_at <= dt)
        except ValueError:
            pass
    
    if shippedFrom:
        try:
            dt = datetime.strptime(shippedFrom, "%Y-%m-%d %H:%M:%S")
            conditions.append(Order.shipped_at >= dt)
        except ValueError:
            pass
    
    if shippedTo:
        try:
            dt = datetime.strptime(shippedTo, "%Y-%m-%d %H:%M:%S")
            conditions.append(Order.shipped_at <= dt)
        except ValueError:
            pass
    
    if canceledFrom:
        try:
            dt = datetime.strptime(canceledFrom, "%Y-%m-%d %H:%M:%S")
            conditions.append(Order.canceled_at >= dt)
        except ValueError:
            pass
    
    if canceledTo:
        try:
            dt = datetime.strptime(canceledTo, "%Y-%m-%d %H:%M:%S")
            conditions.append(Order.canceled_at <= dt)
        except ValueError:
            pass
    
    # Execute query
    stmt = select(Order.id).where(and_(*conditions)).order_by(Order.created_at.desc())
    result = await db.execute(stmt)
    order_ids = result.scalars().all()
    
    # Return as list of strings (LeadVertex format)
    return [str(order_id) for order_id in order_ids]

@router.get("/getOrder.html")
async def get_order(
    token: str = Query(..., description="API token"),
    id: int = Query(..., description="Order ID"),
    db: AsyncSession = Depends(get_async_db)
):
    """Get order details - LeadVertex API compatible"""
    # Authenticate using API key
    auth = APIKeyAuth()
    auth_data = await auth(token, db)
    project = auth_data["project"]
    
    # Get order with relations
    stmt = (
        select(Order)
        .options(
            selectinload(Order.status),
            selectinload(Order.operator),
            selectinload(Order.items)
        )
        .where(and_(Order.id == id, Order.project_id == project.id))
    )
    
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Format response like LeadVertex
    response = {
        "id": order.id,
        "externalId": order.external_id,
        "status": order.status.name if order.status else "",
        "statusId": order.status_id,
        "name": order.customer_name,
        "phone": order.customer_phone,
        "email": order.customer_email,
        "country": order.country,
        "region": order.region,
        "city": order.city,
        "address": order.address,
        "postalCode": order.postal_code,
        "comment": order.comment,
        "internalComment": order.internal_comment,
        "totalAmount": float(order.total_amount),
        "shippingCost": float(order.shipping_cost),
        "trackingNumber": order.tracking_number,
        "paymentMethod": order.payment_method,
        "paymentStatus": order.payment_status,
        "paidAmount": float(order.paid_amount),
        "source": order.source,
        "utmSource": order.utm_source,
        "utmMedium": order.utm_medium,
        "utmCampaign": order.utm_campaign,
        "utmContent": order.utm_content,
        "utmTerm": order.utm_term,
        "operatorId": order.operator_id,
        "operatorName": f"{order.operator.first_name} {order.operator.last_name}" if order.operator else None,
        "callsCount": order.calls_count,
        "lastCallResult": order.last_call_result,
        "nextCallAt": order.next_call_at.strftime("%Y-%m-%d %H:%M:%S") if order.next_call_at else None,
        "createdAt": order.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "updatedAt": order.updated_at.strftime("%Y-%m-%d %H:%M:%S") if order.updated_at else None,
        "statusUpdatedAt": order.status_updated_at.strftime("%Y-%m-%d %H:%M:%S"),
        "approvedAt": order.approved_at.strftime("%Y-%m-%d %H:%M:%S") if order.approved_at else None,
        "shippedAt": order.shipped_at.strftime("%Y-%m-%d %H:%M:%S") if order.shipped_at else None,
        "canceledAt": order.canceled_at.strftime("%Y-%m-%d %H:%M:%S") if order.canceled_at else None,
        "customFields": order.custom_fields,
        "items": [
            {
                "id": item.id,
                "productId": item.product_id,
                "productName": item.product_name,
                "productSku": item.product_sku,
                "quantity": item.quantity,
                "price": float(item.price),
                "total": float(item.total)
            }
            for item in order.items
        ]
    }
    
    return response

@router.post("/addOrder.html")
async def add_order(
    request: Request,
    token: str = Query(..., description="API token"),
    db: AsyncSession = Depends(get_async_db)
):
    """Add new order - LeadVertex API compatible"""
    # Authenticate using API key
    auth = APIKeyAuth()
    auth_data = await auth(token, db)
    project = auth_data["project"]
    
    # Get form data
    form_data = await request.form()
    
    # Required fields
    customer_name = form_data.get("name", "").strip()
    customer_phone = form_data.get("phone", "").strip()
    
    if not customer_name or not customer_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name and phone are required"
        )
    
    # Get default status (first processing status)
    stmt = (
        select(OrderStatus)
        .where(and_(
            OrderStatus.project_id == project.id,
            OrderStatus.group == "processing"
        ))
        .order_by(OrderStatus.position)
    )
    result = await db.execute(stmt)
    default_status = result.scalar_one_or_none()
    
    if not default_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No processing status found in project"
        )
    
    # Create order
    order_data = {
        "project_id": project.id,
        "customer_name": customer_name,
        "customer_phone": customer_phone,
        "customer_email": form_data.get("email"),
        "country": form_data.get("country", "Россия"),
        "region": form_data.get("region"),
        "city": form_data.get("city"),
        "address": form_data.get("address"),
        "postal_code": form_data.get("postalCode"),
        "comment": form_data.get("comment"),
        "total_amount": float(form_data.get("totalAmount", 0)),
        "status_id": default_status.id,
        "source": "api",
        "external_id": form_data.get("externalId"),
        "utm_source": form_data.get("utmSource"),
        "utm_medium": form_data.get("utmMedium"),
        "utm_campaign": form_data.get("utmCampaign"),
        "utm_content": form_data.get("utmContent"),
        "utm_term": form_data.get("utmTerm"),
        "landing_url": form_data.get("landingUrl"),
        "custom_fields": {}
    }
    
    # Add custom fields
    for key, value in form_data.items():
        if key.startswith("custom_"):
            order_data["custom_fields"][key] = value
    
    # Detect customer timezone
    if order_data["city"]:
        order_data["customer_timezone"] = get_customer_timezone(order_data["city"])
        if order_data["customer_timezone"]:
            order_data["customer_local_time"] = convert_to_local_time(
                datetime.utcnow(), 
                order_data["customer_timezone"]
            )
    
    db_order = Order(**order_data)
    db.add(db_order)
    await db.commit()
    await db.refresh(db_order)
    
    # Add to order history
    history = OrderHistory(
        order_id=db_order.id,
        action="order_created",
        comment="Order created via API"
    )
    db.add(history)
    await db.commit()
    
    # Return order ID (LeadVertex format)
    return {"id": db_order.id, "success": True}

@router.post("/updateOrder.html")
async def update_order(
    request: Request,
    token: str = Query(..., description="API token"),
    id: int = Query(..., description="Order ID"),
    db: AsyncSession = Depends(get_async_db)
):
    """Update order - LeadVertex API compatible"""
    # Authenticate using API key
    auth = APIKeyAuth()
    auth_data = await auth(token, db)
    project = auth_data["project"]
    
    # Get order
    stmt = select(Order).where(and_(Order.id == id, Order.project_id == project.id))
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Get form data
    form_data = await request.form()
    update_data = {}
    
    # Map form fields to order fields
    field_mapping = {
        "name": "customer_name",
        "phone": "customer_phone",
        "email": "customer_email",
        "country": "country",
        "region": "region", 
        "city": "city",
        "address": "address",
        "postalCode": "postal_code",
        "comment": "comment",
        "internalComment": "internal_comment",
        "totalAmount": "total_amount",
        "statusId": "status_id",
        "operatorId": "operator_id",
        "shippingService": "shipping_service",
        "shippingCost": "shipping_cost",
        "trackingNumber": "tracking_number",
        "paymentMethod": "payment_method",
        "paymentStatus": "payment_status",
        "paidAmount": "paid_amount",
        "externalId": "external_id"
    }
    
    # Track changes for history
    changes = []
    
    for form_field, db_field in field_mapping.items():
        if form_field in form_data:
            old_value = getattr(order, db_field)
            new_value = form_data[form_field]
            
            # Convert numeric fields
            if db_field in ["total_amount", "shipping_cost", "paid_amount"]:
                try:
                    new_value = float(new_value) if new_value else 0
                except ValueError:
                    continue
            elif db_field in ["status_id", "operator_id"]:
                try:
                    new_value = int(new_value) if new_value else None
                except ValueError:
                    continue
            
            if str(old_value) != str(new_value):
                update_data[db_field] = new_value
                changes.append({
                    "field": db_field,
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
        
        stmt = update(Order).where(Order.id == id).values(**update_data)
        await db.execute(stmt)
        await db.commit()
        
        # Add history entries
        for change in changes:
            history = OrderHistory(
                order_id=id,
                action="field_updated",
                field_name=change["field"],
                old_value=change["old_value"],
                new_value=change["new_value"],
                comment="Updated via API"
            )
            db.add(history)
        
        await db.commit()
    
    return {"success": True}

@router.post("/deleteOrder.html")
async def delete_order(
    token: str = Query(..., description="API token"),
    id: int = Query(..., description="Order ID"),
    db: AsyncSession = Depends(get_async_db)
):
    """Delete order - LeadVertex API compatible"""
    # Authenticate using API key
    auth = APIKeyAuth()
    auth_data = await auth(token, db)
    project = auth_data["project"]
    
    # Get order
    stmt = select(Order).where(and_(Order.id == id, Order.project_id == project.id))
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Delete order (cascade will handle related records)
    await db.delete(order)
    await db.commit()
    
    return {"success": True}