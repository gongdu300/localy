"""Restaurant ReAct Agent Node - LangGraph용"""
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
    timeout=60.0,  # 타임아웃 60초
    max_retries=2,  # 재시도 2회
    max_tokens=4000  # 충분한 응답 길이!
)

# 모든 Tool import
from .tools.restaurant_tools import (
    search_restaurants_tool,
    extract_menu_tool,
    get_restaurant_reviews_tool,
    verify_restaurant_tool,
    compare_restaurants_tool,
    get_restaurant_details_tool,
    extract_reservation_info_tool,
    analyze_menu_price_tool,
    get_parking_info_tool,
    get_pet_friendly_info_tool,
    analyze_rating_distribution_tool,
    calculate_revisit_rate_tool,
    extract_keywords_tool,
    analyze_sentiment_timeline_tool,
    get_advanced_review_analysis_tool,
    get_blog_review_count_tool,
    get_youtube_mentions_tool,
    get_instagram_popularity_tool,
    get_social_data_tool
)

# Tool 리스트 (19개)
tools = [
    search_restaurants_tool,
    extract_menu_tool,
    get_restaurant_reviews_tool,
    verify_restaurant_tool,
    compare_restaurants_tool,
    get_restaurant_details_tool,
    extract_reservation_info_tool,
    analyze_menu_price_tool,
    get_parking_info_tool,
    get_pet_friendly_info_tool,
    analyze_rating_distribution_tool,
    calculate_revisit_rate_tool,
    extract_keywords_tool,
    analyze_sentiment_timeline_tool,
    get_advanced_review_analysis_tool,
    get_blog_review_count_tool,
    get_youtube_mentions_tool,
    get_instagram_popularity_tool,
    get_social_data_tool
]

# System Prompt
system_prompt = """당신은 맛집 추천 전문 AI입니다.

사용 가능한 기능 (19개):
1. search_restaurants_tool - 맛집 검색 (맞춤 추천)
2. extract_menu_tool - 메뉴 추출
3. get_restaurant_reviews_tool - 리뷰 요약
4. verify_restaurant_tool - 맛집 검증
5. compare_restaurants_tool - 맛집 비교
6. get_restaurant_details_tool - 상세 정보 (예약/가격/주차/애완견)
7. get_advanced_review_analysis_tool - 리뷰 분석 (별점/재방문율/키워드/감정)
8. get_social_data_tool - 소셜 데이터 (블로그/유튜브/인스타그램)

**중요 응답 규칙**:
- 구조화된 목록이나 마크다운 형식을 사용하지 마세요
- 대신 자연스러운 문장으로 설명해주세요
- 이미지 링크나 특수 형식을 포함하지 마세요
- 친근하고 대화하듯이 답변해주세요

예시:
- ❌ "**맛집명**: XXX\n- **주소**: XXX"
- ✅ "XXX는 YYY에 위치한 ZZZ 맛집이에요. 평점은 4.5점이고..."

사용자의 요청에 맞는 Tool을 자동으로 선택하여 사용하세요.
"""

# ReAct Agent 생성
restaurant_react_agent = create_react_agent(
    llm,
    tools
)


def restaurant_react_node(state: TravelAgentState) -> Dict[str, Any]:
    """
    Restaurant ReAct Agent 노드
    
    GPT-4가 19개 Tool 중 자동으로 선택하여 실행
    
    Args:
        state: TravelAgentState
        
    Returns:
        Updated state with restaurant_results and final_response
    """
    user_input = state.get("user_input", "")
    
    print("\n" + "🍜" * 40)
    print(f"🍜 [Restaurant ReAct Agent] 시작")
    print(f"📝 입력: {user_input}")
    print("🍜" * 40)
    
    # ReAct Agent 실행 (system prompt를 메시지에 직접 주입)
    result = restaurant_react_agent.invoke({
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
        print(f"\n✅ [Tool 사용됨!] {len(tool_calls)}개의 Tool 호출 감지")
        for msg in tool_calls:
            for tool_call in msg.tool_calls:
                print(f"   🔧 Tool: {tool_call.get('name', 'unknown')}")
    else:
        print(f"\n⚠️ [Tool 미사용!] GPT-4가 자체 지식으로만 응답")
    
    print(f"\n💬 최종 응답 미리보기: {final_message[:200]}...")
    print("🍜" * 40 + "\n")
    
    return {
        "restaurant_results": [],  # TODO: Tool 결과 파싱
        "final_response": final_message
    }
