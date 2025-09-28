from celery import Task
from sqlalchemy import select, update, and_, func
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging
import requests
import json

from app.celery_app.celery import celery_app
from app.core.database import SessionLocal
from app.core.config import settings
from app.models.user import User, Project
from app.models.order import Order, Product
from app.models.cpa import SMSMessage, SMSTemplate
from app.utils.email import send_low_stock_alert_email, send_daily_summary_email

logger = logging.getLogger(__name__)

class DatabaseTask(Task):
    """Base task class with database session"""
    
    def __call__(self, *args, **kwargs):
        with SessionLocal() as db:
            return self.run(db, *args, **kwargs)
    
    def run(self, db, *args, **kwargs):
        raise NotImplementedError

@celery_app.task(base=DatabaseTask, bind=True)
def send_pending_sms(self, db):
    """Send pending SMS messages"""
    try:
        # Get pending SMS messages
        stmt = (
            select(SMSMessage)
            .where(SMSMessage.status == "pending")
            .order_by(SMSMessage.created_at)
            .limit(100)  # Process in batches
        )
        pending_messages = db.execute(stmt).scalars().all()
        
        sent_count = 0
        failed_count = 0
        
        for message in pending_messages:
            try:
                # Update status to processing
                message.status = "processing"
                db.commit()
                
                # Send SMS
                success = send_sms_message(message)
                
                if success:
                    message.status = "sent"
                    message.sent_at = datetime.now()
                    sent_count += 1
                    logger.info(f"SMS sent successfully to {message.phone_number}")
                else:
                    message.status = "failed"
                    message.error_message = "Failed to send SMS"
                    failed_count += 1
                    logger.error(f"Failed to send SMS to {message.phone_number}")
                
                db.commit()
                
            except Exception as e:
                message.status = "failed"
                message.error_message = str(e)
                db.commit()
                failed_count += 1
                logger.error(f"Error sending SMS to {message.phone_number}: {str(e)}")
        
        logger.info(f"SMS batch processed: {sent_count} sent, {failed_count} failed")
        
        return {"sent": sent_count, "failed": failed_count}
        
    except Exception as e:
        logger.error(f"Error in send_pending_sms: {str(e)}")
        db.rollback()
        raise

def send_sms_message(message: SMSMessage) -> bool:
    """Send SMS using configured provider"""
    try:
        # Try SMS.ru first
        if settings.SMS_RU_API_ID:
            return send_sms_via_sms_ru(message)
        
        # Try SMSC.ru
        if settings.SMSC_LOGIN and settings.SMSC_PASSWORD:
            return send_sms_via_smsc(message)
        
        # Try Twilio
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            return send_sms_via_twilio(message)
        
        logger.error("No SMS provider configured")
        return False
        
    except Exception as e:
        logger.error(f"Error sending SMS: {str(e)}")
        return False

def send_sms_via_sms_ru(message: SMSMessage) -> bool:
    """Send SMS via SMS.ru"""
    try:
        url = "https://sms.ru/sms/send"
        
        params = {
            "api_id": settings.SMS_RU_API_ID,
            "to": message.phone_number,
            "msg": message.content,
            "json": 1
        }
        
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        
        if result.get("status_code") == 100:
            message.external_id = str(result.get("sms", {}).get(message.phone_number, {}).get("sms_id"))
            message.cost = result.get("sms", {}).get(message.phone_number, {}).get("cost", 0)
            return True
        else:
            message.error_message = result.get("status_text", "Unknown error")
            return False
            
    except Exception as e:
        logger.error(f"SMS.ru error: {str(e)}")
        return False

