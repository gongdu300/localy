from schemas.data_models import AgentResponse
from typing import Dict, Any, List

def get_photos(place_id: str) -> AgentResponse:
    """[Shell] 사진 검색"""
    
    return AgentResponse(
        success=True,
        agent_name="photo",
        data=[{"url": "https://example.com/photo.jpg", "caption": "Mock Photo"}],
        message="사진 검색 성공 (Mock)"
    )
