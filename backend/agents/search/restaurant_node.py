"""Restaurant Agent Node for LangGraph"""
from typing import Dict, Any
from ..state import TravelAgentState
from .restaurant_agent import search_restaurants


def extract_region(text: str) -> str:
    """텍스트에서 지역명 추출 (간단 구현)"""
    keywords = ["강남", "홍대", "이태원", "명동", "부산", "해운대", "광안리", 
                "제주", "강릉", "경주", "전주", "인천", "서울"]
    
    for keyword in keywords:
        if keyword in text:
            return keyword
    
    return "서울"


def format_restaurant_response(restaurants: list) -> str:
    """맛집 리스트를 사용자 친화적 포맷으로"""
    if not restaurants:
        return "❌ 맛집을 찾을 수 없습니다."
    
    response = "🍜 맛집 추천 결과:\n\n"
    for i, r in enumerate(restaurants[:5], 1):
        response += f"{i}. {r['name']} (⭐ {r.get('rating', 0)})\n"
        response += f"   📍 {r.get('address', 'N/A')}\n"
        if r.get('review_count'):
            response += f"   💬 리뷰 {r['review_count']}개\n"
        response += "\n"
    
    return response


def restaurant_node(state: TravelAgentState) -> Dict[str, Any]:
    """
    맛집 검색 노드
    
    Args:
        state: TravelAgentState
        
    Returns:
        Updated state with restaurant_results
    """
    user_input = state.get("user_input", "")
    
    # 지역 추출
    region = extract_region(user_input)
    
    print(f"🍜 [Restaurant Node] 검색 지역: {region}")
    
    # 맛집 검색 (팀 에이전트 활용)
    result = search_restaurants(
        region=region,
        num_results=5
    )
    
    if result.success:
        return {
            "restaurant_results": result.data,
            "final_response": format_restaurant_response(result.data)
        }
    else:
        return {
            "restaurant_results": [],
            "final_response": f"❌ {result.message}"
        }
