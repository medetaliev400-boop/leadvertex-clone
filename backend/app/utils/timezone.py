import pytz
from datetime import datetime
from typing import Optional

# City to timezone mapping for Russian and CIS cities
CITY_TIMEZONE_MAP = {
    # Russia
    "москва": "Europe/Moscow",
    "санкт-петербург": "Europe/Moscow", 
    "питер": "Europe/Moscow",
    "новосибирск": "Asia/Novosibirsk",
    "екатеринбург": "Asia/Yekaterinburg",
    "нижний новгород": "Europe/Moscow",
    "казань": "Europe/Moscow",
    "челябинск": "Asia/Yekaterinburg",
    "омск": "Asia/Omsk",
    "самара": "Europe/Samara",
    "ростов-на-дону": "Europe/Moscow",
    "уфа": "Asia/Yekaterinburg",
    "красноярск": "Asia/Krasnoyarsk",
    "воронеж": "Europe/Moscow",
    "пермь": "Asia/Yekaterinburg",
    "волгоград": "Europe/Volgograd",
    "краснодар": "Europe/Moscow",
    "саратов": "Europe/Saratov",
    "тюмень": "Asia/Yekaterinburg",
    "тольятти": "Europe/Samara",
    "ижевск": "Europe/Moscow",
    "барнаул": "Asia/Barnaul",
    "ульяновск": "Europe/Ulyanovsk",
    "иркутск": "Asia/Irkutsk",
    "хабаровск": "Asia/Vladivostok",
    "владивосток": "Asia/Vladivostok",
    "ярославль": "Europe/Moscow",
    "махачкала": "Europe/Moscow",
    "томск": "Asia/Tomsk",
    "оренбург": "Asia/Yekaterinburg",
    "кемерово": "Asia/Novokuznetsk",
    "новокузнецк": "Asia/Novokuznetsk",
    "рязань": "Europe/Moscow",
    "астрахань": "Europe/Astrakhan",
    "пенза": "Europe/Moscow",
    "липецк": "Europe/Moscow",
    "тула": "Europe/Moscow",
    "киров": "Europe/Kirov",
    "чебоксары": "Europe/Moscow",
    "калининград": "Europe/Kaliningrad",
    "брянск": "Europe/Moscow",
    "курск": "Europe/Moscow",
    "иваново": "Europe/Moscow",
    "магнитогорск": "Asia/Yekaterinburg",
    "тверь": "Europe/Moscow",
    "ставрополь": "Europe/Moscow",
    "симферополь": "Europe/Simferopol",
    "севастополь": "Europe/Simferopol",
    "сочи": "Europe/Moscow",
    
    # Ukraine
    "киев": "Europe/Kiev",
    "харьков": "Europe/Kiev", 
    "одесса": "Europe/Kiev",
    "днепр": "Europe/Kiev",
    "львов": "Europe/Kiev",
    "запорожье": "Europe/Zaporozhye",
    "кривой рог": "Europe/Kiev",
    "николаев": "Europe/Kiev",
    "мариуполь": "Europe/Kiev",
    "луганск": "Europe/Kiev",
    "винница": "Europe/Kiev",
    "макеевка": "Europe/Kiev",
    "херсон": "Europe/Kiev",
    "полтава": "Europe/Kiev",
    "чернигов": "Europe/Kiev",
    "черкассы": "Europe/Kiev",
    "житомир": "Europe/Kiev",
    "сумы": "Europe/Kiev",
    "хмельницкий": "Europe/Kiev",
    "черновцы": "Europe/Kiev",
    "горловка": "Europe/Kiev",
    "ровно": "Europe/Kiev",
    "каменское": "Europe/Kiev",
    "кропивницкий": "Europe/Kiev",
    "ивано-франковск": "Europe/Kiev",
    "кременчуг": "Europe/Kiev",
    "тернополь": "Europe/Kiev",
    "белая церковь": "Europe/Kiev",
    "краматорск": "Europe/Kiev",
    "мелитополь": "Europe/Zaporozhye",
    "керчь": "Europe/Simferopol",
    "никополь": "Europe/Kiev",
    "бердянск": "Europe/Zaporozhye",
    "славянск": "Europe/Kiev",
    "ужгород": "Europe/Uzhgorod",
    "алчевск": "Europe/Kiev",
    "павлоград": "Europe/Kiev",
    "северодонецк": "Europe/Kiev",
    "евпатория": "Europe/Simferopol",
    "лисичанск": "Europe/Kiev",
    "каменец-подольский": "Europe/Kiev",
    
    # Belarus
    "минск": "Europe/Minsk",
    "гомель": "Europe/Minsk",
    "могилев": "Europe/Minsk",
    "витебск": "Europe/Minsk",
    "гродно": "Europe/Minsk",
    "брест": "Europe/Minsk",
    "бобруйск": "Europe/Minsk",
    "барановичи": "Europe/Minsk",
    "борисов": "Europe/Minsk",
    "пинск": "Europe/Minsk",
    "орша": "Europe/Minsk",
    "мозырь": "Europe/Minsk",
    "новополоцк": "Europe/Minsk",
    "лида": "Europe/Minsk",
    "молодечно": "Europe/Minsk",
    "полоцк": "Europe/Minsk",
    "солигорск": "Europe/Minsk",
    "слуцк": "Europe/Minsk",
    "жлобин": "Europe/Minsk",
    "светлогорск": "Europe/Minsk",
    "речица": "Europe/Minsk",
    "жодино": "Europe/Minsk",
    "слоним": "Europe/Minsk",
    "кобрин": "Europe/Minsk",
    "волковыск": "Europe/Minsk",
    "горки": "Europe/Minsk",
    "несвиж": "Europe/Minsk",
    "новогрудок": "Europe/Minsk",
    "ивье": "Europe/Minsk",
    "дзержинск": "Europe/Minsk",
    "марьина горка": "Europe/Minsk",
    
    # Kazakhstan
    "алматы": "Asia/Almaty",
    "нур-султан": "Asia/Almaty",
    "астана": "Asia/Almaty",
    "шымкент": "Asia/Almaty",
    "актобе": "Asia/Aqtobe",
    "тараз": "Asia/Almaty",
    "павлодар": "Asia/Almaty",
    "усть-каменогорск": "Asia/Almaty",
    "семей": "Asia/Almaty",
    "атырау": "Asia/Aqtau",
    "костанай": "Asia/Qostanay",
    "кызылорда": "Asia/Qyzylorda",
    "уральск": "Asia/Oral",
    "петропавловск": "Asia/Qostanay",
    "актау": "Asia/Aqtau",
    "темиртау": "Asia/Almaty",
    "туркестан": "Asia/Almaty",
    "кокшетау": "Asia/Qostanay",
    "талдыкорган": "Asia/Almaty",
    "экибастуз": "Asia/Almaty",
    "рудный": "Asia/Qostanay",
    "жанаозен": "Asia/Aqtau",
    "балхаш": "Asia/Almaty",
    "сарань": "Asia/Almaty",
    "караганда": "Asia/Almaty",
    "степногорск": "Asia/Qostanay",
    "лисаковск": "Asia/Qostanay",
    "житикара": "Asia/Qostanay",
    "аркалык": "Asia/Qostanay",
    "капчагай": "Asia/Almaty",
    "текели": "Asia/Almaty",
    "жезказган": "Asia/Qyzylorda",
    "форт-шевченко": "Asia/Aqtau",
    
    # Other CIS countries
    "ташкент": "Asia/Tashkent",
    "самарканд": "Asia/Samarkand",
    "ташкент": "Asia/Tashkent",
    "бишкек": "Asia/Bishkek",
    "ош": "Asia/Bishkek",
    "душанбе": "Asia/Dushanbe",
    "худжанд": "Asia/Dushanbe",
    "ашхабад": "Asia/Ashgabat",
    "туркменабат": "Asia/Ashgabat",
    "баку": "Asia/Baku",
    "гянджа": "Asia/Baku",
    "ереван": "Asia/Yerevan",
    "гюмри": "Asia/Yerevan",
    "тбилиси": "Asia/Tbilisi",
    "батуми": "Asia/Tbilisi",
    "кишинев": "Europe/Chisinau",
    "тирасполь": "Europe/Tiraspol"
}

