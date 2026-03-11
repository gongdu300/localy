"""Orchestrator Node - GPT-4 기반 사용자 의도 파악"""

from langchain_openai import ChatOpenAI
from .state import TravelAgentState


# GPT-4 모델 설정
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1)


def classify_intent(user_input: str) -> str:
    """GPT-4로 사용자 의도를 분류합니다"""
    
    prompt = f"""사용자 입력을 다음 의도 중 하나로 분류하세요:

사용자 입력: "{user_input}"

의도 종류:
- restaurant: 맛집, 음식점, 식당 추천 요청
- itinerary: 여행 일정, 계획, 스케줄 요청  
- chat: 일반 대화, 인사, 감사 등

**한 단어로만 답하세요** (restaurant, itinerary, chat 중 하나만)"""
    
    try:
        response = llm.invoke(prompt)
        intent = response.content.strip().lower()
        
        # 검증
        if intent not in ["restaurant", "itinerary", "chat"]:
            # 폴백: 키워드 기반
            if any(word in user_input.lower() for word in ['맛집', '음식', '식당', '먹을', '레스토랑']):
                return "restaurant"
            elif any(word in user_input.lower() for word in ['일정', '계획', '여행', '스케줄']):
                return "itinerary"
            else:
                return "chat"
        
        return intent
        
    except Exception as e:
        print(f"GPT-4 의도 분류 실패: {e}")
        # 폴백
        if any(word in user_input.lower() for word in ['맛집', '음식', '식당']):
            return "restaurant"
        elif any(word in user_input.lower() for word in ['일정', '계획']):
            return "itinerary"
        return "chat"


def orchestrator_node(state: TravelAgentState) -> TravelAgentState:
    """
    GPT-4 기반 Orchestrator 노드
    - 사용자 의도 파악
    - 에이전트 라우팅 결정
    """
    user_input = state["user_input"]
    
    # GPT-4로 의도 분류
    intent = classify_intent(user_input)
    
    print(f"[Orchestrator - GPT-4] 의도 파악: {intent}")
    
    return {
        "user_intent": intent
    }
