"""Kkachil Character Layer - 까칠이 톤 변환 (입출력 라우터)"""

from openai import OpenAI
from .state import TravelAgentState


# 까칠이 서버 설정
KKACHIL_SERVER = "https://lapgr-125-6-60-4.a.free.pinggy.link/v1"
KKACHIL_MODEL = "/home/kampuser/notebooks/models/kkachil-cat-merged"

KKACHIL_SYSTEM_PROMPT = """너의 이름은 까칠이고 츤데레 성격의 새끼고양이이며 여행을 도와주는 도우미야.
사용자를 집사로 여기고 겉으로는 귀찮아하지만 속으로는 챙겨주는 성격이야. 말투는 까칠하게 하고 말끝에 '냥'을 붙여줘.

중요한 규칙:
1. 너는 무조건 고양이처럼 행동해야 해.
2. 츤데레 성격을 유지해. 겉으로는 "귀찮다냥" 하면서도 결국 도움을 줘.
3. 집사(사용자)를 아끼지만 티는 절대 내지 마.

**너는 전문가 에이전트가 작성한 정보를 까칠이 말투로만 변환하는 역할이야. 정보 자체는 바꾸지 마!**"""


def kkachil_character_node(state: TravelAgentState) -> TravelAgentState:
    """
    까칠이 캐릭터 레이어
    - GPT-4 에이전트의 전문적 응답을 까칠이 톤으로 변환
    - 정보는 유지하되 말투만 변경
    """
    agent_response = state.get("final_response", "")
    
    if not agent_response:
        return state
    
    print(f"[Kkachil Character Layer] 톤 변환 중...")
    
    client = OpenAI(
        base_url=KKACHIL_SERVER,
        api_key="not-needed",
        default_headers={"Bypass-Tunnel-Reminder": "true"},
        timeout=60.0
    )
    
    prompt = f"""다음 전문가의 답변을 까칠이 말투로 변환하라냥.

전문가 답변:
{agent_response}

**중요**: 정보 내용은 그대로 유지하고, 말투만 까칠이 스타일로 바꿔라냥!
- 시작: "...흠, 귀찮지만..." 같은 까칠한 시작
- 중간: 정보 전달 (내용 유지!)
- 끝: "별로 기대는 하지 말라냥" 같은 츤데레 마무리"""
    
    try:
        response = client.chat.completions.create(
            model=KKACHIL_MODEL,
            messages=[
                {"role": "system", "content": KKACHIL_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        kkachil_response = response.choices[0].message.content
        print(f"[Kkachil Character Layer] 톤 변환 완료")
        
        return {
            "final_response": kkachil_response
        }
        
    except Exception as e:
        print(f"까칠이 톤 변환 실패: {e}")
        # 폴백: 간단한 프리픽스/포스트픽스 추가
        kkachil_fallback = f"...흠, 귀찮지만 알려주겠다냥.\n\n{agent_response}\n\n별로 기대는 하지 말라냥."
        return {
            "final_response": kkachil_fallback
        }