def get_customer_timezone(city: str) -> Optional[str]:
    """
    Get timezone for a city.
    
    Args:
        city: City name in Russian
        
    Returns:
        Timezone string or None if not found
    """
    if not city:
        return None
    
    city_lower = city.lower().strip()
    
    # Direct match
    if city_lower in CITY_TIMEZONE_MAP:
        return CITY_TIMEZONE_MAP[city_lower]
    
    # Try partial matches for compound city names
    for city_key, timezone in CITY_TIMEZONE_MAP.items():
        if city_key in city_lower or city_lower in city_key:
            return timezone
    
    # Default to Moscow time for unknown Russian cities
    return "Europe/Moscow"

def convert_to_local_time(utc_time: datetime, timezone_str: str) -> Optional[datetime]:
    """
    Convert UTC time to local time in specified timezone.
    
    Args:
        utc_time: UTC datetime
        timezone_str: Timezone string (e.g., 'Europe/Moscow')
        
    Returns:
        Local datetime or None if conversion fails
    """
    try:
        utc_tz = pytz.UTC
        local_tz = pytz.timezone(timezone_str)
        
        # Make sure UTC time is timezone aware
        if utc_time.tzinfo is None:
            utc_time = utc_tz.localize(utc_time)
        elif utc_time.tzinfo != utc_tz:
            utc_time = utc_time.astimezone(utc_tz)
        
        # Convert to local time
        local_time = utc_time.astimezone(local_tz)
        
        # Return as naive datetime (without timezone info)
        return local_time.replace(tzinfo=None)
        
    except Exception:
        return None

