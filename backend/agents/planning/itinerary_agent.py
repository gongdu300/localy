
"""
일정 생성 에이전트 (Phase 3)
- 선택된 장소들을 바탕으로 최적의 동선(단순 순서)을 구성하여 상세 일정을 생성합니다.
"""
import logging
from typing import Dict, List
from schemas.data_models import AgentResponse, DailyItinerary, ItineraryItem

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_itinerary(
    day_number: int,
    date: str,
    selected_places: List[Dict]
) -> AgentResponse:
    """
    일차별 상세 일정 생성
    
    Args:
        day_number: N일차 (1, 2, 3...)
        date: 날짜 문자열 ("2025-01-01")
        selected_places: 선택된 장소 리스트 (PlaceData dict 형태)
    
    Returns:
        AgentResponse (data에 DailyItinerary dict 포함)
    """
    try:
        logger.info(f"🗓️ {day_number}일차 일정 생성 중... ({len(selected_places)}곳)")
        
        # 1. 카테고리별 정렬/배치 로직 (임시: 식사 -> 관광 -> 카페 -> 관광 -> 저녁)
        # 실제로는 TSP 알고리즘이나 거리 기반 정렬이 필요하지만, 여기서는 단순 로직 사용
        
        # 카테고리별 분류
        restaurants = [p for p in selected_places if p['category'] == 'restaurant']
        cafes = [p for p in selected_places if p['category'] == 'cafe']
        attractions = [p for p in selected_places if p['category'] in ['tourist_attraction', 'landmark', 'museum']]
        others = [p for p in selected_places if p['category'] not in ['restaurant', 'cafe', 'tourist_attraction', 'landmark', 'museum']]
        
        # 단순 스케줄링 순서: 관광 -> 점심 -> 관광 -> 카페 -> 관광 -> 저녁
        schedule_slots = []
        
        # 오전 관광 (1곳)
        if attractions: schedule_slots.append(("10:00", attractions.pop(0), "1시간 30분"))
        
        # 점심 (1곳)
        if restaurants: schedule_slots.append(("12:00", restaurants.pop(0), "1시간"))
        
        # 오후 관광 (1곳)
        if attractions: schedule_slots.append(("13:30", attractions.pop(0), "2시간"))
        
        # 카페 (1곳)
        if cafes: schedule_slots.append(("16:00", cafes.pop(0), "1시간"))
        
        # 나머지 관광 다 넣기
        current_hour = 17
        while attractions:
            schedule_slots.append((f"{current_hour}:30", attractions.pop(0), "1시간"))
            current_hour += 1
            
        # 저녁 (남은 식당)
        if restaurants: schedule_slots.append((f"{current_hour}:30", restaurants.pop(0), "1시간 30분"))
        
        # 남은 것들 추가
        for p in others:
            schedule_slots.append(("09:00", p, "자유 시간"))

        # ItineraryItem 생성
        items = []
        for time, place, duration in schedule_slots:
            items.append(ItineraryItem(
                time=time,
                place_name=place['name'],
                place_id=place['place_id'],
                category=place['category'],
                duration=duration,
                google_maps_url=place.get('google_maps_url', ''),
                notes=f"{place['region']}의 추천 장소"
            ))
            
        # 결과 객체 생성
        daily_plan = DailyItinerary(
            day_number=day_number,
            date=date,
            items=items,
            total_duration=f"{len(items)}개 일정",
            route_map_url=""  # 나중에 구글 맵 경로 URL 생성 가능
        )
        
        return AgentResponse(
            success=True,
            agent_name="itinerary",
            data=[daily_plan.dict()],
            count=len(items),
            message=f"{day_number}일차 일정 생성 완료! (총 {len(items)}개 코스)"
        )
        
    except Exception as e:
        logger.error(f"❌ 일정 생성 실패: {e}")
        return AgentResponse(
            success=False,
            agent_name="itinerary",
            message="일정 생성 실패",
            error=str(e)
        )


def itinerary_agent_node(state):
    """
    LangGraph용 Itinerary Agent 노드
    
    Args:
        state: TravelAgentState
        
    Returns:
        Updated state with itinerary_results
    """
    user_input = state.get("user_input", "")
    
    # 임시 Mock 응답
    return {
        "itinerary_results": {"plan": "일정 생성 기능은 추후 구현됩니다."},
        "final_response": "🗓️ 일정 생성 기능은 추후 구현됩니다."
    }