def send_sms_via_smsc(message: SMSMessage) -> bool:
    """Send SMS via SMSC.ru"""
    try:
        url = "https://smsc.ru/sys/send.php"
        
        data = {
            "login": settings.SMSC_LOGIN,
            "psw": settings.SMSC_PASSWORD,
            "phones": message.phone_number,
            "mes": message.content,
            "fmt": 3  # JSON response
        }
        
        response = requests.post(url, data=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        
        if "id" in result:
            message.external_id = str(result["id"])
            message.cost = result.get("cost", 0)
            return True
        else:
            message.error_message = result.get("error_code", "Unknown error")
            return False
            
    except Exception as e:
        logger.error(f"SMSC error: {str(e)}")
        return False

def send_sms_via_twilio(message: SMSMessage) -> bool:
    """Send SMS via Twilio"""
    try:
        from twilio.rest import Client
        
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        twilio_message = client.messages.create(
            body=message.content,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=message.phone_number
        )
        
        message.external_id = twilio_message.sid
        # Twilio doesn't provide cost in real-time
        return True
        
    except Exception as e:
        logger.error(f"Twilio error: {str(e)}")
        return False

@celery_app.task(base=DatabaseTask, bind=True)
def check_low_stock(self, db):
    """Check for low stock products and send alerts"""
    try:
        # Get all projects
        stmt = select(Project).where(Project.is_active == True)
        projects = db.execute(stmt).scalars().all()
        
        alerts_sent = 0
        
        for project in projects:
            # Get low stock products for this project
            stmt = (
                select(Product)
                .where(
                    and_(
                        Product.project_id == project.id,
                        Product.track_inventory == True,
                        Product.is_active == True,
                        Product.stock_quantity <= Product.low_stock_threshold
                    )
                )
            )
            low_stock_products = db.execute(stmt).scalars().all()
            
            if low_stock_products:
                # Get project owner email
                stmt = select(User).where(User.id == project.owner_id)
                owner = db.execute(stmt).scalar_one_or_none()
                
                if owner and owner.email:
                    # Prepare product data
                    products_data = []
                    for product in low_stock_products:
                        products_data.append({
                            "id": product.id,
                            "name": product.name,
                            "sku": product.sku,
                            "current_stock": product.stock_quantity,
                            "threshold": product.low_stock_threshold
                        })
                    
                    # Send email alert
                    success = send_low_stock_alert_email(
                        owner.email,
                        products_data,
                        project.name
                    )
                    
                    if success:
                        alerts_sent += 1
                        logger.info(f"Low stock alert sent for project {project.name}")
        
        return {"alerts_sent": alerts_sent}
        
    except Exception as e:
        logger.error(f"Error in check_low_stock: {str(e)}")
        raise

@celery_app.task(base=DatabaseTask, bind=True)
def send_daily_summary_email(self, db):
    """Send daily summary emails to project owners"""
    try:
        # Get all active projects
        stmt = (
            select(Project)
            .options(selectinload(Project.owner))
            .where(Project.is_active == True)
        )
        projects = db.execute(stmt).scalars().all()
        
        emails_sent = 0
        today = datetime.now().date()
        
        for project in projects:
            if not project.owner or not project.owner.email:
                continue
            
            # Get today's statistics
            summary_data = get_daily_summary_data(db, project.id, today)
            
            # Send summary email
            success = send_daily_summary_email(
                project.owner.email,
                summary_data,
                project.name
            )
            
            if success:
                emails_sent += 1
                logger.info(f"Daily summary sent for project {project.name}")
        
        return {"emails_sent": emails_sent}
        
    except Exception as e:
        logger.error(f"Error in send_daily_summary_email: {str(e)}")
        raise

def get_daily_summary_data(db, project_id: int, date) -> Dict[str, Any]:
    """Get daily summary statistics for a project"""
    from datetime import datetime, timedelta
    
    day_start = datetime.combine(date, datetime.min.time())
    day_end = day_start + timedelta(days=1)
    
    # New orders today
    stmt = select(func.count(Order.id)).where(
        and_(
            Order.project_id == project_id,
            Order.created_at >= day_start,
            Order.created_at < day_end
        )
    )
    new_orders = db.execute(stmt).scalar() or 0
    
    # Accepted orders today
    stmt = (
        select(func.count(Order.id))
        .join(OrderStatus)
        .where(
            and_(
                Order.project_id == project_id,
                Order.created_at >= day_start,
                Order.created_at < day_end,
                OrderStatus.group == "accepted"
            )
        )
    )
    accepted_orders = db.execute(stmt).scalar() or 0
    
    # Total revenue today
    stmt = (
        select(func.sum(Order.total_amount))
        .join(OrderStatus)
        .where(
            and_(
                Order.project_id == project_id,
                Order.created_at >= day_start,
                Order.created_at < day_end,
                OrderStatus.group.in_(["accepted", "shipped", "paid"])
            )
        )
    )
    revenue = db.execute(stmt).scalar() or 0
    
    # Conversion rate
    conversion_rate = (accepted_orders / new_orders * 100) if new_orders > 0 else 0
    
    # Top products
    stmt = (
        select(
            Product.name,
            func.sum(OrderItem.quantity).label("quantity"),
            func.sum(OrderItem.total).label("revenue")
        )
        .join(OrderItem)
        .join(Order)
        .where(
            and_(
                Order.project_id == project_id,
                Order.created_at >= day_start,
                Order.created_at < day_end
            )
        )
        .group_by(Product.id, Product.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
    )
    top_products = db.execute(stmt).all()
    
    return {
        "date": date.strftime("%Y-%m-%d"),
        "new_orders": new_orders,
        "accepted_orders": accepted_orders,
        "revenue": float(revenue),
        "conversion_rate": round(conversion_rate, 2),
        "top_products": [
            {
                "name": product.name,
                "quantity": product.quantity,
                "revenue": float(product.revenue)
            }
            for product in top_products
        ]
    }

@celery_app.task
def send_order_notification_email(email: str, order_data: Dict[str, Any], template_name: str = "order_notification"):
    """Send order notification email (async task)"""
    from app.utils.email import send_template_email
    
    try:
        success = send_template_email(
            to_emails=[email],
            template_name=template_name,
            context={"order": order_data},
            subject=f"Уведомление о заказе #{order_data.get('id')}"
        )
        
        if success:
            logger.info(f"Order notification email sent to {email}")
        else:
            logger.error(f"Failed to send order notification email to {email}")
            
        return success
        
    except Exception as e:
        logger.error(f"Error sending order notification email: {str(e)}")
        return False

@celery_app.task(base=DatabaseTask, bind=True)
def process_sms_delivery_reports(self, db):
    """Process SMS delivery reports from providers"""
    try:
        # Get sent messages without delivery confirmation
        stmt = (
            select(SMSMessage)
            .where(
                and_(
                    SMSMessage.status == "sent",
                    SMSMessage.delivered_at.is_(None),
                    SMSMessage.external_id.isnot(None),
                    SMSMessage.sent_at >= datetime.now() - timedelta(days=1)
                )
            )
        )
        messages = db.execute(stmt).scalars().all()
        
        updated_count = 0
        
        for message in messages:
            # Check delivery status based on provider
            if message.provider == "sms_ru":
                status = check_sms_ru_delivery_status(message.external_id)
            elif message.provider == "smsc":
                status = check_smsc_delivery_status(message.external_id)
            elif message.provider == "twilio":
                status = check_twilio_delivery_status(message.external_id)
            else:
                continue
            
            if status == "delivered":
                message.status = "delivered"
                message.delivered_at = datetime.now()
                updated_count += 1
            elif status == "failed":
                message.status = "failed"
                message.error_message = "Delivery failed"
        
        db.commit()
        logger.info(f"Updated delivery status for {updated_count} SMS messages")
        
        return {"updated": updated_count}
        
    except Exception as e:
        logger.error(f"Error in process_sms_delivery_reports: {str(e)}")
        db.rollback()
        raise

def check_sms_ru_delivery_status(external_id: str) -> str:
    """Check SMS delivery status via SMS.ru"""
    try:
        url = "https://sms.ru/sms/status"
        
        params = {
            "api_id": settings.SMS_RU_API_ID,
            "sms_id": external_id,
            "json": 1
        }
        
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        status_code = result.get("sms", {}).get(external_id, {}).get("status_code")
        
        if status_code == 103:  # Delivered
            return "delivered"
        elif status_code in [105, 106]:  # Failed
            return "failed"
        else:
            return "pending"
            
    except Exception as e:
        logger.error(f"Error checking SMS.ru status: {str(e)}")
        return "unknown"

def check_smsc_delivery_status(external_id: str) -> str:
    """Check SMS delivery status via SMSC.ru"""
    try:
        url = "https://smsc.ru/sys/status.php"
        
        data = {
            "login": settings.SMSC_LOGIN,
            "psw": settings.SMSC_PASSWORD,
            "phone": external_id,
            "fmt": 3
        }
        
        response = requests.post(url, data=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        status = result.get("status")
        
        if status == 1:  # Delivered
            return "delivered"
        elif status in [-1, 3]:  # Failed
            return "failed"
        else:
            return "pending"
            
    except Exception as e:
        logger.error(f"Error checking SMSC status: {str(e)}")
        return "unknown"

def check_twilio_delivery_status(external_id: str) -> str:
    """Check SMS delivery status via Twilio"""
    try:
        from twilio.rest import Client
        
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        message = client.messages(external_id).fetch()
        
        if message.status == "delivered":
            return "delivered"
        elif message.status in ["failed", "undelivered"]:
            return "failed"
        else:
            return "pending"
            
    except Exception as e:
        logger.error(f"Error checking Twilio status: {str(e)}")
        return "unknown"

# Make tasks available for import
__all__ = [
    "send_pending_sms",
    "check_low_stock",
    "send_daily_summary_email",
    "send_order_notification_email",
    "process_sms_delivery_reports"
]