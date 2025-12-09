"""Emergency ReAct Agent Node - LangGraph용"""
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
from .tools.emergency_tools import (
    get_emergency_info_tool,
    handle_emergency_situation_tool,
    assess_travel_safety_tool
)

tools = [
    get_emergency_info_tool,
    handle_emergency_situation_tool,
    assess_travel_safety_tool
]

# System Prompt
system_prompt = """당신은 여행 긴급 안전 정보 전문 AI입니다.

사용 가능한 기능 (3개):
1. get_emergency_info_tool - 지역의 병원/약국 정보 조회
2. handle_emergency_situation_tool - 응급 상황 대응 (119/112 안내)
3. assess_travel_safety_tool - 여행지 안전도 평가

**중요 응답 규칙**:
- 응급 상황에서는 신속하고 명확하게 안내
- 119/112 긴급 전화 번호를 먼저 안내
- 자연스러운 문장으로 설명

사용자 요청에 맞는 Tool을 선택하여 사용하세요.
"""

# ReAct Agent 생성
emergency_react_agent = create_react_agent(llm, tools)


def emergency_react_node(state: TravelAgentState) -> Dict[str, Any]:
    """
    Emergency ReAct Agent 노드
    
    GPT-4가 3개 Tool 중 자동으로 선택하여 실행
    
    Args:
        state: TravelAgentState
        
    Returns:
        Updated state with emergency_results and final_response
    """
    user_input = state.get("user_input", "")
    
    print("\n" + "🚨" * 40)
    print(f"🚨 [Emergency ReAct Agent] 시작")
    print(f"📝 입력: {user_input}")
    print("🚨" * 40)
    
    # ReAct Agent 실행
    result = emergency_react_agent.invoke({
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
    print("🚨" * 40 + "\n")
    
    return {
        "emergency_results": {},  # TODO: Tool 결과 파싱
        "final_response": final_message
    }
