# 📦 추가 가이드 - ALL_IN_ONE_GUIDE.md에 추가할 내용

## 1. 5분 빠른 시작 예시 (빠른 시작 섹션에 추가)

### `quickstart.py` - 복사하면 바로 실행!
```python
"""5분 안에 작동하는 최소 예시"""
import os
from dotenv import load_dotenv
import googlemaps
from typing import List, Dict

load_dotenv()
gmaps = googlemaps.Client(key=os.getenv("GOOGLE_PLACES_API_KEY"))

def search_restaurants_quick(region: str, num: int = 5) -> List[Dict]:
    """빠른 맛집 검색"""
    # 1. 좌표 변환
    result = gmaps.geocode(f"{region}, 대한민국")
    coords = result[0]['geometry']['location']
    
    # 2. 검색
    results = gmaps.places_nearby(
        location=(coords['lat'], coords['lng']),
        radius=3000,
        type="restaurant",
        language="ko"
    )
    
    # 3. Top N
    places = []
    for place in results['results'][:num]:
        places.append({
            'name': place['name'],
            'rating': place.get('rating', 0),
            'address': place.get('vicinity', ''),
            'maps_url': f"https://www.google.com/maps/place/?q=place_id:{place['place_id']}"
        })
    
    return places

# 테스트
if __name__ == "__main__":
    print("🔍 강릉 맛집 검색 중...")
    restaurants = search_restaurants_quick("강릉 경포대")
    
    print(f"\n✅ {len(restaurants)}개 발견!\n")
    for i, r in enumerate(restaurants, 1):
        print(f"{i}. {r['name']} - ⭐{r['rating']}")
        print(f"   📍 {r['address']}")
        print(f"   🔗 {r['maps_url']}\n")
```

**실행:** `python quickstart.py`

**이 코드가 작동하면 → 환경 설정 완료!**

---

## 2. 오케스트레이터 완전 구현 (새 섹션 추가)

### `orchestrator.py` - Phase 1 오케스트레이터
```python
"""Phase 1 오케스트레이터 - LLM이 자동으로 에이전트 선택"""
from langchain_openai import ChatOpenAI
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from schemas.data_models import TravelState

SYSTEM_PROMPT = """
당신은 친근한 한국 여행 플래너입니다. 🌟

## 대화 흐름
1. 목적지 확인
2. 날짜, 인원, 예산 수집
3. 지역 추천
4. 맛집/카페/관광지 검색
5. 사용자 선택
6. 일정 생성

## 응답 스타일
- 이모지 사용 😊
- 친근한 반말
- 한 번에 하나씩 물어보기

## 현재 상태
{state_summary}
"""

class TravelOrchestrator:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
        self.state = TravelState()
        
        # 툴 등록 (에이전트들)
        from tools.restaurant_tool import search_restaurants_tool
        from tools.dessert_tool import search_desserts_tool
        # ... 나머지 툴들
        
        self.tools = [
            search_restaurants_tool,
            search_desserts_tool,
            # ...
        ]
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="chat_history"),
            ("user", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        self.agent = create_openai_functions_agent(
            self.llm, self.tools, self.prompt
        )
        self.executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=False
        )
    
    def chat(self, user_input: str) -> str:
        """사용자 입력 처리"""
        state_summary = f"목적지: {self.state.destination or '미정'}"
        
        response = self.executor.invoke({
            "input": user_input,
            "chat_history": self.state.chat_history,
            "state_summary": state_summary
        })
        
        # 대화 저장
        self.state.chat_history.append({"role": "user", "content": user_input})
        self.state.chat_history.append({"role": "assistant", "content": response["output"]})
        
        return response["output"]

# 사용 예시
if __name__ == "__main__":
    orchestrator = TravelOrchestrator()
    
    print("🌟 여행 플래너 시작!")
    while True:
        user_input = input("\n사용자: ")
        if user_input.lower() in ["종료", "exit", "quit"]:
            break
        
        response = orchestrator.chat(user_input)
        print(f"\nAI: {response}")
```

---

## 3. FAQ & 에러 해결 (새 섹션 추가)

### 자주 묻는 질문

#### Q1: Google API 키 에러
```
Error: Invalid API key
```
**해결:**
1. `.env` 파일 확인
2. API 키가 올바른지 확인
3. Google Cloud Console에서 Places API 활성화 확인

#### Q2: 검색 결과가 없음
```
AgentResponse(success=True, count=0)
```
**해결:**
1. 지역명이 정확한지 확인 (예: "강릉" → "강릉시")
2. 검색 반경 늘리기 (`radius=5000` → `radius=10000`)
3. 필터 조건 완화 (리뷰 50개 → 10개)

#### Q3: LLM이 툴을 선택하지 않음
**해결:**
1. 툴의 docstring 명확하게 작성
2. 시스템 프롬프트에 툴 사용 예시 추가
3. `verbose=True`로 디버깅

#### Q4: Phase 2/3로 업그레이드 방법?
**Phase 1 → Phase 2:**
1. Supervisor 패턴 추가
2. 에이전트 간 메시지 전달 구현
3. TravelState에 routes, weather_forecast 추가

**Phase 2 → Phase 3:**
1. LangGraph 설치: `pip install langgraph`
2. 워크플로우 정의 (nodes, edges)
3. ConversationContext 활용
4. Checkpoints 구현

---

## 4. 통합 가이드 (INTEGRATION.md로 별도 파일)

### 15개 에이전트 → 1개 시스템

#### Step 1: 모든 에이전트 개발 완료 확인
```bash
ls agents/
# 15개 파일 확인
```

#### Step 2: 모든 툴 생성
```bash
ls tools/
# 15개 툴 파일 확인
```

#### Step 3: orchestrator.py에 툴 등록
```python
from tools.restaurant_tool import search_restaurants_tool
from tools.dessert_tool import search_desserts_tool
# ... 15개 전부 import

self.tools = [
    search_restaurants_tool,
    search_desserts_tool,
    # ... 15개 전부
]
```

#### Step 4: 테스트
```python
python orchestrator.py
```

#### Step 5: main.py 생성
```python
from orchestrator import TravelOrchestrator

def main():
    orch = TravelOrchestrator()
    print("여행 플래너 시작!")
    
    while True:
        user_input = input("\n> ")
        if user_input.lower() == "종료":
            break
        response = orch.chat(user_input)
        print(f"\n{response}")

if __name__ == "__main__":
    main()
```

**완료!** 🎉
