from celery import current_task
from celery.utils.log import get_task_logger
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.celery_app.celery import celery_app
from app.core.database import SessionLocal
from app.models.order import Order, CallLog
from app.models.cpa import RobotCall
from app.models.user import User, Project
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
import asyncio
import httpx
import json

logger = get_task_logger(__name__)

@celery_app.task(bind=True, max_retries=3)
def make_robot_call(self, order_id: int, script_id: Optional[int] = None):
    """Make automated robot call to order"""
    try:
        with SessionLocal() as db:
            # Get order with related data
            stmt = (
                select(Order)
                .options(selectinload(Order.project))
                .where(Order.id == order_id)
            )
            order = db.execute(stmt).scalar_one_or_none()
            
            if not order:
                logger.error(f"Order {order_id} not found")
                return {"success": False, "error": "Order not found"}
            
            # Check if we should call this number
            if not order.customer_phone or len(order.customer_phone) < 10:
                logger.warning(f"Invalid phone number for order {order_id}")
                return {"success": False, "error": "Invalid phone number"}
            
            # Create call log entry
            call_log = CallLog(
                order_id=order.id,
                project_id=order.project_id,
                phone_number=order.customer_phone,
                call_type="robot",
                status="initiated",
                started_at=datetime.utcnow()
            )
            db.add(call_log)
            db.commit()
            
            # Simulate robot call (replace with actual telephony integration)
            result = _simulate_robot_call(order.customer_phone, order.customer_name)
            
            # Update call log with result
            call_log.status = result["status"]
            call_log.result = result["result"]
            call_log.duration = result.get("duration", 0)
            call_log.ended_at = datetime.utcnow()
            call_log.notes = result.get("notes", "")
            
            # Update order call statistics
            order.calls_count += 1
            order.call_attempts += 1
            order.last_call_result = result["result"]
            
            # Schedule next call if needed
            if result["result"] in ["no_answer", "busy"] and order.call_attempts < 5:
                next_call_delay = [30, 60, 120, 240][min(order.call_attempts - 1, 3)]  # minutes
                order.next_call_at = datetime.utcnow() + timedelta(minutes=next_call_delay)
                
                # Schedule next call
                make_robot_call.apply_async(
                    args=[order_id], 
                    countdown=next_call_delay * 60
                )
            
            db.commit()
            
            logger.info(f"Robot call completed for order {order_id}: {result['result']}")
            return {"success": True, "result": result}
            
    except Exception as exc:
        logger.error(f"Robot call failed for order {order_id}: {str(exc)}")
        
        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            countdown = 2 ** self.request.retries * 60  # 1, 2, 4 minutes
            raise self.retry(countdown=countdown, exc=exc)
        
        return {"success": False, "error": str(exc)}

@celery_app.task
def process_robot_calls():
    """Process scheduled robot calls"""
    try:
        with SessionLocal() as db:
            # Find orders that need robot calls
            now = datetime.utcnow()
            stmt = select(Order).where(
                and_(
                    Order.next_call_at <= now,
                    Order.call_attempts < 5,
                    Order.auto_actions_enabled == True
                )
            )
            
            orders_to_call = db.execute(stmt).scalars().all()
            
            logger.info(f"Found {len(orders_to_call)} orders needing robot calls")
            
            for order in orders_to_call:
                # Clear next_call_at to prevent duplicate calls
                order.next_call_at = None
                db.commit()
                
                # Queue robot call
                make_robot_call.delay(order.id)
            
            return {"processed": len(orders_to_call)}
            
    except Exception as exc:
        logger.error(f"Error processing robot calls: {str(exc)}")
        return {"error": str(exc)}

@celery_app.task(bind=True, max_retries=2)
def send_sms_message(self, order_id: int, message: str, template_id: Optional[int] = None):
    """Send SMS message to customer"""
    try:
        with SessionLocal() as db:
            order = db.get(Order, order_id)
            if not order:
                logger.error(f"Order {order_id} not found")
                return {"success": False, "error": "Order not found"}
            
            # Simulate SMS sending (replace with actual SMS provider)
            result = _simulate_sms_send(order.customer_phone, message)
            
            # Log the SMS (you would typically save this to an SMS log table)
            logger.info(f"SMS sent to {order.customer_phone} for order {order_id}")
            
            return {"success": True, "message_id": result.get("message_id")}
            
    except Exception as exc:
        logger.error(f"SMS sending failed for order {order_id}: {str(exc)}")
        
        if self.request.retries < self.max_retries:
            countdown = 300  # 5 minutes
            raise self.retry(countdown=countdown, exc=exc)
        
        return {"success": False, "error": str(exc)}

def _simulate_robot_call(phone: str, customer_name: str) -> Dict[str, Any]:
    """Simulate robot call - replace with actual telephony integration"""
    import random
    
    # Simulate call outcomes
    outcomes = [
        {"status": "completed", "result": "answered", "duration": 45, "notes": "Customer answered, script played"},
        {"status": "completed", "result": "no_answer", "duration": 0, "notes": "No answer"},
        {"status": "completed", "result": "busy", "duration": 0, "notes": "Line busy"},
        {"status": "completed", "result": "invalid_number", "duration": 0, "notes": "Invalid number"},
    ]
    
    # Weight the outcomes (answered is less likely)
    weights = [20, 40, 25, 15]  # %
    outcome = random.choices(outcomes, weights=weights)[0]
    
    return outcome

def _simulate_sms_send(phone: str, message: str) -> Dict[str, Any]:
    """Simulate SMS sending - replace with actual SMS provider"""
    import uuid
    
    return {
        "message_id": str(uuid.uuid4()),
        "status": "sent",
        "phone": phone,
        "message": message
    }

# Integration functions for real telephony providers

def integrate_twilio_call(phone: str, script_url: str) -> Dict[str, Any]:
    """Integration with Twilio for voice calls"""
    from twilio.rest import Client
    from app.core.config import settings
    
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        return {"error": "Twilio not configured"}
    
    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        call = client.calls.create(
            url=script_url,  # TwiML script URL
            to=phone,
            from_=settings.TWILIO_PHONE_NUMBER,
            timeout=30
        )
        
        return {"call_sid": call.sid, "status": call.status}
        
    except Exception as e:
        logger.error(f"Twilio call failed: {str(e)}")
        return {"error": str(e)}

def integrate_sms_ru(phone: str, message: str) -> Dict[str, Any]:
    """Integration with SMS.ru service"""
    from app.core.config import settings
    
    if not settings.SMS_RU_API_ID:
        return {"error": "SMS.ru not configured"}
    
    try:
        url = "https://sms.ru/sms/send"
        params = {
            "api_id": settings.SMS_RU_API_ID,
            "to": phone,
            "msg": message,
            "json": 1
        }
        
        with httpx.Client() as client:
            response = client.get(url, params=params)
            data = response.json()
            
        return data
        
    except Exception as e:
        logger.error(f"SMS.ru sending failed: {str(e)}")
        return {"error": str(e)}