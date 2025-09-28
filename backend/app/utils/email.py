import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict, Any
from pathlib import Path
from jinja2 import Template
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    """Email service for sending notifications"""
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER
    
    def _get_smtp_connection(self):
        """Get SMTP connection"""
        if not all([self.smtp_host, self.smtp_user, self.smtp_password]):
            raise ValueError("SMTP configuration is incomplete")
        
        server = smtplib.SMTP(self.smtp_host, self.smtp_port)
        server.starttls()
        server.login(self.smtp_user, self.smtp_password)
        return server
    
    def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: Optional[str] = None,
        text_content: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        reply_to: Optional[str] = None
    ) -> bool:
        """
        Send email
        
        Args:
            to_emails: List of recipient emails
            subject: Email subject
            html_content: HTML content
            text_content: Plain text content
            attachments: List of attachments with 'filename' and 'content' keys
            reply_to: Reply-to email
            
        Returns:
            True if sent successfully, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = self.from_email
            msg['To'] = ', '.join(to_emails)
            msg['Subject'] = subject
            
            if reply_to:
                msg['Reply-To'] = reply_to
            
            # Add text content
            if text_content:
                text_part = MIMEText(text_content, 'plain', 'utf-8')
                msg.attach(text_part)
            
            # Add HTML content
            if html_content:
                html_part = MIMEText(html_content, 'html', 'utf-8')
                msg.attach(html_part)
            
            # Add attachments
            if attachments:
                for attachment in attachments:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment['content'])
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {attachment["filename"]}'
                    )
                    msg.attach(part)
            
            # Send email
            with self._get_smtp_connection() as server:
                server.sendmail(self.from_email, to_emails, msg.as_string())
            
            logger.info(f"Email sent successfully to {to_emails}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_emails}: {str(e)}")
            return False
    
    def send_template_email(
        self,
        to_emails: List[str],
        template_name: str,
        context: Dict[str, Any],
        subject: str,
        reply_to: Optional[str] = None
    ) -> bool:
        """
        Send email using template
        
        Args:
            to_emails: List of recipient emails
            template_name: Template name (without extension)
            context: Template context variables
            subject: Email subject
            reply_to: Reply-to email
            
        Returns:
            True if sent successfully, False otherwise
        """
        try:
            # Load templates
            template_dir = Path(__file__).parent.parent / "templates" / "emails"
            
            html_template_path = template_dir / f"{template_name}.html"
            text_template_path = template_dir / f"{template_name}.txt"
            
            html_content = None
            text_content = None
            
            # Load HTML template
            if html_template_path.exists():
                with open(html_template_path, 'r', encoding='utf-8') as f:
                    html_template = Template(f.read())
                    html_content = html_template.render(**context)
            
            # Load text template
            if text_template_path.exists():
                with open(text_template_path, 'r', encoding='utf-8') as f:
                    text_template = Template(f.read())
                    text_content = text_template.render(**context)
            
            # Send email
            return self.send_email(
                to_emails=to_emails,
                subject=subject,
                html_content=html_content,
                text_content=text_content,
                reply_to=reply_to
            )
            
        except Exception as e:
            logger.error(f"Failed to send template email {template_name} to {to_emails}: {str(e)}")
            return False

# Global email service instance
email_service = EmailService()

def send_email(
    to_emails: List[str],
    subject: str,
    html_content: Optional[str] = None,
    text_content: Optional[str] = None,
    attachments: Optional[List[Dict[str, Any]]] = None,
    reply_to: Optional[str] = None
) -> bool:
    """Convenience function to send email"""
    return email_service.send_email(
        to_emails=to_emails,
        subject=subject,
        html_content=html_content,
        text_content=text_content,
        attachments=attachments,
        reply_to=reply_to
    )

def send_template_email(
    to_emails: List[str],
    template_name: str,
    context: Dict[str, Any],
    subject: str,
    reply_to: Optional[str] = None
) -> bool:
    """Convenience function to send template email"""
    return email_service.send_template_email(
        to_emails=to_emails,
        template_name=template_name,
        context=context,
        subject=subject,
        reply_to=reply_to
    )

# Predefined email templates

def send_welcome_email(user_email: str, user_name: str, confirmation_link: str) -> bool:
    """Send welcome email with confirmation link"""
    return send_template_email(
        to_emails=[user_email],
        template_name="welcome",
        context={
            "user_name": user_name,
            "confirmation_link": confirmation_link
        },
        subject="Добро пожаловать в LeadVertex!"
    )

def send_password_reset_email(user_email: str, user_name: str, reset_link: str) -> bool:
    """Send password reset email"""
    return send_template_email(
        to_emails=[user_email],
        template_name="password_reset",
        context={
            "user_name": user_name,
            "reset_link": reset_link
        },
        subject="Сброс пароля LeadVertex"
    )

def send_order_notification_email(
    user_email: str,
    order_data: Dict[str, Any],
    template_name: str = "order_notification"
) -> bool:
    """Send order notification email"""
    return send_template_email(
        to_emails=[user_email],
        template_name=template_name,
        context={"order": order_data},
        subject=f"Уведомление о заказе #{order_data.get('id')}"
    )

def send_project_invitation_email(
    user_email: str,
    project_name: str,
    inviter_name: str,
    accept_link: str
) -> bool:
    """Send project invitation email"""
    return send_template_email(
        to_emails=[user_email],
        template_name="project_invitation",
        context={
            "project_name": project_name,
            "inviter_name": inviter_name,
            "accept_link": accept_link
        },
        subject=f"Приглашение в проект {project_name}"
    )

def send_low_stock_alert_email(
    user_email: str,
    products: List[Dict[str, Any]],
    project_name: str
) -> bool:
    """Send low stock alert email"""
    return send_template_email(
        to_emails=[user_email],
        template_name="low_stock_alert",
        context={
            "products": products,
            "project_name": project_name
        },
        subject=f"Внимание: низкие остатки товаров в проекте {project_name}"
    )

def send_daily_summary_email(
    user_email: str,
    summary_data: Dict[str, Any],
    project_name: str
) -> bool:
    """Send daily summary email"""
    return send_template_email(
        to_emails=[user_email],
        template_name="daily_summary",
        context={
            "summary": summary_data,
            "project_name": project_name
        },
        subject=f"Ежедневный отчет по проекту {project_name}"
    )