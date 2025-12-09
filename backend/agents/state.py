"""State definition for Travel Agent LangGraph system"""

from typing import TypedDict, Annotated, Optional, List, Dict
from operator import add


class TravelAgentState(TypedDict):
    """
    여행 에이전트 시스템의 전체 상태
    """
    # 입력
    user_input: str
    user_intent: str  # "restaurant", "region", "itinerary", "chat"
    
    # 대화 컨텍스트
    conversation_history: Annotated[List[Dict], add]
    
    # 에이전트 결과
    restaurant_results: Optional[List[Dict]]
    region_results: Optional[List[Dict]]  # 신규: 지역 추천 결과
    dessert_results: Optional[List[Dict]]  # 신규
    emergency_results: Optional[Dict]  # 신규
    itinerary_results: Optional[Dict]
    chat_response: Optional[str]
    
    # 일정 생성용
    selected_region: Optional[str]  # 신규: 선택된 지역
    
    # 출력
    final_response: str
