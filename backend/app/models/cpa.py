from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, Decimal, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from enum import Enum
from app.core.database import Base

class CPAProgram(Base):
    __tablename__ = "cpa_programs"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Payout settings
    payout_type = Column(String(20), default="fixed")  # fixed, percentage
    payout_amount = Column(Decimal(10, 2), nullable=False)
    payout_currency = Column(String(3), default="RUB")
    
    # Conditions
    min_payout = Column(Decimal(10, 2), default=1000)
    hold_period_days = Column(Integer, default=30)
    
    # Payment triggers
    pay_on_application = Column(Boolean, default=False)
    pay_on_confirmed = Column(Boolean, default=True)
    pay_on_paid = Column(Boolean, default=False)
    
    # Approval settings
    auto_approve_webmasters = Column(Boolean, default=False)
    require_approval = Column(Boolean, default=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=True)
    
    # Limits
    daily_cap = Column(Integer, nullable=True)
    monthly_cap = Column(Integer, nullable=True)
    total_cap = Column(Integer, nullable=True)
    
    # Targeting
    allowed_countries = Column(JSON, default=list)
    blocked_countries = Column(JSON, default=list)
    allowed_traffic_sources = Column(JSON, default=list)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    project = relationship("Project", back_populates="cpa_programs")
    webmaster_programs = relationship("WebmasterProgram", back_populates="cpa_program")
    
class WebmasterProgram(Base):
    __tablename__ = "webmaster_programs"
    
    id = Column(Integer, primary_key=True)
    webmaster_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cpa_program_id = Column(Integer, ForeignKey("cpa_programs.id"), nullable=False)
    
    # Status
    status = Column(String(20), default="pending")  # pending, approved, rejected, blocked
    
    # Personal settings
    personal_payout = Column(Decimal(10, 2), nullable=True)
    personal_conditions = Column(JSON, default=dict)
    
    # Statistics
    total_clicks = Column(Integer, default=0)
    total_orders = Column(Integer, default=0)
    total_approved = Column(Integer, default=0)
    total_earnings = Column(Decimal(10, 2), default=0)
    
    # Balance
    balance = Column(Decimal(10, 2), default=0)
    pending_balance = Column(Decimal(10, 2), default=0)
    
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    webmaster = relationship("User")
    cpa_program = relationship("CPAProgram", back_populates="webmaster_programs")
    clicks = relationship("Click", back_populates="webmaster_program")
    conversions = relationship("Conversion", back_populates="webmaster_program")
    payouts = relationship("Payout", back_populates="webmaster_program")

class LandingPage(Base):
    __tablename__ = "landing_pages"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    name = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False, index=True)
    domain = Column(String(255), nullable=True)
    
    # Content
    html_content = Column(Text, nullable=True)
    css_content = Column(Text, nullable=True)
    js_content = Column(Text, nullable=True)
    
    # SEO
    title = Column(String(255), nullable=True)
    meta_description = Column(Text, nullable=True)
    meta_keywords = Column(String(500), nullable=True)
    
    # Settings
    is_active = Column(Boolean, default=True)
    is_template = Column(Boolean, default=False)
    template_category = Column(String(100), nullable=True)
    
    # Analytics
    views_count = Column(Integer, default=0)
    conversions_count = Column(Integer, default=0)
    
    # Custom fields for forms
    form_fields = Column(JSON, default=list)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    project = relationship("Project", back_populates="landing_pages")
    orders = relationship("Order", back_populates="landing_page")
    clicks = relationship("Click", back_populates="landing_page")

