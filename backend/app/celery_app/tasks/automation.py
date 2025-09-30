from celery import Task
from sqlalchemy import select, update, and_, func
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging

from app.celery_app.celery import celery_app
from app.core.database import SessionLocal
from app.models.user import User, Project, OrderStatus
from app.models.order import Order, OrderHistory
from app.models.cpa import AutomationRule, AutomationExecution, SMSTemplate, SMSMessage
from app.utils.email import send_order_notification_email
from app.utils.timezone import get_working_hours_status

logger = logging.getLogger(__name__)

class DatabaseTask(Task):
    """Base task class with database session"""
    
    def __call__(self, *args, **kwargs):
        with SessionLocal() as db:
            return self.run(db, *args, **kwargs)
    
    def run(self, db, *args, **kwargs):
        raise NotImplementedError

@celery_app.task(bind=True)
def process_automation_rules(self):
    """Process automation rules for all projects"""
    try:
        with SessionLocal() as db:
            # Get all active automation rules
            stmt = (
                select(AutomationRule)
                .where(AutomationRule.is_active == True)
                .order_by(AutomationRule.priority.desc())
            )
            rules = db.execute(stmt).scalars().all()
            
            processed_count = 0
            
            for rule in rules:
                try:
                    processed = process_single_automation_rule(db, rule)
                    processed_count += processed
                    
                    # Update rule execution stats
                    stmt = update(AutomationRule).where(
                        AutomationRule.id == rule.id
                    ).values(
                        executions_count=AutomationRule.executions_count + processed,
                        last_executed_at=func.now()
                    )
                    db.execute(stmt)
                    
                except Exception as e:
                    logger.error(f"Error processing automation rule {rule.id}: {str(e)}")
            
            db.commit()
            logger.info(f"Processed {processed_count} automation rule executions")
            
            return {"processed_rules": len(rules), "executions": processed_count}
        
    except Exception as e:
        logger.error(f"Error in process_automation_rules: {str(e)}")
        raise

def process_single_automation_rule(db, rule: AutomationRule) -> int:
    """Process a single automation rule"""
    trigger_type = rule.trigger_conditions.get("type")
    processed = 0
    
    if trigger_type == "status_change":
        processed = process_status_change_trigger(db, rule)
    elif trigger_type == "time_delay":
        processed = process_time_delay_trigger(db, rule)
    elif trigger_type == "order_created":
        processed = process_order_created_trigger(db, rule)
    elif trigger_type == "no_call_response":
        processed = process_no_call_response_trigger(db, rule)
    
    return processed

def process_status_change_trigger(db, rule: AutomationRule) -> int:
    """Process status change trigger"""
    conditions = rule.trigger_conditions
    from_status_id = conditions.get("from_status_id")
    to_status_id = conditions.get("to_status_id")
    
    # Find orders that changed to the target status recently
    time_threshold = datetime.now() - timedelta(minutes=5)  # Last 5 minutes
    
    query_conditions = [
        Order.project_id == rule.project_id,
        Order.status_updated_at >= time_threshold
    ]
    
    if to_status_id:
        query_conditions.append(Order.status_id == to_status_id)
    
    stmt = select(Order).where(and_(*query_conditions))
    orders = db.execute(stmt).scalars().all()
    
    processed = 0
    for order in orders:
        # Check if we already processed this order for this rule
        stmt = select(AutomationExecution).where(
            and_(
                AutomationExecution.rule_id == rule.id,
                AutomationExecution.order_id == order.id,
                AutomationExecution.status == "completed"
            )
        )
        existing = db.execute(stmt).scalar_one_or_none()
        
        if not existing:
            execute_automation_actions(db, rule, order)
            processed += 1
    
    return processed

