"""LangGraph Workflow - 멀티에이전트 시스템 구축"""

from langgraph.graph import StateGraph, END
from .state import TravelAgentState
from .planning.orchestrator import orchestrator_node
from .search.restaurant_react_node import restaurant_react_node
from .search.region_react_node import region_react_node
from .dessert.dessert_react_node import dessert_react_node  # 신규
from .emergency.emergency_react_node import emergency_react_node  # 신규
from .planning.itinerary_agent import itinerary_agent_node
from .common.chat_agent import chat_agent_node
from .common.character_layer import kkachil_character_node


def route_to_agent(state: TravelAgentState) -> str:
    """
    의도에 따라 적절한 에이전트로 라우팅
    """
    intent = state.get("user_intent", "chat")
    
    if intent == "restaurant":
        return "restaurant"
    elif intent == "region":
        return "region"
    elif intent == "dessert": # 신규
        return "dessert"
    elif intent == "emergency": # 신규
        return "emergency"
    elif intent == "itinerary":
        return "itinerary"
    else:
        return "chat"


def create_travel_agent_graph():
    """
    여행 에이전트 LangGraph 워크플로우 생성
    
    구조:
    사용자 → Orchestrator(GPT-4) → 전문 에이전트(GPT-4) → Kkachil 캐릭터 레이어 → 응답
    """
    # 1. 그래프 생성
    workflow = StateGraph(TravelAgentState)
    
    # 2. 노드 추가
    workflow.add_node("orchestrator", orchestrator_node)  # GPT-4 의도 파악
    workflow.add_node("restaurant", restaurant_react_node)  # ReAct Agent (19개 Tool)
    workflow.add_node("region", region_react_node)  # ReAct Agent (4개 Tool)
    workflow.add_node("dessert", dessert_react_node)  # 신규
    workflow.add_node("emergency", emergency_react_node)  # 신규
    workflow.add_node("itinerary", itinerary_agent_node)  # GPT-4 일정 생성
    workflow.add_node("chat", chat_agent_node)  # GPT-4 일반 대화
    workflow.add_node("kkachil_character", kkachil_character_node)  # 엉뚱수달 톤 변환
    
    # 3. 시작점 설정
    workflow.set_entry_point("orchestrator")
    
    # 4. 조건부 라우팅 (orchestrator → 전문 에이전트)
    workflow.add_conditional_edges(
        "orchestrator",
        route_to_agent,
        {
            "restaurant": "restaurant",
            "region": "region",
            "dessert": "dessert",  # 신규
            "emergency": "emergency",  # 신규
            "itinerary": "itinerary",
            "chat": "chat"
        }
    )
    
    # 5. 전문 에이전트 → 캐릭터 레이어
    workflow.add_edge("restaurant", "kkachil_character")
    workflow.add_edge("region", "kkachil_character")
    workflow.add_edge("dessert", "kkachil_character")  # 신규
    workflow.add_edge("emergency", "kkachil_character")  # 신규
    workflow.add_edge("itinerary", "kkachil_character")
    workflow.add_edge("chat", "kkachil_character")
    
    # 6. 까칠이 캐릭터 레이어 → 종료
    workflow.add_edge("kkachil_character", END)
    
    # 7. 컴파일
    app = workflow.compile()
    
    return app


# 그래프 인스턴스 생성
travel_agent_graph = create_travel_agent_graph()
