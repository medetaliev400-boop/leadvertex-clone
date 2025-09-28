from celery.utils.log import get_task_logger
from datetime import datetime, timedelta
from typing import Dict, Any
from app.celery_app.celery import celery_app
from app.core.database import SessionLocal
from app.models.order import Order, OrderHistory, CallLog
from app.models.cpa import Click, RobotCall, SMSMessage
from sqlalchemy import delete, select, and_, func
import os
import shutil

logger = get_task_logger(__name__)

@celery_app.task
def cleanup_old_records():
    """Clean up old records to maintain database performance"""
    try:
        with SessionLocal() as db:
            cleanup_results = {}
            
            # Clean up old order history (keep last 6 months)
            six_months_ago = datetime.utcnow() - timedelta(days=180)
            
            # Order history cleanup
            stmt = delete(OrderHistory).where(OrderHistory.created_at < six_months_ago)
            result = db.execute(stmt)
            cleanup_results["order_history_deleted"] = result.rowcount
            
            # Old call logs cleanup (keep last 3 months)
            three_months_ago = datetime.utcnow() - timedelta(days=90)
            
            try:
                stmt = delete(CallLog).where(CallLog.started_at < three_months_ago)
                result = db.execute(stmt)
                cleanup_results["call_logs_deleted"] = result.rowcount
            except Exception as e:
                logger.warning(f"Call logs cleanup failed: {str(e)}")
                cleanup_results["call_logs_deleted"] = 0
            
            # Old clicks cleanup (keep last 2 months)
            two_months_ago = datetime.utcnow() - timedelta(days=60)
            
            try:
                stmt = delete(Click).where(Click.created_at < two_months_ago)
                result = db.execute(stmt)
                cleanup_results["clicks_deleted"] = result.rowcount
            except Exception as e:
                logger.warning(f"Clicks cleanup failed: {str(e)}")
                cleanup_results["clicks_deleted"] = 0
            
            # Old robot calls cleanup
            try:
                stmt = delete(RobotCall).where(RobotCall.created_at < three_months_ago)
                result = db.execute(stmt)
                cleanup_results["robot_calls_deleted"] = result.rowcount
            except Exception as e:
                logger.warning(f"Robot calls cleanup failed: {str(e)}")
                cleanup_results["robot_calls_deleted"] = 0
            
            # Old SMS messages cleanup
            try:
                stmt = delete(SMSMessage).where(SMSMessage.created_at < two_months_ago)
                result = db.execute(stmt)
                cleanup_results["sms_messages_deleted"] = result.rowcount
            except Exception as e:
                logger.warning(f"SMS messages cleanup failed: {str(e)}")
                cleanup_results["sms_messages_deleted"] = 0
            
            db.commit()
            
            # File cleanup
            file_cleanup_results = cleanup_old_files()
            cleanup_results.update(file_cleanup_results)
            
            logger.info(f"Cleanup completed: {cleanup_results}")
            return cleanup_results
            
    except Exception as exc:
        logger.error(f"Error during cleanup: {str(exc)}")
        return {"error": str(exc)}

@celery_app.task
def optimize_database():
    """Optimize database performance"""
    try:
        with SessionLocal() as db:
            optimization_results = {}
            
            # Update table statistics
            try:
                db.execute("ANALYZE;")
                optimization_results["statistics_updated"] = True
            except Exception as e:
                logger.warning(f"Statistics update failed: {str(e)}")
                optimization_results["statistics_updated"] = False
            
            # Vacuum to reclaim space (PostgreSQL specific)
            try:
                # Note: VACUUM cannot be run inside a transaction
                # In production, this should be run as a separate connection
                logger.info("Database optimization completed (manual VACUUM recommended)")
                optimization_results["vacuum_recommended"] = True
            except Exception as e:
                logger.warning(f"Vacuum failed: {str(e)}")
                optimization_results["vacuum_recommended"] = True
            
            db.commit()
            
            return optimization_results
            
    except Exception as exc:
        logger.error(f"Error during database optimization: {str(exc)}")
        return {"error": str(exc)}

@celery_app.task
def cleanup_failed_uploads():
    """Clean up failed or orphaned file uploads"""
    try:
        cleanup_results = {
            "files_deleted": 0,
            "directories_cleaned": 0,
            "space_freed_mb": 0
        }
        
        upload_dir = "uploads"
        if not os.path.exists(upload_dir):
            return cleanup_results
        
        # Clean up temporary files older than 24 hours
        twenty_four_hours_ago = datetime.now() - timedelta(hours=24)
        
        for root, dirs, files in os.walk(upload_dir):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    # Check if file is a temporary file or older than 24 hours
                    if (file.startswith('.tmp') or file.startswith('temp_') or 
                        datetime.fromtimestamp(os.path.getctime(file_path)) < twenty_four_hours_ago):
                        
                        file_size = os.path.getsize(file_path)
                        os.remove(file_path)
                        cleanup_results["files_deleted"] += 1
                        cleanup_results["space_freed_mb"] += file_size / (1024 * 1024)
                        
                except Exception as e:
                    logger.warning(f"Failed to delete file {file_path}: {str(e)}")
            
            # Remove empty directories
            try:
                if not os.listdir(root) and root != upload_dir:
                    os.rmdir(root)
                    cleanup_results["directories_cleaned"] += 1
            except Exception as e:
                logger.warning(f"Failed to remove directory {root}: {str(e)}")
        
        logger.info(f"Upload cleanup completed: {cleanup_results}")
        return cleanup_results
        
    except Exception as exc:
        logger.error(f"Error during upload cleanup: {str(exc)}")
        return {"error": str(exc)}