def process_time_delay_trigger(db, rule: AutomationRule) -> int:
    """Process time delay trigger"""
    conditions = rule.trigger_conditions
    delay_minutes = conditions.get("delay_minutes", 60)
    status_id = conditions.get("status_id")
    
    # Find orders in status for the specified time
    time_threshold = datetime.now() - timedelta(minutes=delay_minutes)
    
    query_conditions = [
        Order.project_id == rule.project_id,
        Order.status_updated_at <= time_threshold
    ]
    
    if status_id:
        query_conditions.append(Order.status_id == status_id)
    
    stmt = select(Order).where(and_(*query_conditions))
    orders = db.execute(stmt).scalars().all()
    
    processed = 0
    for order in orders:
        # Check if already processed
        stmt = select(AutomationExecution).where(
            and_(
                AutomationExecution.rule_id == rule.id,
                AutomationExecution.order_id == order.id,
                AutomationExecution.status == "completed"
            )
        )
        existing = db.execute(stmt).scalar_one_or_none()
        
        if not existing:
            execute_automation_actions(db, rule, order)
            processed += 1
    
    return processed

def process_order_created_trigger(db, rule: AutomationRule) -> int:
    """Process order created trigger"""
    # Find new orders in the last few minutes
    time_threshold = datetime.now() - timedelta(minutes=5)
    
    stmt = select(Order).where(
        and_(
            Order.project_id == rule.project_id,
            Order.created_at >= time_threshold
        )
    )
    orders = db.execute(stmt).scalars().all()
    
    processed = 0
    for order in orders:
        # Check if already processed
        stmt = select(AutomationExecution).where(
            and_(
                AutomationExecution.rule_id == rule.id,
                AutomationExecution.order_id == order.id
            )
        )
        existing = db.execute(stmt).scalar_one_or_none()
        
        if not existing:
            execute_automation_actions(db, rule, order)
            processed += 1
    
    return processed

def process_no_call_response_trigger(db, rule: AutomationRule) -> int:
    """Process no call response trigger"""
    conditions = rule.trigger_conditions
    hours_since_call = conditions.get("hours_since_call", 24)
    
    # Find orders with no answer calls
    time_threshold = datetime.now() - timedelta(hours=hours_since_call)
    
    stmt = select(Order).where(
        and_(
            Order.project_id == rule.project_id,
            Order.last_call_result.in_(["no_answer", "busy"]),
            Order.status_updated_at <= time_threshold
        )
    )
    orders = db.execute(stmt).scalars().all()
    
    processed = 0
    for order in orders:
        execute_automation_actions(db, rule, order)
        processed += 1
    
    return processed

def execute_automation_actions(db, rule: AutomationRule, order: Order):
    """Execute automation actions for an order"""
    execution = AutomationExecution(
        rule_id=rule.id,
        order_id=order.id,
        status="running",
        started_at=datetime.now()
    )
    db.add(execution)
    db.flush()
    
    try:
        results = []
        
        for action in rule.actions:
            action_type = action.get("type")
            result = None
            
            if action_type == "change_status":
                result = change_order_status_action(db, order, action)
            elif action_type == "send_sms":
                result = send_sms_action(db, order, action)
            elif action_type == "send_email":
                result = send_email_action(db, order, action)
            elif action_type == "assign_operator":
                result = assign_operator_action(db, order, action)
            elif action_type == "schedule_call":
                result = schedule_call_action(db, order, action)
            elif action_type == "add_comment":
                result = add_comment_action(db, order, action)
            
            if result:
                results.append(result)
        
        # Update execution status
        execution.status = "completed"
        execution.completed_at = datetime.now()
        execution.result = {"actions": results}
        
        db.commit()
        
    except Exception as e:
        execution.status = "failed"
        execution.error_message = str(e)
        execution.completed_at = datetime.now()
        db.commit()
        logger.error(f"Automation execution failed for rule {rule.id}, order {order.id}: {str(e)}")

def change_order_status_action(db, order: Order, action: Dict[str, Any]) -> Dict[str, Any]:
    """Change order status action"""
    new_status_id = action.get("status_id")
    
    old_status_id = order.status_id
    
    # Update order status
    stmt = update(Order).where(Order.id == order.id).values(
        status_id=new_status_id,
        status_updated_at=func.now(),
        updated_at=func.now()
    )
    db.execute(stmt)
    
    # Add to history
    history = OrderHistory(
        order_id=order.id,
        action="status_changed_by_automation",
        field_name="status_id",
        old_value=str(old_status_id),
        new_value=str(new_status_id),
        comment="Status changed by automation rule"
    )
    db.add(history)
    
    return {"action": "change_status", "old_status": old_status_id, "new_status": new_status_id}

