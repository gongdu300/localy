"""Region ReAct Agent Node for LangGraph"""
from typing import Dict, Any
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from ..state import TravelAgentState

# LLM 초기화
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Region Tools import
from .tools.region_tools import (
    recommend_regions_tool,
    get_region_attractions_tool,
    get_region_best_time_tool,
    get_popular_destinations_tool
)

# Tool 리스트
tools = [
    recommend_regions_tool,
    get_region_attractions_tool,
    get_region_best_time_tool,
    get_popular_destinations_tool
]

# System Prompt
system_prompt = """당신은 지역 및 관광지 추천 전문 AI입니다.

사용 가능한 기능:
1. recommend_regions_tool - 특정 도시의 지역/구역 추천
2. get_region_attractions_tool - 지역의 관광지/명소 검색
3. get_region_best_time_tool - 최적 방문 시간 추천
4. get_popular_destinations_tool - 한국 인기 여행지 추천

사용자의 요청에 맞는 Tool을 자동으로 선택하여 사용하세요.

예시:
- "부산 어디 갈까?" → recommend_regions_tool 사용
- "해운대 명소 알려줘" → get_region_attractions_tool 사용
- "제주도 언제 가는게 좋아?" → get_region_best_time_tool 사용
- "인기 여행지 추천해줘" → get_popular_destinations_tool 사용
"""

# ReAct Agent 생성
region_react_agent = create_react_agent(
    llm,
    tools
)


def region_react_node(state: TravelAgentState) -> Dict[str, Any]:
    """
    Region ReAct Agent 노드
    
    GPT-4가 4개 Tool 중 자동으로 선택하여 실행
    
    Args:
        state: TravelAgentState
        
    Returns:
        Updated state with region_results and final_response
    """
    user_input = state.get("user_input", "")
    
    print(f"🗺️ [Region ReAct Agent] Started: {user_input}")
    
    # ReAct Agent 실행 (system prompt를 메시지에 직접 주입)
    result = region_react_agent.invoke({
        "messages": [
            ("system", system_prompt),
            ("user", user_input)
        ]
    })
    
    # 마지막 메시지 (AI 응답) 추출
    final_message = result["messages"][-1].content
    
    print(f"🗺️ [Region ReAct Agent] Completed")
    
    return {
        "region_results": [],  # TODO: Tool 결과 파싱
        "selected_region": None,
        "final_response": final_message
    }
