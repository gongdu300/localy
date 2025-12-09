from schemas.data_models import AgentResponse
from typing import Dict, Any, List

def search_cafes(region: str) -> AgentResponse:
    """[Shell] 카페/디저트 검색"""
    
    mock_data = [
        {"name": f"{region} 뷰 맛집 카페", "menu": "Coffee", "rating": 4.6, "category": "cafe", "place_id": "MOCK_C1", "region": region},
        {"name": f"{region} 디저트 카페", "menu": "Ice Cream", "rating": 4.3, "category": "cafe", "place_id": "MOCK_C2", "region": region}
    ]
    
    return AgentResponse(
        success=True,
        agent_name="dessert",
        data=mock_data,
        message=f"{region} 디저트 검색 성공 (Mock)"
    )
