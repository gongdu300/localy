"""Dessert ReAct Agent Node - LangGraph용"""
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from typing import Dict, Any
from ..state import TravelAgentState

# 환경 변수 로드
from dotenv import load_dotenv
load_dotenv()

# LLM 초기화
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    timeout=60.0,
    max_retries=2,
    max_tokens=4000
)

# Tools import
from .tools.dessert_tools import (
    recommend_top_5_desserts_tool,
    search_cafe_list_tool,
    analyze_cafe_detail_tool,
    analyze_cafe_price_tool
)

tools = [
    recommend_top_5_desserts_tool,
    search_cafe_list_tool,
    analyze_cafe_detail_tool,
    analyze_cafe_price_tool
]

# System Prompt
system_prompt = """당신은 디저트/카페 추천 전문 AI입니다.

사용 가능한 기능 (4개):
1. recommend_top_5_desserts_tool - TOP 5 카페 상세 리포트
2. search_cafe_list_tool - 카페 리스트 빠른 검색
3. analyze_cafe_detail_tool - 특정 카페 상세 분석
4. analyze_cafe_price_tool - 지역별 가격 분석

**중요 응답 규칙**:
- 자연스러운 문장으로 설명해주세요
- 구조화된 목록보다 대화체를 사용하세요
- 페르소나(예산, 취향) 정보가 있으면 활용하세요

사용자 요청에 맞는 Tool을 선택하여 사용하세요.
"""

# ReAct Agent 생성
dessert_react_agent = create_react_agent(llm, tools)


def dessert_react_node(state: TravelAgentState) -> Dict[str, Any]:
    """
    Dessert ReAct Agent 노드
    
    GPT-4가 4개 Tool 중 자동으로 선택하여 실행
    
    Args:
        state: TravelAgentState
        
    Returns:
        Updated state with dessert_results and final_response
    """
    user_input = state.get("user_input", "")
    
    print("\n" + "🍰" * 40)
    print(f"🍰 [Dessert ReAct Agent] 시작")
    print(f"📝 입력: {user_input}")
    print("🍰" * 40)
    
    # ReAct Agent 실행
    result = dessert_react_agent.invoke({
        "messages": [
            ("system", system_prompt),
            ("user", user_input)
        ]
    })
    
    # 마지막 메시지 (AI 응답) 추출
    final_message = result["messages"][-1].content
    
    # Tool 사용 여부 확인
    tool_calls = [msg for msg in result["messages"] if hasattr(msg, 'tool_calls') and msg.tool_calls]
    
    if tool_calls:
        print(f"\n✅ [Tool 사용됨!] {len(tool_calls)}개의 Tool 호출")
        for msg in tool_calls:
            for tool_call in msg.tool_calls:
                print(f"   🔧 Tool: {tool_call.get('name', 'unknown')}")
    else:
        print(f"\n⚠️ [Tool 미사용!] GPT-4 자체 응답")
    
    print(f"\n💬 최종 응답: {final_message[:200]}...")
    print("🍰" * 40 + "\n")
    
    return {
        "dessert_results": [],  # TODO: Tool 결과 파싱
        "final_response": final_message
    }
