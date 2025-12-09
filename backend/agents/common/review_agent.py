from schemas.data_models import AgentResponse
from typing import Dict, Any, List

def summarize_reviews(place_id: str) -> AgentResponse:
    """[Shell] 리뷰 요약"""
    
    return AgentResponse(
        success=True,
        agent_name="review",
        data=[{"summary": "뷰가 좋고 커피가 맛있다는 평이 많음."}],
        message="리뷰 요약 성공 (Mock)"
    )
