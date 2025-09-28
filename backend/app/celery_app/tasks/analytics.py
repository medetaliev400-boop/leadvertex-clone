from celery.utils.log import get_task_logger
from datetime import datetime, timedelta, date
from typing import Dict, List, Any, Optional
from app.celery_app.celery import celery_app
from app.core.database import SessionLocal
from app.models.order import Order
from app.models.user import User, Project
from app.models.cpa import Click, Conversion
from sqlalchemy import select, func, and_, text
from sqlalchemy.orm import selectinload
import json
from decimal import Decimal

logger = get_task_logger(__name__)

@celery_app.task
def generate_daily_reports():
    """Generate daily analytics reports for all projects"""
    try:
        with SessionLocal() as db:
            yesterday = date.today() - timedelta(days=1)
            
            # Get all active projects
            stmt = select(Project).where(Project.is_active == True)
            projects = db.execute(stmt).scalars().all()
            
            reports_generated = 0
            
            for project in projects:
                try:
                    report = generate_project_daily_report(project.id, yesterday, db)
                    
                    # Save report (in a real system, you'd save to a reports table)
                    logger.info(f"Generated daily report for project {project.id}: {report}")
                    reports_generated += 1
                    
                except Exception as e:
                    logger.error(f"Failed to generate report for project {project.id}: {str(e)}")
            
            return {"reports_generated": reports_generated, "date": str(yesterday)}
            
    except Exception as exc:
        logger.error(f"Error generating daily reports: {str(exc)}")
        return {"error": str(exc)}

@celery_app.task
def calculate_conversion_analytics(project_id: int, start_date: str, end_date: str):
    """Calculate detailed conversion analytics for a project"""
    try:
        with SessionLocal() as db:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            
            # Orders analytics
            orders_stats = calculate_orders_analytics(project_id, start_dt, end_dt, db)
            
            # CPA analytics  
            cpa_stats = calculate_cpa_analytics(project_id, start_dt, end_dt, db)
            
            # Telephony analytics
            telephony_stats = calculate_telephony_analytics(project_id, start_dt, end_dt, db)
            
            analytics = {
                "project_id": project_id,
                "period": {"start": start_date, "end": end_date},
                "orders": orders_stats,
                "cpa": cpa_stats,
                "telephony": telephony_stats,
                "generated_at": datetime.utcnow().isoformat()
            }
            
            return analytics
            
    except Exception as exc:
        logger.error(f"Error calculating analytics for project {project_id}: {str(exc)}")
        return {"error": str(exc)}

@celery_app.task
def update_conversion_rates():
    """Update conversion rates for all active projects"""
    try:
        with SessionLocal() as db:
            # Get projects with recent activity
            last_week = datetime.utcnow() - timedelta(days=7)
            
            stmt = (
                select(Project.id)
                .join(Order)
                .where(
                    and_(
                        Project.is_active == True,
                        Order.created_at >= last_week
                    )
                )
                .distinct()
            )
            
            active_project_ids = db.execute(stmt).scalars().all()
            
            updated_projects = 0
            
            for project_id in active_project_ids:
                try:
                    # Calculate conversion rates for different periods
                    rates = calculate_project_conversion_rates(project_id, db)
                    
                    # In a real system, you'd save these to a analytics/metrics table
                    logger.info(f"Updated conversion rates for project {project_id}: {rates}")
                    updated_projects += 1
                    
                except Exception as e:
                    logger.error(f"Failed to update rates for project {project_id}: {str(e)}")
            
            return {"updated_projects": updated_projects}
            
    except Exception as exc:
        logger.error(f"Error updating conversion rates: {str(exc)}")
        return {"error": str(exc)}

