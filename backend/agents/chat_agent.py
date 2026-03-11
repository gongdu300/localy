"""Simple Chat Agent - GPT-4 기반 일반 대화"""

from langchain_openai import ChatOpenAI
from .state import TravelAgentState


# GPT-4 모델
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)


def chat_agent_node(state: TravelAgentState) -> TravelAgentState:
    """
    GPT-4 기반 일반 대화 에이전트
    """
    user_input = state["user_input"]
    
    print(f"[Chat Agent - GPT-4] 대화 중...")
    
    prompt = f"""사용자가 말했습니다: "{user_input}"

여행 도우미로서 친절하고 전문적으로 응답하세요. 캐릭터 연기 없이 자연스럽게 대화하세요."""
    
    try:
        response = llm.invoke(prompt)
        chat_response = response.content
    except Exception as e:
        print(f"GPT-4 대화 실패: {e}")
        chat_response = "죄송합니다. 응답 생성에 실패했습니다."
    
    print(f"[Chat Agent] 대화 완료")
    
    return {
        "chat_response": chat_response,
        "final_response": chat_response
    }
