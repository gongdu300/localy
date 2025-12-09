"""팀양식 표준 데이터 스키마"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class PlaceData(BaseModel):
    """모든 장소 데이터의 표준 형식"""
    place_id: str = Field(..., description="Google Place ID")
    name: str
    category: str  # restaurant | cafe | hotel | landmark | shopping
    address: str
    latitude: float
    longitude: float
    region: str
    rating: float = 0
    review_count: int = 0
    price_level: int = 0
    opening_hours: List[str] = []
    open_now: Optional[bool] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    images: List[str] = []
    google_maps_url: str
    description: Optional[str] = None
    tags: List[str] = []


class AgentResponse(BaseModel):
    """모든 에이전트의 표준 응답"""
    success: bool
    agent_name: str
    data: List[Dict[str, Any]] = []
    count: int = 0
    message: str
    error: Optional[str] = None


class RegionInfo(BaseModel):
    """지역 정보"""
    name: str
    description: str
    tags: List[str] = []
    parent_region: Optional[str] = None
    google_maps_url: str
    popularity: Optional[int] = None
    best_for: Optional[List[str]] = None


class ItineraryItem(BaseModel):
    """일정 항목"""
    time: str  # "09:00"
    place_name: str
    place_id: str
    category: str
    duration: str  # "1시간"
    google_maps_url: str
    notes: Optional[str] = None

class DailyItinerary(BaseModel):
    """일차별 일정"""
    day_number: int
    date: str
    items: List[ItineraryItem] = []
    total_duration: str
    route_map_url: str  # 전체 경로 지도

class ConversationContext(BaseModel):
    """
    대화 컨텍스트 - Phase 3 LangGraph용
    
    현재 대화 단계, 다음 액션, 조건부 분기 등
    """
    current_step: str  # "collecting_info" | "searching_places" | "creating_itinerary"
    next_action: Optional[str] = None
    pending_questions: List[str] = []
    user_confirmations: Dict[str, bool] = {}
    workflow_state: str = "initial"  # LangGraph 워크플로우 상태


class BudgetData(BaseModel):
    """예산 데이터"""
    total_budget: int
    spent: Dict[str, int] = {}  # {"식비": 50000, "숙박": 150000}
    remaining: int
    warning: bool = False  # 예산 초과 경고
    breakdown: Dict[str, Any] = {}  # 상세 내역


class RouteData(BaseModel):
    """GPS 경로 데이터"""
    origin: str
    destination: str
    mode: str  # "transit" | "driving" | "walking"
    duration: str  # "2시간 30분"
    distance: str  # "237km"
    cost: Optional[str] = None  # "약 25,000원"
    steps: List[Dict[str, Any]] = []
    google_maps_url: str


class AccommodationData(BaseModel):
    """숙박 데이터"""
    name: str
    type: str  # "호텔" | "펜션" | "게스트하우스"
    address: str
    price_range: str  # "30,000원 ~ 50,000원"
    rating: float = 0
    amenities: List[str] = []


class TourAttractionData(BaseModel):
    """관광지 데이터"""
    name: str
    address: str
    admission_fee: str  # "3,000원" | "무료"
    opening_hours: str
    description: str


class WeatherData(BaseModel):
    """날씨 데이터"""
    date: str  # "2025-12-05"
    day_of_week: str  # "금요일"
    temperature_high: int
    temperature_low: int
    condition: str  # "맑음" | "흐림" | "비" | "눈"
    precipitation: int = 0  # 강수 확률 (%)
    icon: str  # "☀️" | "☁️" | "🌧️" | "❄️"

class UserPersona(BaseModel):
    """사용자 여행 페르소나"""
    user_id: str
    age_group: str = "30대"
    travel_style: List[str] = ["힐링", "맛집투어"]
    budget_level: str = "중"  # 저, 중, 고
    food_preferences: List[str] = ["한식", "일식"]
    accommodation_style: str = "호텔"
    interests: List[str] = ["카페", "자연"]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
