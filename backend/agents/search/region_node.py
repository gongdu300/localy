"""Region Agent Node for LangGraph"""
from typing import Dict, Any
from ..state import TravelAgentState
from .region_agent import recommend_regions


def extract_destination(text: str) -> str:
    """목적지 추출 (간단 구현)"""
    destinations = ["부산", "제주", "강릉", "경주", "전주", "인천", 
                    "서울", "대구", "광주", "대전", "속초", "여수"]
    
    for dest in destinations:
        if dest in text:
            return dest
    
    return "서울"


def format_region_response(regions: list) -> str:
    """지역 리스트 포맷"""
    if not regions:
        return "❌ 추천 지역을 찾을 수 없습니다."
    
    response = "🗺️ 추천 지역:\n\n"
    for i, r in enumerate(regions[:5], 1):
        response += f"{i}. {r['name']}\n"
        response += f"   {r['description']}\n"
        tags = r.get('tags', [])
        if tags:
            response += f"   🏷️ {', '.join(tags[:3])}\n"
        response += "\n"
    
    return response


def region_node(state: TravelAgentState) -> Dict[str, Any]:
    """
    지역 추천 노드
    
    Args:
        state: TravelAgentState
        
    Returns:
        Updated state with region_results
    """
    user_input = state.get("user_input", "")
    
    # 목적지 추출
    destination = extract_destination(user_input)
    
    print(f"🗺️ [Region Node] 목적지: {destination}")
    
    # 지역 추천 (팀 에이전트 활용)
    result = recommend_regions(destination=destination)
    
    if result.success:
        return {
            "region_results": result.data,
            "selected_region": destination,
            "final_response": format_region_response(result.data)
        }
    else:
        return {
            "region_results": [],
            "selected_region": destination,
            "final_response": f"❌ {result.message}"
        }