@celery_app.task
def generate_operator_performance_report(operator_id: int, start_date: str, end_date: str):
    """Generate performance report for specific operator"""
    try:
        with SessionLocal() as db:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            
            # Get operator
            operator = db.get(User, operator_id)
            if not operator:
                return {"error": "Operator not found"}
            
            # Orders handled
            stmt = (
                select(
                    func.count(Order.id).label("total_orders"),
                    func.count(func.nullif(Order.approved_at, None)).label("approved_orders"),
                    func.sum(Order.total_amount).label("total_revenue"),
                    func.avg(Order.total_amount).label("avg_order_value")
                )
                .where(
                    and_(
                        Order.operator_id == operator_id,
                        Order.created_at >= start_dt,
                        Order.created_at < end_dt
                    )
                )
            )
            
            result = db.execute(stmt).first()
            
            # Call statistics (assuming you have call_logs table)
            call_stats = {
                "total_calls": 0,
                "successful_calls": 0,
                "avg_call_duration": 0
            }
            
            # Time-based analysis
            hourly_performance = calculate_operator_hourly_performance(
                operator_id, start_dt, end_dt, db
            )
            
            report = {
                "operator": {
                    "id": operator.id,
                    "name": f"{operator.first_name} {operator.last_name}",
                    "email": operator.email
                },
                "period": {"start": start_date, "end": end_date},
                "orders": {
                    "total": result.total_orders or 0,
                    "approved": result.approved_orders or 0,
                    "approval_rate": (result.approved_orders or 0) / max(result.total_orders or 1, 1) * 100,
                    "total_revenue": float(result.total_revenue or 0),
                    "avg_order_value": float(result.avg_order_value or 0)
                },
                "calls": call_stats,
                "performance_by_hour": hourly_performance,
                "generated_at": datetime.utcnow().isoformat()
            }
            
            return report
            
    except Exception as exc:
        logger.error(f"Error generating operator report for {operator_id}: {str(exc)}")
        return {"error": str(exc)}

# Helper functions

def generate_project_daily_report(project_id: int, report_date: date, db) -> Dict[str, Any]:
    """Generate daily report for a single project"""
    start_dt = datetime.combine(report_date, datetime.min.time())
    end_dt = start_dt + timedelta(days=1)
    
    # Orders for the day
    stmt = (
        select(
            func.count(Order.id).label("total_orders"),
            func.sum(Order.total_amount).label("total_revenue"),
            func.count(func.nullif(Order.approved_at, None)).label("approved_orders")
        )
        .where(
            and_(
                Order.project_id == project_id,
                Order.created_at >= start_dt,
                Order.created_at < end_dt
            )
        )
    )
    
    result = db.execute(stmt).first()
    
    return {
        "project_id": project_id,
        "date": str(report_date),
        "orders": {
            "total": result.total_orders or 0,
            "approved": result.approved_orders or 0,
            "revenue": float(result.total_revenue or 0)
        }
    }

def calculate_orders_analytics(project_id: int, start_dt: datetime, end_dt: datetime, db) -> Dict[str, Any]:
    """Calculate detailed orders analytics"""
    
    # Basic stats
    stmt = (
        select(
            func.count(Order.id).label("total_orders"),
            func.sum(Order.total_amount).label("total_revenue"),
            func.avg(Order.total_amount).label("avg_order_value"),
            func.count(func.nullif(Order.approved_at, None)).label("approved_orders"),
            func.count(func.nullif(Order.shipped_at, None)).label("shipped_orders"),
            func.count(func.nullif(Order.canceled_at, None)).label("canceled_orders")
        )
        .where(
            and_(
                Order.project_id == project_id,
                Order.created_at >= start_dt,
                Order.created_at < end_dt
            )
        )
    )
    
    result = db.execute(stmt).first()
    
    total_orders = result.total_orders or 0
    
    # Orders by source
    stmt_sources = (
        select(Order.source, func.count(Order.id))
        .where(
            and_(
                Order.project_id == project_id,
                Order.created_at >= start_dt,
                Order.created_at < end_dt
            )
        )
        .group_by(Order.source)
    )
    
    sources = {source: count for source, count in db.execute(stmt_sources)}
    
    return {
        "total_orders": total_orders,
        "approved_orders": result.approved_orders or 0,
        "shipped_orders": result.shipped_orders or 0,
        "canceled_orders": result.canceled_orders or 0,
        "total_revenue": float(result.total_revenue or 0),
        "avg_order_value": float(result.avg_order_value or 0),
        "approval_rate": (result.approved_orders or 0) / max(total_orders, 1) * 100,
        "cancellation_rate": (result.canceled_orders or 0) / max(total_orders, 1) * 100,
        "orders_by_source": sources
    }