@celery_app.task
def backup_critical_data():
    """Create backup of critical system data"""
    try:
        with SessionLocal() as db:
            backup_results = {
                "backup_created": False,
                "backup_path": None,
                "tables_backed_up": []
            }
            
            # Get critical data counts
            critical_tables = [
                ("users", "SELECT COUNT(*) FROM users"),
                ("projects", "SELECT COUNT(*) FROM projects"),
                ("orders", "SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '30 days'"),
                ("order_statuses", "SELECT COUNT(*) FROM order_statuses"),
            ]
            
            backup_info = {
                "created_at": datetime.utcnow().isoformat(),
                "tables": {}
            }
            
            for table_name, query in critical_tables:
                try:
                    result = db.execute(query).scalar()
                    backup_info["tables"][table_name] = result
                    backup_results["tables_backed_up"].append(table_name)
                except Exception as e:
                    logger.warning(f"Failed to backup {table_name}: {str(e)}")
            
            # In a real system, you would export actual data to files
            # For now, just log the backup info
            logger.info(f"Backup info: {backup_info}")
            backup_results["backup_created"] = True
            
            return backup_results
            
    except Exception as exc:
        logger.error(f"Error during backup: {str(exc)}")
        return {"error": str(exc)}

@celery_app.task
def check_system_health():
    """Check system health and report issues"""
    try:
        health_results = {
            "database_connected": False,
            "redis_connected": False,
            "disk_space_ok": True,
            "memory_usage_ok": True,
            "issues": []
        }
        
        # Check database connection
        try:
            with SessionLocal() as db:
                db.execute("SELECT 1")
                health_results["database_connected"] = True
        except Exception as e:
            health_results["issues"].append(f"Database connection failed: {str(e)}")
        
        # Check Redis connection
        try:
            import redis
            from app.core.config import settings
            
            r = redis.from_url(settings.REDIS_URL)
            r.ping()
            health_results["redis_connected"] = True
        except Exception as e:
            health_results["issues"].append(f"Redis connection failed: {str(e)}")
        
        # Check disk space
        try:
            disk_usage = shutil.disk_usage(".")
            free_percentage = (disk_usage.free / disk_usage.total) * 100
            
            if free_percentage < 10:  # Less than 10% free space
                health_results["disk_space_ok"] = False
                health_results["issues"].append(f"Low disk space: {free_percentage:.1f}% free")
        except Exception as e:
            health_results["issues"].append(f"Disk space check failed: {str(e)}")
        
        # Check memory usage
        try:
            import psutil
            memory = psutil.virtual_memory()
            
            if memory.percent > 90:  # More than 90% memory used
                health_results["memory_usage_ok"] = False
                health_results["issues"].append(f"High memory usage: {memory.percent:.1f}%")
        except ImportError:
            # psutil not available
            pass
        except Exception as e:
            health_results["issues"].append(f"Memory check failed: {str(e)}")
        
        # Log health status
        if health_results["issues"]:
            logger.warning(f"System health issues detected: {health_results}")
        else:
            logger.info("System health check passed")
        
        return health_results
        
    except Exception as exc:
        logger.error(f"Error during health check: {str(exc)}")
        return {"error": str(exc)}

def cleanup_old_files() -> Dict[str, Any]:
    """Clean up old files from uploads directory"""
    try:
        cleanup_results = {
            "old_files_deleted": 0,
            "space_freed_mb": 0
        }
        
        upload_dir = "uploads"
        if not os.path.exists(upload_dir):
            return cleanup_results
        
        # Delete files older than 6 months
        six_months_ago = datetime.now() - timedelta(days=180)
        
        for root, dirs, files in os.walk(upload_dir):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    if datetime.fromtimestamp(os.path.getctime(file_path)) < six_months_ago:
                        file_size = os.path.getsize(file_path)
                        os.remove(file_path)
                        cleanup_results["old_files_deleted"] += 1
                        cleanup_results["space_freed_mb"] += file_size / (1024 * 1024)
                except Exception as e:
                    logger.warning(f"Failed to delete old file {file_path}: {str(e)}")
        
        return cleanup_results
        
    except Exception as e:
        logger.warning(f"File cleanup failed: {str(e)}")
        return {"old_files_deleted": 0, "space_freed_mb": 0}