class Click(Base):
    __tablename__ = "clicks"
    
    id = Column(Integer, primary_key=True)
    webmaster_program_id = Column(Integer, ForeignKey("webmaster_programs.id"), nullable=False)
    landing_page_id = Column(Integer, ForeignKey("landing_pages.id"), nullable=False)
    
    # Tracking
    click_id = Column(String(255), unique=True, nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    referer = Column(String(500), nullable=True)
    
    # Geography
    country = Column(String(100), nullable=True)
    city = Column(String(255), nullable=True)
    
    # UTM tags
    utm_source = Column(String(255), nullable=True)
    utm_medium = Column(String(255), nullable=True)
    utm_campaign = Column(String(255), nullable=True)
    utm_content = Column(String(255), nullable=True)
    utm_term = Column(String(255), nullable=True)
    
    # Custom parameters
    custom_params = Column(JSON, default=dict)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    webmaster_program = relationship("WebmasterProgram", back_populates="clicks")
    landing_page = relationship("LandingPage", back_populates="clicks")
    conversion = relationship("Conversion", back_populates="click", uselist=False)

class Conversion(Base):
    __tablename__ = "conversions"
    
    id = Column(Integer, primary_key=True)
    click_id = Column(Integer, ForeignKey("clicks.id"), nullable=False)
    webmaster_program_id = Column(Integer, ForeignKey("webmaster_programs.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    
    # Payout calculation
    payout_amount = Column(Decimal(10, 2), nullable=False)
    payout_status = Column(String(20), default="pending")  # pending, approved, rejected, paid
    
    # Approval
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejected_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(String(500), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    click = relationship("Click", back_populates="conversion")
    webmaster_program = relationship("WebmasterProgram", back_populates="conversions")
    order = relationship("Order")

class Payout(Base):
    __tablename__ = "payouts"
    
    id = Column(Integer, primary_key=True)
    webmaster_program_id = Column(Integer, ForeignKey("webmaster_programs.id"), nullable=False)
    
    amount = Column(Decimal(10, 2), nullable=False)
    currency = Column(String(3), default="RUB")
    
    # Payment details
    payment_method = Column(String(50), nullable=False)  # bank_transfer, wallet, etc.
    payment_details = Column(JSON, nullable=False)  # Card/wallet details
    
    # Status
    status = Column(String(20), default="pending")  # pending, processing, paid, failed
    
    # External transaction
    transaction_id = Column(String(255), nullable=True)
    payment_service = Column(String(100), nullable=True)
    
    # Dates
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    
    # Notes
    admin_notes = Column(Text, nullable=True)
    
    # Relations
    webmaster_program = relationship("WebmasterProgram", back_populates="payouts")

# Automation and Robot Models

class AutomationRule(Base):
    __tablename__ = "automation_rules"
    
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Trigger conditions
    trigger_type = Column(String(50), nullable=False)  # status_change, time_delay, order_created, etc.
    trigger_conditions = Column(JSON, nullable=False)
    
    # Actions
    actions = Column(JSON, nullable=False)  # List of actions to perform
    
    # Settings
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)
    
    # Statistics
    executions_count = Column(Integer, default=0)
    last_executed_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    project = relationship("Project")
    executions = relationship("AutomationExecution", back_populates="rule")

class AutomationExecution(Base):
    __tablename__ = "automation_executions"
    
    id = Column(Integer, primary_key=True)
    rule_id = Column(Integer, ForeignKey("automation_rules.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    
    # Execution details
    status = Column(String(20), default="pending")  # pending, running, completed, failed
    result = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Timing
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    rule = relationship("AutomationRule", back_populates="executions")
    order = relationship("Order")

class RobotCall(Base):
    __tablename__ = "robot_calls"
    
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    
    # Call details
    phone_number = Column(String(20), nullable=False)
    scenario_id = Column(String(100), nullable=False)
    
    # Status
    status = Column(String(20), default="scheduled")  # scheduled, calling, completed, failed
    result = Column(String(50), nullable=True)  # answered, no_answer, busy, failed, etc.
    
    # Audio recording
    recording_url = Column(String(500), nullable=True)
    duration = Column(Integer, nullable=True)  # seconds
    
    # Cost
    cost = Column(Decimal(10, 4), nullable=True)
    
    # Retry logic
    attempt_number = Column(Integer, default=1)
    max_attempts = Column(Integer, default=3)
    retry_delay = Column(Integer, default=60)  # minutes
    
    # Timing
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    next_retry_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    project = relationship("Project")
    order = relationship("Order")

class SMSTemplate(Base):
    __tablename__ = "sms_templates"
    
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    name = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    
    # Variables that can be used in template
    available_variables = Column(JSON, default=list)
    
    # Usage settings
    is_active = Column(Boolean, default=True)
    is_system = Column(Boolean, default=False)
    
    # Statistics
    sent_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    project = relationship("Project")
    sent_messages = relationship("SMSMessage", back_populates="template")

class SMSMessage(Base):
    __tablename__ = "sms_messages"
    
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    template_id = Column(Integer, ForeignKey("sms_templates.id"), nullable=True)
    
    # Message details
    phone_number = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    
    # Status
    status = Column(String(20), default="pending")  # pending, sent, delivered, failed
    provider = Column(String(50), nullable=True)
    external_id = Column(String(255), nullable=True)
    
    # Cost
    cost = Column(Decimal(10, 4), nullable=True)
    
    # Delivery
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    project = relationship("Project")
    order = relationship("Order")
    template = relationship("SMSTemplate", back_populates="sent_messages")