def send_sms_action(db, order: Order, action: Dict[str, Any]) -> Dict[str, Any]:
    """Send SMS action"""
    template_id = action.get("template_id")
    custom_message = action.get("message")
    
    if template_id:
        # Get template
        stmt = select(SMSTemplate).where(SMSTemplate.id == template_id)
        template = db.execute(stmt).scalar_one_or_none()
        
        if template:
            # Replace variables in template
            message_content = replace_template_variables(template.content, order)
        else:
            message_content = "Уведомление о заказе"
    else:
        message_content = custom_message or "Уведомление о заказе"
    
    # Create SMS message
    sms_message = SMSMessage(
        project_id=order.project_id,
        order_id=order.id,
        template_id=template_id,
        phone_number=order.customer_phone,
        content=message_content,
        status="pending"
    )
    db.add(sms_message)
    
    return {"action": "send_sms", "phone": order.customer_phone, "message": message_content}

def send_email_action(db, order: Order, action: Dict[str, Any]) -> Dict[str, Any]:
    """Send email action"""
    if not order.customer_email:
        return {"action": "send_email", "error": "No email address"}
    
    template_name = action.get("template", "order_notification")
    subject = action.get("subject", f"Уведомление о заказе #{order.id}")
    
    # Send email asynchronously
    send_order_notification_email.delay(
        order.customer_email,
        {
            "id": order.id,
            "customer_name": order.customer_name,
            "total_amount": float(order.total_amount),
            "status": order.status.name if order.status else ""
        },
        template_name
    )
    
    return {"action": "send_email", "email": order.customer_email, "subject": subject}

def assign_operator_action(db, order: Order, action: Dict[str, Any]) -> Dict[str, Any]:
    """Assign operator action"""
    operator_id = action.get("operator_id")
    
    old_operator_id = order.operator_id
    
    # Update order operator
    stmt = update(Order).where(Order.id == order.id).values(
        operator_id=operator_id,
        updated_at=func.now()
    )
    db.execute(stmt)
    
    # Add to history
    history = OrderHistory(
        order_id=order.id,
        action="operator_assigned_by_automation",
        field_name="operator_id",
        old_value=str(old_operator_id) if old_operator_id else None,
        new_value=str(operator_id),
        comment="Operator assigned by automation rule"
    )
    db.add(history)
    
    return {"action": "assign_operator", "old_operator": old_operator_id, "new_operator": operator_id}

def schedule_call_action(db, order: Order, action: Dict[str, Any]) -> Dict[str, Any]:
    """Schedule call action"""
    delay_minutes = action.get("delay_minutes", 60)
    next_call_time = datetime.now() + timedelta(minutes=delay_minutes)
    
    # Update next call time
    stmt = update(Order).where(Order.id == order.id).values(
        next_call_at=next_call_time,
        updated_at=func.now()
    )
    db.execute(stmt)
    
    return {"action": "schedule_call", "scheduled_for": next_call_time.isoformat()}

def add_comment_action(db, order: Order, action: Dict[str, Any]) -> Dict[str, Any]:
    """Add comment action"""
    comment_text = action.get("comment", "Автоматический комментарий")
    
    # Add to history
    history = OrderHistory(
        order_id=order.id,
        action="comment_added_by_automation",
        comment=comment_text
    )
    db.add(history)
    
    return {"action": "add_comment", "comment": comment_text}

def replace_template_variables(template: str, order: Order) -> str:
    """Replace template variables with order data"""
    variables = {
        "{customer_name}": order.customer_name,
        "{order_id}": str(order.id),
        "{phone}": order.customer_phone,
        "{total_amount}": str(order.total_amount),
        "{city}": order.city or "",
        "{address}": order.address or "",
        "{tracking_number}": order.tracking_number or "",
        "{status}": order.status.name if order.status else ""
    }
    
    result = template
    for variable, value in variables.items():
        result = result.replace(variable, value)
    
    return result

