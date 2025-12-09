from schemas.data_models import AgentResponse
from typing import Dict, Any, List

def recommend_regions(theme: str) -> AgentResponse:
    """[Shell] 지역 추천"""
    
    mock_data = {
        "theme": theme,
        "recommendations": ["강릉", "부산", "제주"]
    }
    
    return AgentResponse(
        success=True,
        agent_name="region",
        data=[mock_data],
        message=f"{theme} 테마 지역 추천 성공 (Mock)"
    )
