from schemas.data_models import AgentResponse
from typing import Dict, Any, List

def search_emergency(region: str) -> AgentResponse:
    """[Shell] 긴급 정보 검색"""
    
    mock_data = {
        "hospital": "강릉 아산병원 (033-610-3114)",
        "police": "강릉 경찰서 (112)"
    }
    
    return AgentResponse(
        success=True,
        agent_name="emergency",
        data=[mock_data],
        message=f"{region} 긴급 정보 조회 성공 (Mock)"
    )