@celery_app.task(base=DatabaseTask, bind=True)
def auto_assign_orders(self, db):
    """Automatically assign new orders to operators"""
    try:
        # Get unassigned orders
        stmt = select(Order).where(
            and_(
                Order.operator_id.is_(None),
                Order.created_at >= datetime.now() - timedelta(hours=24)
            )
        ).options(selectinload(Order.project))
        
        orders = db.execute(stmt).scalars().all()
        assigned_count = 0
        
        for order in orders:
            # Get available operators for this project
            stmt = (
                select(User)
                .join(ProjectUser)
                .where(
                    and_(
                        ProjectUser.project_id == order.project_id,
                        ProjectUser.auto_assignment == True,
                        User.status == "active"
                    )
                )
            )
            operators = db.execute(stmt).scalars().all()
            
            if not operators:
                continue
            
            # Simple round-robin assignment
            # TODO: Implement more sophisticated load balancing
            operator = min(operators, key=lambda op: get_operator_current_load(db, op.id))
            
            # Check working hours
            if order.city:
                hours_status = get_working_hours_status(order.city)
                if not hours_status.get("is_working_hours", True):
                    continue  # Skip assignment during non-working hours
            
            # Assign order
            stmt = update(Order).where(Order.id == order.id).values(
                operator_id=operator.id,
                updated_at=func.now()
            )
            db.execute(stmt)
            
            # Add to history
            history = OrderHistory(
                order_id=order.id,
                action="auto_assigned",
                new_value=str(operator.id),
                comment="Automatically assigned to operator"
            )
            db.add(history)
            
            assigned_count += 1
        
        db.commit()
        logger.info(f"Auto-assigned {assigned_count} orders")
        
        return {"assigned_orders": assigned_count}
        
    except Exception as e:
        logger.error(f"Error in auto_assign_orders: {str(e)}")
        db.rollback()
        raise

def get_operator_current_load(db, operator_id: int) -> int:
    """Get current order load for operator"""
    stmt = select(func.count(Order.id)).where(
        and_(
            Order.operator_id == operator_id,
            Order.status_id.in_(
                select(OrderStatus.id).where(
                    OrderStatus.group.in_(["processing", "accepted"])
                )
            )
        )
    )
    return db.execute(stmt).scalar() or 0

@celery_app.task(base=DatabaseTask, bind=True)
def update_shipping_statuses(self, db):
    """Update order statuses based on shipping information"""
    try:
        # Get orders with tracking numbers in shipped status
        stmt = (
            select(Order)
            .join(OrderStatus)
            .where(
                and_(
                    Order.tracking_number.isnot(None),
                    OrderStatus.group == "shipped",
                    Order.shipped_at >= datetime.now() - timedelta(days=30)
                )
            )
        )
        orders = db.execute(stmt).scalars().all()
        
        updated_count = 0
        
        for order in orders:
            # TODO: Implement actual shipping status checking
            # This would integrate with shipping services APIs
            # For now, just simulate status updates
            
            # Simulate delivery after 3-7 days
            days_shipped = (datetime.now() - order.shipped_at).days
            if days_shipped >= 3:
                # Find "delivered" status
                stmt = (
                    select(OrderStatus)
                    .where(
                        and_(
                            OrderStatus.project_id == order.project_id,
                            OrderStatus.group == "paid"
                        )
                    )
                    .limit(1)
                )
                delivered_status = db.execute(stmt).scalar_one_or_none()
                
                if delivered_status and order.status_id != delivered_status.id:
                    # Update status
                    stmt = update(Order).where(Order.id == order.id).values(
                        status_id=delivered_status.id,
                        status_updated_at=func.now(),
                        updated_at=func.now()
                    )
                    db.execute(stmt)
                    
                    # Add to history
                    history = OrderHistory(
                        order_id=order.id,
                        action="status_updated_by_shipping",
                        field_name="status_id",
                        new_value=str(delivered_status.id),
                        comment="Status updated based on shipping information"
                    )
                    db.add(history)
                    
                    updated_count += 1
        
        db.commit()
        logger.info(f"Updated {updated_count} shipping statuses")
        
        return {"updated_orders": updated_count}
        
    except Exception as e:
        logger.error(f"Error in update_shipping_statuses: {str(e)}")
        db.rollback()
        raise

# Make tasks available for import
__all__ = [
    "process_automation_rules",
    "auto_assign_orders", 
    "update_shipping_statuses"
]