# Import all models here to ensure they are registered with SQLAlchemy
from app.models.user import User, Project, ProjectUser, OrderStatus
from app.models.order import Order, OrderItem, OrderHistory, CallLog, Product, StockMovement
from app.models.cpa import (
    CPAProgram, WebmasterProgram, LandingPage, Click, Conversion, Payout,
    AutomationRule, AutomationExecution, RobotCall, SMSTemplate, SMSMessage
)

# Export all models for easy importing
__all__ = [
    "User", "Project", "ProjectUser", "OrderStatus",
    "Order", "OrderItem", "OrderHistory", "CallLog", "Product", "StockMovement", 
    "CPAProgram", "WebmasterProgram", "LandingPage", "Click", "Conversion", "Payout",
    "AutomationRule", "AutomationExecution", "RobotCall", "SMSTemplate", "SMSMessage"
]