def calculate_cpa_analytics(project_id: int, start_dt: datetime, end_dt: datetime, db) -> Dict[str, Any]:
    """Calculate CPA/affiliate analytics"""
    
    # This would require Click and Conversion models
    try:
        # Clicks
        stmt_clicks = (
            select(func.count(Click.id))
            .join(Click.landing_page)
            .where(
                and_(
                    Click.landing_page.project_id == project_id,
                    Click.created_at >= start_dt,
                    Click.created_at < end_dt
                )
            )
        )
        
        total_clicks = db.execute(stmt_clicks).scalar() or 0
        
        # Conversions
        stmt_conversions = (
            select(func.count(Conversion.id), func.sum(Conversion.payout_amount))
            .join(Conversion.order)
            .where(
                and_(
                    Conversion.order.project_id == project_id,
                    Conversion.created_at >= start_dt,
                    Conversion.created_at < end_dt
                )
            )
        )
        
        conv_result = db.execute(stmt_conversions).first()
        total_conversions = conv_result[0] or 0
        total_payouts = float(conv_result[1] or 0)
        
        return {
            "total_clicks": total_clicks,
            "total_conversions": total_conversions,
            "conversion_rate": total_conversions / max(total_clicks, 1) * 100,
            "total_payouts": total_payouts,
            "avg_payout": total_payouts / max(total_conversions, 1)
        }
        
    except Exception as e:
        logger.warning(f"CPA analytics calculation failed: {str(e)}")
        return {
            "total_clicks": 0,
            "total_conversions": 0,
            "conversion_rate": 0,
            "total_payouts": 0,
            "avg_payout": 0
        }

def calculate_telephony_analytics(project_id: int, start_dt: datetime, end_dt: datetime, db) -> Dict[str, Any]:
    """Calculate telephony/call analytics"""
    
    # This would require CallLog model
    try:
        from app.models.order import CallLog
        
        stmt = (
            select(
                func.count(CallLog.id).label("total_calls"),
                func.count(func.nullif(CallLog.result, "no_answer")).label("successful_calls"),
                func.avg(CallLog.duration).label("avg_duration")
            )
            .where(
                and_(
                    CallLog.project_id == project_id,
                    CallLog.started_at >= start_dt,
                    CallLog.started_at < end_dt
                )
            )
        )
        
        result = db.execute(stmt).first()
        
        return {
            "total_calls": result.total_calls or 0,
            "successful_calls": result.successful_calls or 0,
            "success_rate": (result.successful_calls or 0) / max(result.total_calls or 1, 1) * 100,
            "avg_duration": float(result.avg_duration or 0)
        }
        
    except Exception as e:
        logger.warning(f"Telephony analytics calculation failed: {str(e)}")
        return {
            "total_calls": 0,
            "successful_calls": 0,
            "success_rate": 0,
            "avg_duration": 0
        }

def calculate_project_conversion_rates(project_id: int, db) -> Dict[str, float]:
    """Calculate conversion rates for different time periods"""
    
    now = datetime.utcnow()
    periods = {
        "today": now.replace(hour=0, minute=0, second=0, microsecond=0),
        "week": now - timedelta(days=7),
        "month": now - timedelta(days=30)
    }
    
    rates = {}
    
    for period_name, start_time in periods.items():
        stmt = (
            select(
                func.count(Order.id).label("total"),
                func.count(func.nullif(Order.approved_at, None)).label("approved")
            )
            .where(
                and_(
                    Order.project_id == project_id,
                    Order.created_at >= start_time
                )
            )
        )
        
        result = db.execute(stmt).first()
        total = result.total or 0
        approved = result.approved or 0
        
        rates[f"{period_name}_conversion_rate"] = approved / max(total, 1) * 100
    
    return rates

def calculate_operator_hourly_performance(operator_id: int, start_dt: datetime, end_dt: datetime, db) -> List[Dict[str, Any]]:
    """Calculate operator performance by hour of day"""
    
    stmt = text("""
        SELECT 
            EXTRACT(HOUR FROM created_at) as hour,
            COUNT(*) as orders_count,
            COUNT(CASE WHEN approved_at IS NOT NULL THEN 1 END) as approved_count
        FROM orders 
        WHERE operator_id = :operator_id 
            AND created_at >= :start_dt 
            AND created_at < :end_dt
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
    """)
    
    result = db.execute(stmt, {
        "operator_id": operator_id,
        "start_dt": start_dt,
        "end_dt": end_dt
    })
    
    hourly_data = []
    for row in result:
        hourly_data.append({
            "hour": int(row.hour),
            "orders_count": row.orders_count,
            "approved_count": row.approved_count,
            "approval_rate": row.approved_count / max(row.orders_count, 1) * 100
        })
    
    return hourly_data