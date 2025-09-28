#!/usr/bin/env python3
"""
Script to create initial data for LeadVertex Clone
"""
import sys
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal

# Add the parent directory to sys.path to import app modules
sys.path.append('/app')

from app.core.database import async_engine, Base, AsyncSessionLocal
from app.core.security import get_password_hash, generate_api_key
from app.models.user import User, Project, ProjectUser, OrderStatus, UserRole, UserStatus
from app.models.order import Order, Product, OrderItem, OrderHistory
from app.models.cpa import SMSTemplate

async def create_initial_data():
    """Create initial data for the application"""
    
    # Create all tables
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as db:
        try:
            # Check if admin user already exists
            from sqlalchemy import select
            stmt = select(User).where(User.email == "admin@leadvertex.ru")
            result = await db.execute(stmt)
            existing_admin = result.scalar_one_or_none()
            
            if existing_admin:
                print("Initial data already exists. Skipping...")
                return
            
            print("Creating initial data...")
            
            # Create admin user
            admin_user = User(
                email="admin@leadvertex.ru",
                hashed_password=get_password_hash("admin123"),
                first_name="Админ",
                last_name="Системы",
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
                is_email_confirmed=True
            )
            db.add(admin_user)
            await db.flush()
            
            # Create operator user
            operator_user = User(
                email="operator@leadvertex.ru",
                hashed_password=get_password_hash("operator123"),
                first_name="Иван",
                last_name="Операторов",
                role=UserRole.OPERATOR,
                status=UserStatus.ACTIVE,
                is_email_confirmed=True
            )
            db.add(operator_user)
            await db.flush()
            
            # Create demo project
            demo_project = Project(
                name="Демо проект",
                title="Демонстрационный проект LeadVertex",
                description="Проект для демонстрации возможностей системы",
                subdomain="demo",
                owner_id=admin_user.id,
                tariff="CRM Pro",
                api_key=generate_api_key(),
                is_unlimited_orders=True,
                trial_ends_at=datetime.now() + timedelta(days=365)
            )
            db.add(demo_project)
            await db.flush()
            
            # Add users to project
            admin_project_user = ProjectUser(
                project_id=demo_project.id,
                user_id=admin_user.id,
                can_view_orders=True,
                can_edit_orders=True,
                can_delete_orders=True,
                can_view_statistics=True,
                can_manage_users=True
            )
            db.add(admin_project_user)
            
            operator_project_user = ProjectUser(
                project_id=demo_project.id,
                user_id=operator_user.id,
                can_view_orders=True,
                can_edit_orders=True,
                can_delete_orders=False,
                can_view_statistics=True,
                can_manage_users=False,
                auto_assignment=True,
                max_orders_per_day=100
            )
            db.add(operator_project_user)
            
            # Create order statuses
            statuses = [
                {"name": "Новый", "group": "processing", "color": "#2196f3", "position": 1},
                {"name": "Обработка", "group": "processing", "color": "#ff9800", "position": 2},
                {"name": "Принят", "group": "accepted", "color": "#4caf50", "position": 3, "goods_quantity_action": -1},
                {"name": "Отправлен", "group": "shipped", "color": "#9c27b0", "position": 4},
                {"name": "Доставлен", "group": "paid", "color": "#8bc34a", "position": 5},
                {"name": "Отказ", "group": "canceled", "color": "#f44336", "position": 6},
                {"name": "Возврат", "group": "return", "color": "#ff5722", "position": 7},
                {"name": "Спам", "group": "spam", "color": "#795548", "position": 8},
            ]
            
            status_objects = []
            for status_data in statuses:
                status = OrderStatus(
                    project_id=demo_project.id,
                    name=status_data["name"],
                    group=status_data["group"],
                    color=status_data["color"],
                    position=status_data["position"],
                    goods_quantity_action=status_data.get("goods_quantity_action", 0),
                    is_active=True
                )
                db.add(status)
                status_objects.append(status)
            
            await db.flush()
            
            # Create demo products
            products_data = [
                {
                    "name": "Суперпродукт А",
                    "description": "Отличный продукт для демонстрации",
                    "sku": "SUPER-A-001",
                    "price": Decimal("1500.00"),
                    "cost_price": Decimal("800.00"),
                    "stock_quantity": 100,
                    "low_stock_threshold": 10
                },
                {
                    "name": "Мегапродукт Б",
                    "description": "Еще один замечательный товар",
                    "sku": "MEGA-B-002", 
                    "price": Decimal("2500.00"),
                    "cost_price": Decimal("1200.00"),
                    "stock_quantity": 50,
                    "low_stock_threshold": 5
                },
                {
                    "name": "Ультрапродукт В",
                    "description": "Премиум товар высшего качества",
                    "sku": "ULTRA-V-003",
                    "price": Decimal("3500.00"),
                    "cost_price": Decimal("1800.00"),
                    "stock_quantity": 25,
                    "low_stock_threshold": 3
                }
            ]
            
            product_objects = []
            for product_data in products_data:
                product = Product(
                    project_id=demo_project.id,
                    **product_data
                )
                db.add(product)
                product_objects.append(product)
            
            await db.flush()
            
            # Create demo orders
            customers = [
                {"name": "Иван Петров", "phone": "+79991234567", "email": "ivan@example.com"},
                {"name": "Мария Сидорова", "phone": "+79991234568", "email": "maria@example.com"},
                {"name": "Алексей Козлов", "phone": "+79991234569", "email": "alexey@example.com"},
                {"name": "Екатерина Новикова", "phone": "+79991234570", "email": "kate@example.com"},
                {"name": "Дмитрий Волков", "phone": "+79991234571", "email": "dmitry@example.com"},
            ]
            
            for i, customer in enumerate(customers):
                # Random order parameters
                import random
                
                status_index = random.randint(0, len(status_objects) - 1)
                product_index = random.randint(0, len(product_objects) - 1)
                quantity = random.randint(1, 3)
                
                selected_product = product_objects[product_index]
                total_amount = selected_product.price * quantity
                
                order = Order(
                    project_id=demo_project.id,
                    customer_name=customer["name"],
                    customer_phone=customer["phone"],
                    customer_email=customer["email"],
                    country="Россия",
                    city=["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань"][i],
                    total_amount=total_amount,
                    status_id=status_objects[status_index].id,
                    operator_id=operator_user.id if random.choice([True, False]) else None,
                    source="manual",
                    utm_source="demo",
                    utm_medium="initial_data",
                    created_at=datetime.now() - timedelta(days=random.randint(0, 30))
                )
                db.add(order)
                await db.flush()
                
                # Add order item
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=selected_product.id,
                    quantity=quantity,
                    price=selected_product.price,
                    total=total_amount,
                    product_name=selected_product.name,
                    product_sku=selected_product.sku
                )
                db.add(order_item)
                
                # Add order history
                history = OrderHistory(
                    order_id=order.id,
                    user_id=admin_user.id,
                    action="order_created",
                    comment="Заказ создан автоматически при инициализации системы"
                )
                db.add(history)
            
            # Create SMS templates
            sms_templates = [
                {
                    "name": "Подтверждение заказа",
                    "content": "Здравствуйте, {customer_name}! Ваш заказ #{order_id} принят в обработку. Сумма: {total_amount} руб. Спасибо за покупку!"
                },
                {
                    "name": "Заказ отправлен",
                    "content": "{customer_name}, ваш заказ #{order_id} отправлен. Трек-номер: {tracking_number}. Ожидайте доставку!"
                },
                {
                    "name": "Заказ доставлен", 
                    "content": "Ваш заказ #{order_id} доставлен! Если есть вопросы, обращайтесь к нам. Спасибо за покупку!"
                }
            ]
            
            for template_data in sms_templates:
                template = SMSTemplate(
                    project_id=demo_project.id,
                    name=template_data["name"],
                    content=template_data["content"],
                    available_variables=[
                        "customer_name", "order_id", "total_amount", 
                        "tracking_number", "phone", "city", "address"
                    ]
                )
                db.add(template)
            
            await db.commit()
            print("✅ Initial data created successfully!")
            
            print("\n📝 Demo accounts:")
            print("Admin: admin@leadvertex.ru / admin123")
            print("Operator: operator@leadvertex.ru / operator123")
            print(f"\n🔑 Demo project API key: {demo_project.api_key}")
            print("\n🚀 You can now access the application!")
            
        except Exception as e:
            await db.rollback()
            print(f"❌ Error creating initial data: {str(e)}")
            raise

if __name__ == "__main__":
    asyncio.run(create_initial_data())