from schemas.data_models import AgentResponse
from typing import Dict, Any, List

def get_weather_forecast(region: str, start_date: str, end_date: str) -> AgentResponse:
    """[Shell] 날씨 예보 조회"""
    # TODO: OpenWeatherMap or KMA API Integration
    
    mock_data = {
        "region": region,
        "forecast": [
            {"date": start_date, "condition": "Sunny", "temp_min": 15, "temp_max": 25},
            {"date": end_date, "condition": "Cloudy", "temp_min": 14, "temp_max": 23}
        ]
    }
    
    return AgentResponse(
        success=True,
        agent_name="weather",
        data=[mock_data],
        message=f"{region} 날씨 정보 조회 성공 (Mock)"
    )