def convert_to_utc(local_time: datetime, timezone_str: str) -> Optional[datetime]:
    """
    Convert local time to UTC.
    
    Args:
        local_time: Local datetime (naive)
        timezone_str: Timezone string
        
    Returns:
        UTC datetime or None if conversion fails
    """
    try:
        local_tz = pytz.timezone(timezone_str)
        
        # Localize the naive datetime
        localized_time = local_tz.localize(local_time)
        
        # Convert to UTC
        utc_time = localized_time.astimezone(pytz.UTC)
        
        # Return as naive datetime
        return utc_time.replace(tzinfo=None)
        
    except Exception:
        return None

def get_working_hours_status(city: str, current_time: Optional[datetime] = None) -> dict:
    """
    Check if it's working hours in the given city.
    
    Args:
        city: City name
        current_time: Current UTC time (default: now)
        
    Returns:
        Dict with working hours status
    """
    if current_time is None:
        current_time = datetime.utcnow()
    
    timezone_str = get_customer_timezone(city)
    if not timezone_str:
        return {
            "is_working_hours": None,
            "local_time": None,
            "timezone": None
        }
    
    local_time = convert_to_local_time(current_time, timezone_str)
    if not local_time:
        return {
            "is_working_hours": None,
            "local_time": None,
            "timezone": timezone_str
        }
    
    # Business hours: 9:00 - 21:00
    hour = local_time.hour
    is_working = 9 <= hour <= 21
    
    return {
        "is_working_hours": is_working,
        "local_time": local_time,
        "timezone": timezone_str,
        "local_hour": hour
    }

def format_local_time(utc_time: datetime, timezone_str: str, format_str: str = "%H:%M") -> str:
    """
    Format UTC time as local time string.
    
    Args:
        utc_time: UTC datetime
        timezone_str: Timezone string
        format_str: Format string
        
    Returns:
        Formatted time string
    """
    local_time = convert_to_local_time(utc_time, timezone_str)
    if local_time:
        return local_time.strftime(format_str)
    return utc_time.strftime(format_str)