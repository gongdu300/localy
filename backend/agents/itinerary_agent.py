"""Itinerary Planner Agent - GPT-4 기반 여행 일정 생성"""

from langchain_openai import ChatOpenAI
from .state import TravelAgentState


# GPT-4 모델
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)


def itinerary_agent_node(state: TravelAgentState) -> TravelAgentState:
    """
    GPT-4 기반 여행 일정 생성 에이전트
    """
    user_input = state["user_input"]
    
    print(f"[Itinerary Agent - GPT-4] 일정 생성 중...")
    
    # GPT-4로 일정 생성 (객관적 정보)
    prompt = f"""사용자 요청: "{user_input}"

전문 여행 플래너로서 간단한 여행 일정을 작성해주세요.

형식:
1일차:
- 오전: ...
- 오후: ...

2일차:
- 오전: ...
- 오후: ...

**객관적이고 전문적으로** 작성하세요. 캐릭터 연기 없이 실용적인 정보만 제공하세요."""
    
    try:
        response = llm.invoke(prompt)
        itinerary_text = response.content
    except Exception as e:
        print(f"GPT-4 일정 생성 실패: {e}")
        itinerary_text = """1일차:
- 오전: 주요 관광지 방문
- 오후: 현지 맛집 탐방

2일차:
- 오전: 자연 경관 감상
- 오후: 쇼핑 및 귀가"""
    
    print(f"[Itinerary Agent] 일정 생성 완료")
    
    return {
        "itinerary_results": {"text": itinerary_text},
        "final_response": itinerary_text
    }
