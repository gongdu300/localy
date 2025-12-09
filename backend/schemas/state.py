"""LangGraph State for Team Agents"""
from typing import TypedDict, Optional, List, Dict, Any
from schemas.data_models import BudgetData


class TeamAgentState(TypedDict):
    """
    팀 에이전트 시스템 상태
    Phase 2: Supervisor + Multi-Agent
    """
    # 사용자 입력
    user_input: str
    messages: List[Dict[str, str]]  # 대화 기록 (OpenAI format)
    
    # 워크플로우 제어
    next_agent: Optional[str]  # Supervisor가 결정
    
    # 여행 정보 (공유 상태)
    budget: Optional[BudgetData]
    routes: List[Dict[str, Any]]
    weather_forecast: List[Dict[str, Any]]
    crowd_info: Optional[Dict[str, Any]]
    places: List[Dict[str, Any]]
    
    # Phase 3: 상세 일정 및 컨텍스트
    daily_plans: Dict[int, Any]  # DailyItinerary (Pydantic to dict)
    context: Optional[Dict[str, Any]]  # ConversationContext (Pydantic to dict)
    
    # 최종 응답
    final_response: str
    
    # Phase 5: Architecture & Shells Extension
    preferred_character: Optional[str]  # 'cat', 'dog', 'otter'
    destination: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]
    parsed_intent: Optional[dict]
    intent_type: Optional[str]  # 'travel' or 'chat'
    search_mode: Optional[str]  # 'travel_plan', 'restaurant_search', etc. [New]
    detected_language: Optional[str]  # 'en' or 'ko' - for TTS and response language
    
    # Shell Agents Data (Optional)
    restaurants: Optional[Any]
    accommodations: Optional[Any]
    desserts: Optional[Any]
    landmarks: Optional[Any]
    weather_info: Optional[Any]
    gps_data: Optional[Any]
    shopping: Optional[Any] # [New] Minwoo
    gallery: Optional[Any] # [New] Minwoo
    budget_info: Optional[Any] # For augmented data
