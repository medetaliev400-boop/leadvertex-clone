from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

# Create Celery instance
celery_app = Celery(
    "leadvertex",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.celery_app.tasks.automation",
        "app.celery_app.tasks.notifications", 
        "app.celery_app.tasks.telephony",
        "app.celery_app.tasks.analytics",
        "app.celery_app.tasks.maintenance"
    ]
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Periodic tasks
celery_app.conf.beat_schedule = {
    # Process automation rules every minute
    "process-automation-rules": {
        "task": "app.celery_app.tasks.automation.process_automation_rules",
        "schedule": 60.0,  # Every minute
    },
    
    # Process scheduled robot calls every minute
    "process-robot-calls": {
        "task": "app.celery_app.tasks.telephony.process_robot_calls", 
        "schedule": 60.0,
    },
    
    # Send pending SMS messages every 30 seconds
    "send-pending-sms": {
        "task": "app.celery_app.tasks.notifications.send_pending_sms",
        "schedule": 30.0,
    },
    
    # Process auto order assignments every 2 minutes
    "auto-assign-orders": {
        "task": "app.celery_app.tasks.automation.auto_assign_orders",
        "schedule": 120.0,
    },
    
    # Generate daily reports at 9 AM
    "generate-daily-reports": {
        "task": "app.celery_app.tasks.analytics.generate_daily_reports",
        "schedule": crontab(hour=9, minute=0),
    },
    
    # Check low stock every hour
    "check-low-stock": {
        "task": "app.celery_app.tasks.notifications.check_low_stock",
        "schedule": crontab(minute=0),  # Every hour
    },
    
    # Update order statuses based on shipping info every 30 minutes
    "update-shipping-statuses": {
        "task": "app.celery_app.tasks.automation.update_shipping_statuses",
        "schedule": 30 * 60,  # 30 minutes
    },
    
    # Clean up old records daily at 2 AM
    "cleanup-old-records": {
        "task": "app.celery_app.tasks.maintenance.cleanup_old_records",
        "schedule": crontab(hour=2, minute=0),
    },
}

# Task routes for different queues
celery_app.conf.task_routes = {
    "app.celery_app.tasks.telephony.*": {"queue": "telephony"},
    "app.celery_app.tasks.notifications.*": {"queue": "notifications"},
    "app.celery_app.tasks.automation.*": {"queue": "automation"},
    "app.celery_app.tasks.analytics.*": {"queue": "analytics"},
    "app.celery_app.tasks.maintenance.*": {"queue": "default"},
}

if __name__ == "__main__":
    celery_app.start()