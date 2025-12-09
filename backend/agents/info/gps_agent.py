from schemas.data_models import AgentResponse
from typing import Dict, Any, List

def get_gps_info(region: str) -> AgentResponse:
    """[Shell] GPS 및 교통 정보 조회"""
    # TODO: Google Maps / Kakao Mobility API
    
    mock_data = {
        "region": region,
        "traffic_status": "Normal",
        "major_hubs": ["강릉역", "강릉시외버스터미널"]
    }
    
    return AgentResponse(
        success=True,
        agent_name="gps",
        data=[mock_data],
        message=f"{region} 교통 정보 조회 성공 (Mock)"
    )
