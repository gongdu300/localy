from schemas.data_models import AgentResponse
from typing import Dict, Any, List

def search_shopping(region: str) -> AgentResponse:
    """[Shell] 쇼핑 장소 검색"""
    
    mock_data = [
        {"name": "강릉 중앙시장", "type": "Traditional Market"},
        {"name": "안목해변 소품샵", "type": "Souvenir"}
    ]
    
    return AgentResponse(
        success=True,
        agent_name="shopping",
        data=mock_data,
        message=f"{region} 쇼핑 검색 성공 (Mock)"
    )
