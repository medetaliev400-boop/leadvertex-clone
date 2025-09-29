# Служба для управления DNS через API Beget

import httpx
import logging
import json
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class BegetDNSManager:
    """
    Менеджер для работы с DNS через API Beget
    Документация API: https://beget.com/ru/kb/api/funkczii-dns
    """
    
    def __init__(self):
        from app.core.config import settings
        
        self.api_url = "https://api.beget.com/v1/dns"
        self.login = settings.BEGET_LOGIN
        self.password = settings.BEGET_PASSWORD
        self.domain = settings.MAIN_DOMAIN
        self.frontend_ip = settings.FRONTEND_SERVER_IP
        
        # Проверяем наличие необходимых настроек
        if not all([self.login, self.password, self.domain, self.frontend_ip]):
            logger.warning("Beget DNS credentials not fully configured")
            
    async def _make_request(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Выполнить запрос к API Beget"""
        try:
            # Добавляем аутентификацию
            request_data = {
                "login": self.login,
                "passwd": self.password,
                **data
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.api_url}/{endpoint}",
                    data=request_data
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Проверяем статус ответа
                    if result.get("status") == "success":
                        return result
                    else:
                        logger.error(f"Beget API error: {result.get('error_text', 'Unknown error')}")
                        return {"status": "error", "error": result.get("error_text", "Unknown error")}
                else:
                    logger.error(f"HTTP error {response.status_code}: {response.text}")
                    return {"status": "error", "error": f"HTTP {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"Request error: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    async def create_subdomain(self, subdomain: str, ip: Optional[str] = None) -> bool:
        """
        Создать A-запись для поддомена
        
        Args:
            subdomain: имя поддомена (без основного домена)
            ip: IP адрес (по умолчанию используется FRONTEND_SERVER_IP)
        
        Returns:
            bool: True если успешно создан
        """
        try:
            target_ip = ip or self.frontend_ip
            full_domain = f"{subdomain}.{self.domain}"
            
            logger.info(f"Creating subdomain: {full_domain} -> {target_ip}")
            
            # Сначала получаем текущие записи
            current_records = await self.get_dns_records()
            if current_records.get("status") == "error":
                logger.error("Failed to get current DNS records")
                return False
            
            # Проверяем, есть ли уже такая запись
            existing_records = current_records.get("answer", {}).get("records", [])
            for record in existing_records:
                if record.get("fqdn") == full_domain and record.get("type") == "A":
                    logger.warning(f"A record for {full_domain} already exists")
                    return True  # Считаем успехом, если запись уже есть
            
            # Добавляем новую запись
            new_record = {
                "type": "A",
                "fqdn": full_domain,
                "value": target_ip,
                "priority": 0
            }
            
            # Добавляем к существующим записям
            all_records = existing_records + [new_record]
            
            # Отправляем обновленный список записей
            result = await self._make_request("changeRecords", {
                "fqdn": self.domain,
                "records": json.dumps(all_records)
            })
            
            if result.get("status") == "success":
                logger.info(f"Successfully created subdomain: {full_domain}")
                
                # Ждем некоторое время для распространения DNS
                await asyncio.sleep(2)
                
                return True
            else:
                logger.error(f"Failed to create subdomain: {result.get('error', 'Unknown error')}")
                return False
                
        except Exception as e:
            logger.error(f"Error creating subdomain {subdomain}: {str(e)}")
            return False
    
    async def delete_subdomain(self, subdomain: str) -> bool:
        """
        Удалить A-запись для поддомена
        
        Args:
            subdomain: имя поддомена
            
        Returns:
            bool: True если успешно удален
        """
        try:
            full_domain = f"{subdomain}.{self.domain}"
            
            logger.info(f"Deleting subdomain: {full_domain}")
            
            # Получаем текущие записи
            current_records = await self.get_dns_records()
            if current_records.get("status") == "error":
                logger.error("Failed to get current DNS records")
                return False
            
            # Фильтруем записи, исключая удаляемую
            existing_records = current_records.get("answer", {}).get("records", [])
            filtered_records = [
                record for record in existing_records
                if not (record.get("fqdn") == full_domain and record.get("type") == "A")
            ]
            
            # Если записей стало меньше, значит что-то удалили
            if len(filtered_records) < len(existing_records):
                # Отправляем обновленный список
                result = await self._make_request("changeRecords", {
                    "fqdn": self.domain,
                    "records": json.dumps(filtered_records)
                })
                
                if result.get("status") == "success":
                    logger.info(f"Successfully deleted subdomain: {full_domain}")
                    return True
                else:
                    logger.error(f"Failed to delete subdomain: {result.get('error', 'Unknown error')}")
                    return False
            else:
                logger.warning(f"Subdomain {full_domain} not found in DNS records")
                return True  # Считаем успехом, если записи уже нет
                
        except Exception as e:
            logger.error(f"Error deleting subdomain {subdomain}: {str(e)}")
            return False
    
    async def get_dns_records(self) -> Dict[str, Any]:
        """
        Получить все DNS записи для домена
        
        Returns:
            Dict со списком записей
        """
        try:
            result = await self._make_request("getData", {
                "fqdn": self.domain
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting DNS records: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    async def check_subdomain_exists(self, subdomain: str) -> bool:
        """
        Проверить, существует ли поддомен в DNS
        
        Args:
            subdomain: имя поддомена
            
        Returns:
            bool: True если поддомен существует
        """
        try:
            full_domain = f"{subdomain}.{self.domain}"
            
            records = await self.get_dns_records()
            if records.get("status") == "error":
                return False
            
            existing_records = records.get("answer", {}).get("records", [])
            
            for record in existing_records:
                if record.get("fqdn") == full_domain and record.get("type") == "A":
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking subdomain {subdomain}: {str(e)}")
            return False
    
    async def update_subdomain_ip(self, subdomain: str, new_ip: str) -> bool:
        """
        Обновить IP адрес для поддомена
        
        Args:
            subdomain: имя поддомена
            new_ip: новый IP адрес
            
        Returns:
            bool: True если успешно обновлен
        """
        try:
            full_domain = f"{subdomain}.{self.domain}"
            
            # Получаем текущие записи
            current_records = await self.get_dns_records()
            if current_records.get("status") == "error":
                return False
            
            existing_records = current_records.get("answer", {}).get("records", [])
            updated = False
            
            # Обновляем IP для нужного поддомена
            for record in existing_records:
                if record.get("fqdn") == full_domain and record.get("type") == "A":
                    record["value"] = new_ip
                    updated = True
                    break
            
            if not updated:
                logger.warning(f"Subdomain {full_domain} not found for IP update")
                return False
            
            # Отправляем обновленные записи
            result = await self._make_request("changeRecords", {
                "fqdn": self.domain,
                "records": json.dumps(existing_records)
            })
            
            if result.get("status") == "success":
                logger.info(f"Successfully updated IP for {full_domain} to {new_ip}")
                return True
            else:
                logger.error(f"Failed to update IP: {result.get('error', 'Unknown error')}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating subdomain IP {subdomain}: {str(e)}")
            return False
    
    async def get_subdomain_info(self, subdomain: str) -> Optional[Dict[str, Any]]:
        """
        Получить информацию о поддомене
        
        Args:
            subdomain: имя поддомена
            
        Returns:
            Dict с информацией о записи или None
        """
        try:
            full_domain = f"{subdomain}.{self.domain}"
            
            records = await self.get_dns_records()
            if records.get("status") == "error":
                return None
            
            existing_records = records.get("answer", {}).get("records", [])
            
            for record in existing_records:
                if record.get("fqdn") == full_domain and record.get("type") == "A":
                    return {
                        "subdomain": subdomain,
                        "full_domain": full_domain,
                        "ip": record.get("value"),
                        "type": record.get("type"),
                        "priority": record.get("priority", 0)
                    }
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting subdomain info {subdomain}: {str(e)}")
            return None

# Утилиты для работы с DNS
class DNSUtils:
    """Утилиты для работы с DNS"""
    
    @staticmethod
    async def validate_subdomain_format(subdomain: str) -> tuple[bool, str]:
        """
        Проверить формат поддомена
        
        Returns:
            tuple[bool, str]: (валиден, сообщение об ошибке)
        """
        import re
        
        if not subdomain:
            return False, "Subdomain cannot be empty"
        
        if len(subdomain) < 3:
            return False, "Subdomain must be at least 3 characters long"
        
        if len(subdomain) > 63:
            return False, "Subdomain must not exceed 63 characters"
        
        if not re.match(r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$', subdomain):
            return False, "Subdomain can only contain letters, numbers and hyphens"
        
        if subdomain.startswith('-') or subdomain.endswith('-'):
            return False, "Subdomain cannot start or end with hyphen"
        
        # Запрещенные имена
        forbidden = ['www', 'api', 'admin', 'mail', 'ftp', 'test', 'dev', 'staging', 'demo']
        if subdomain.lower() in forbidden:
            return False, f"Subdomain '{subdomain}' is reserved"
        
        return True, "Valid subdomain"
    
    @staticmethod
    def generate_subdomain_suggestions(base_name: str, count: int = 5) -> list[str]:
        """
        Сгенерировать предложения для поддоменов
        
        Args:
            base_name: базовое имя
            count: количество предложений
            
        Returns:
            list[str]: список предложений
        """
        import re
        from datetime import datetime
        
        # Очищаем базовое имя
        clean_name = re.sub(r'[^a-zA-Z0-9]', '', base_name.lower())
        if len(clean_name) < 3:
            clean_name = "project"
        
        suggestions = []
        year = datetime.now().year
        
        # Базовые варианты
        suggestions.append(clean_name)
        suggestions.append(f"{clean_name}shop")
        suggestions.append(f"{clean_name}store")
        suggestions.append(f"{clean_name}{year}")
        suggestions.append(f"my{clean_name}")
        
        # Добавляем числа если нужно больше вариантов
        for i in range(1, count - len(suggestions) + 1):
            suggestions.append(f"{clean_name}{i}")
        
        return suggestions[:count]