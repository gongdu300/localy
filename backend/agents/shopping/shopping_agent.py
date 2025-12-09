"""Shopping Places Finder Agent - Google Places API 활용"""

import os
from typing import TypedDict, List, Dict, Any, Optional
from dotenv import load_dotenv
from langchain_core.tools import tool

from agents.shopping.shopping_tools import (
    search_shopping_tool,
    has_category_keyword,
    search_shopping_by_coords,
    recommend_shopping_tool
)

load_dotenv()

# Google Maps API 키 확인
GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

def shopping_agent_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    쇼핑 장소 추천 에이전트
    - tools.shopping_search_tool.search_shopping_tool
    - tools.shopping_recommend_tool.recommend_shopping_tool
    를 사용해 검색 및 추천을 수행한다.
    """
    user_input = state.get("user_input", "")
    destination = state.get("destination", "")
    
    # 1. destination 확인
    if not destination:
        return {
            "shopping_results": [],
            "final_response": "여행 목적지가 설정되지 않았습니다. 먼저 여행 계획을 세워주세요! 🛍️",
        }
    
    region = destination
    
    # 2. 카테고리가 없으면 안내 메시지
    if not has_category_keyword(user_input):
        return {
            "shopping_results": [],
            "final_response": (
                f"{region}에서 어떤 종류의 쇼핑 장소를 찾으시나요? 🛍️\n\n"
                "예: '편의점', '대형마트', '다이소', '약국' 등으로 검색해주세요."
            ),
        }
    
    # 3. 쇼핑 장소 검색
    shopping_places = search_shopping_tool.invoke(
        {"region": region, "user_input": user_input}
    )
    
    if not shopping_places:
        return {
            "shopping_results": [],
            "final_response": f"{region}에서 쇼핑 장소를 찾지 못했습니다. 다른 지역을 시도해보세요. 😢",
        }
    
    # 4. 추천 메시지 생성
    recommendation = recommend_shopping_tool.invoke(
        {"region": region, "user_input": user_input, "shopping_places": shopping_places}
    )
    
    return {
        "shopping_results": shopping_places,
        "final_response": recommendation,
    }
