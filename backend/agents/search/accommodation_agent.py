from schemas.data_models import AgentResponse
from typing import Dict, Any, List

def search_accommodations(region: str, preference: str = None) -> AgentResponse:
    """[Shell] 숙소 검색"""
    
    mock_data = [
        {"name": f"{region} 스카이베이 호텔", "type": "Hotel", "rating": 4.5, "price_range": "High", "category": "accommodation", "place_id": "MOCK_A1", "region": region},
        {"name": f"{region} 감성 게스트하우스", "type": "Guesthouse", "rating": 4.2, "price_range": "Low", "category": "accommodation", "place_id": "MOCK_A2", "region": region}
    ]
    
    return AgentResponse(
        success=True,
        agent_name="accommodation",
        data=mock_data,
        message=f"{region} 숙소 검색 성공 (Mock)"
    )
