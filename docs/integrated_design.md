# 🎯 Travel OS 통합 시스템 설계 확정안 v1.0

## 📌 전제 조건

**1. MySQL DB** ✅
- **팀 스키마 그대로 사용** (user, persona, board, file)
- `localy-main/backend/models.py` + `init_db.py` 기반

**2. NoSQL / Vector DB** ✅  
- **우리 설계대로 신규 구축**
- ChromaDB (personal_journey + travel_knowledge 컬렉션)
- MongoDB (선택사항, 대화 로그용)

**3. 프론트/백엔드** ✅
- **팀 코드 그대로 사용** (`localy-main/`)

---

## 🏗️ 최종 아키텍처

**핵심 구조: Qwen은 LangGraph의 마지막 노드 (껍데기 역할)**

```
┌─────────────────────────────────────────────────┐
│            Frontend (React + Vite)              │
│           사용자가 캐릭터와 대화                   │
└─────────────────────────────────────────────────┘
                    ↕ REST API
┌─────────────────────────────────────────────────┐
│         Backend API (FastAPI)                   │
│           POST /chat                            │
└─────────────────────────────────────────────────┘
                    ↓
        ┌───────────┴───────────┐
        │                       │
    [MySQL]                 [ChromaDB]
    팀 DB                  RAG Layer
        │                       │
        └───────────┬───────────┘
                    ↓
    ┌───────────────────────────────────┐
    │   LangGraph Orchestrator          │
    │   (모든 노드가 TravelState 공유)    │
    │                                   │
    │  1. analyze_intent (GPT)          │
    │  2. load_context (DB + RAG)       │
    │  3. parallel_search (15개 에이전트)│
    │  4. create_itinerary (GPT)        │
    │  5. validate (GPT)                │
    │  6. save_to_db (MySQL)            │
    │  7. update_memory (RAG)           │
    │  8. qwen_style_transform (Qwen)   │ ← 껍데기!
    │     └─ 캐릭터 말투로 변환만         │
    └───────────────────────────────────┘
                    ↓
            final_response
            (캐릭터 응답)
                    ↓
              Frontend
```

**역할 분담:**
- 🧠 **GPT (OpenAI)**: 모든 추론, 의도 분석, 일정 생성, 검증
- 🔧 **팀 15개 에이전트**: 실제 데이터 검색 (Google Places, 날씨 등)
- 🎭 **Qwen 2.5 14B**: 입출력 캐릭터 변환만 (뇌 없음, 껍데기)

---

## 🗄️ 데이터 레이어 통합

### 1. MySQL (팀 스키마 - 유지)

```sql
-- 기존 테이블 (localy-main/backend/models.py)
user
  - user_seq_no (PK)
  - user_id, user_pw, user_name, user_nickname, user_email
  - user_post, user_addr1, user_addr2
  - user_birth, user_gender
  - user_create_date, user_update_date

persona
  - persona_seq_no (PK)
  - user_seq_no (FK → user)
  - persona_id
  - persona_like_food, persona_hate_food
  - persona_theme
  - persona_like_region, persona_avoid_region
  - persona_transportation
  - persona_travel_budget
  - persona_accommodation_type

board (게시판)
file (파일 업로드)
withdrawn_users (탈퇴 계정)
```

### 2. MySQL 확장 (우리가 추가할 테이블)

```sql
-- 여행 플랜 저장용
trips
  - trip_id (PK)
  - user_seq_no (FK → user)
  - destination
  - start_date, end_date
  - status (planning/active/completed)
  - created_at, updated_at

trip_days
  - day_id (PK)
  - trip_id (FK → trips)
  - date
  - day_index

activities
  - activity_id (PK)
  - trip_day_id (FK → trip_days)
  - time_slot (morning/afternoon/evening)
  - type (eat/visit/move/rest)
  - title
  - place_id (구글 place_id 또는 내부 ID)
  - metadata_json (JSONB)
  - created_by (system/user)

conversation_logs
  - log_id (PK)
  - user_seq_no (FK → user)
  - trip_id (FK → trips, nullable)
  - role (user/core/style)
  - content (TEXT)
  - created_at
```

### 3. Vector DB (ChromaDB - 신규 구축)

```python
# personal_journey collection
{
    "name": "personal_journey",
    "embedding_function": "OpenAIEmbedding", 
    "metadata": {"hnsw:space": "cosine"},
    "document_structure": {
        "id": "unique_id",
        "document": "text_content_to_embed",
        "metadata": {
            "user_seq_no": "int",
            "trip_id": "str",
            "sentiment": "str",  # positive/negative/neutral
            "preference_type": "str",  # avoid_crowded, prefer_quiet
            "summary": "str",
            "original_text": "str",
            "timestamp": "str"
        }
    }
}

# travel_knowledge collection
{
    "name": "travel_knowledge",
    "embedding_function": "OpenAIEmbedding",
    "metadata": {"hnsw:space": "cosine"},
    "document_structure": {
        "id": "unique_id",
        "document": "text_content_to_embed",
        "metadata": {
            "region": "str",  # "Seoul Hongdae", "Osaka Namba"
            "country": "str",
            "category": "str",  # food/nightlife/culture/transport
            "type": "str",  # tip/safety/review_summary
            "title": "str",
            "source": "str",
            "tags": "list[str]"
        }
    }
}
```

---

## 🤖 에이전트 레이어 통합

### 팀의 15개 전문 에이전트 (그대로 사용)

**팀 에이전트 구조 (AGENT_DEVELOPMENT_GUIDE 기준):**

```python
# agents/restaurant_agent.py (팀 코드)
def search_restaurants(region: str, preference: str = None) -> AgentResponse:
    """맛집 검색 - Google Places API 기반"""
    pass

# agents/dessert_agent.py
def search_cafes(region: str, preference: str = None) -> AgentResponse:
    """카페/디저트 검색"""
    pass

# ... 나머지 13개 에이전트
```

**15개 전문 에이전트:**
1. **Restaurant Agent** - 맛집 검색
2. **Dessert Agent** - 카페/디저트 검색
3. **Accommodation Agent** - 숙소 검색
4. **Landmark Agent** - 관광지 검색
5. **Shopping Agent** - 쇼핑 검색
6. **GPS Agent** - 교통/경로 검색
7. **Weather Agent** - 날씨 예보
8. **Itinerary Agent** - 일정 생성
9. **Budget Agent** - 예산 관리
10. **Review Agent** - 리뷰 요약 (LLM)
11. **Photo Agent** - 사진 갤러리
12. **Crowd Agent** - 혼잡도 확인
13. **Translation Agent** - 다국어 번역 (LLM)
14. **Emergency Agent** - 긴급 정보
15. **Region Agent** - 지역 추천

---

## 🧠 Core Brain Layer (우리 설계 - LangGraph Orchestration)

### TravelState (팀 스키마 베이스 + RAG/Style 필드 추가)

```python
from typing import TypedDict, Annotated, List, Dict, Optional
import operator

class TravelState(TypedDict):
    """
    팀의 TravelPlannerState를 베이스로 RAG/Style 필드만 추가
    (AGENT_DEVELOPMENT_GUIDE의 State 스키마 그대로 사용)
    """
    
    # ==================== 팀 State 필드 (그대로) ====================
    # 사용자 입력 & 대화
    user_input: str
    conversation_history: Annotated[List[Dict], operator.add]
    parsed_intent: Optional[Dict]
    
    # 정보 수집 관리
    required_info: List[str]
    collected_info: List[str]
    pending_question: Optional[str]
    is_info_complete: bool
    
    # 사용자 정보
    user_id: Optional[str]  # 팀은 user_id 문자열 사용
    user_persona: Optional[Dict]  # 팀의 persona 스키마
    
    # 여행 기본 정보
    destination: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]
    num_days: Optional[int]
    num_travelers: Optional[int]
    budget: Optional[int]
    
    # 사용자 선호도
    food_preferences: Optional[List[str]]
    accommodation_preference: Optional[str]
    travel_style: Optional[str]
    activity_level: Optional[str]
    special_requests: Optional[List[str]]
    
    # 에이전트 라우팅
    selected_agents: Annotated[List[str], operator.add]
    completed_agents: Annotated[List[str], operator.add]
    next_agent: Optional[str]
    
    # 각 에이전트 수집 데이터
    destination_info: Optional[Dict]
    restaurants: Annotated[List[Dict], operator.add]
    accommodations: Annotated[List[Dict], operator.add]
    desserts: Annotated[List[Dict], operator.add]
    landmarks: Annotated[List[Dict], operator.add]
    weather_info: Optional[Dict]
    gps_data: Optional[Dict]
    
    # 최적화 데이터
    optimized_routes: Annotated[List[Dict], operator.add]
    transport_info: Annotated[List[Dict], operator.add]
    
    # 최종 일정
    itinerary: Annotated[List[Dict], operator.add]
    total_cost: Optional[int]
    
    # 에이전트 간 통신
    messages: Annotated[List[Dict], operator.add]
    
    # 시스템 상태
    current_step: str
    errors: Annotated[List[str], operator.add]
    is_complete: bool
    
    # ==================== 우리가 추가하는 필드 ====================
    # RAG Context (최소 추가)
    rag_personal_docs: Annotated[List[Dict], operator.add]  # personal_journey_index
    rag_knowledge_docs: Annotated[List[Dict], operator.add]  # travel_knowledge_index
    
    # Style Layer
    preferred_character: Optional[str]  # cat/dog/otter
    core_output: Optional[Dict]  # Style Layer로 전달할 JSON
```

### LangGraph 고급 아키텍처 (Production-Grade)

**핵심 특징:**
1. ⚡ **Parallel Execution**: 15개 에이전트 중 독립적인 것들 동시 실행 (5배 속도 향상)
2. 🧩 **Subgraph Modularization**: Planning/Modification 독립 워크플로우
3. 👤 **Human-in-the-Loop**: Checkpoint 기반 중단/재개
4. 🔄 **Error Recovery**: 자동 재시도 + Fallback
5. 📡 **Streaming**: 실시간 진행상황 전달

---

#### 에이전트 분류 (Sequential vs Parallel)

```python
# Sequential Agents (순차 실행 - 의존성 있음)
SEQUENTIAL_AGENTS = [
    "intent",          # 1. 의도 파악
    "missing_info",    # 2. 정보 수집
    "itinerary",       # 3. 일정 생성 (검색 결과 필요)
    "budget",          # 4. 예산 검증
    "constraint",      # 5. 제약 검증
    "memory"           # 6. 메모리 저장
]

# Parallel Agents (병렬 실행 - 독립적, 5배 빠름!)
PARALLEL_AGENTS = {
    "search_group": [
        "restaurant",      # 맛집
        "dessert",         # 카페/디저트
        "accommodation",   # 숙소
        "landmark",        # 관광지
        "shopping"         # 쇼핑
    ],
    "info_group": [
        "weather",         # 날씨
        "gps",             # 교통/경로
        "region"           # 지역 추천
    ],
    "aux_group": [       # 선택적
        "review",          # 리뷰 요약
        "photo",           # 사진
        "crowd",           # 혼잡도
        "emergency",       # 긴급 정보
        "translation"      # 번역
    ]
}
```

---

#### Main Graph (전체 워크플로우)

```python
# core/advanced_graph.py
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver
import asyncio

def create_advanced_travel_graph():
    """Production-Grade LangGraph"""
    
    main_graph = StateGraph(TravelState)
    
    # ===== Phase 1: Intent & Context =====
    main_graph.add_node("analyze_intent", analyze_intent_node)
    main_graph.add_node("load_context", load_context_node)  # DB + RAG
    
    # ===== Phase 2: Information Gathering =====
    main_graph.add_node("check_completeness", check_info_node)
    main_graph.add_node("ask_user", generate_questions_node)
    
    # ===== Phase 3: Planning Subgraph =====
    planning_subgraph = create_planning_subgraph()
    main_graph.add_node("planning", planning_subgraph)
    
    # ===== Phase 4: Modification Subgraph =====
    modification_subgraph = create_modification_subgraph()
    main_graph.add_node("modification", modification_subgraph)
    
    # ===== Phase 6: Style Transform (Qwen) =====
    main_graph.add_node("qwen_style_transform", qwen_style_node)
    
    # ===== Phase 7: Finalization =====
    main_graph.add_node("save_to_db", save_to_db_node)
    main_graph.add_node("update_memory", update_rag_node)
    
    # ===== Routing =====
    main_graph.set_entry_point("analyze_intent")
    
    # Dynamic routing by intent
    main_graph.add_conditional_edges(
        "analyze_intent",
        route_by_intent,
        {
            "new_plan": "load_context",
            "modify_plan": "load_context",
            "ask_info": END,
            "recommend": END
        }
    )
    
    # Info completeness check
    main_graph.add_conditional_edges(
        "check_completeness",
        lambda s: "complete" if s["is_info_complete"] else "incomplete",
        {
            "complete": "planning",
            "incomplete": "ask_user"
        }
    )
    
    # Ask user → END (resume later via checkpoint)
    main_graph.add_edge("ask_user", END)
    
    # Planning/Modification routing
    main_graph.add_conditional_edges(
        "load_context",
        lambda s: s["parsed_intent"]["type"],
        {
            "new_plan": "check_completeness",
            "modify_plan": "modification"
        }
    )
    
    # Validation → Approval
    main_graph.add_edge("planning", "validate")
    main_graph.add_edge("modification", "validate")
    
    main_graph.add_conditional_edges(
        "validate",
        needs_approval,
        {
            True: "wait_approval",
            False: "save_to_db"
        }
    )
    
    # Save → Memory → Qwen → END
    main_graph.add_edge("wait_approval", "save_to_db")
    main_graph.add_edge("save_to_db", "update_memory")
    main_graph.add_edge("update_memory", "qwen_style_transform")  # 👈 Qwen!
    main_graph.add_edge("qwen_style_transform", END)
    
    # Compile with SQLite checkpointer
    return main_graph.compile(
        checkpointer=SqliteSaver.from_conn_string("checkpoints.db"),
        interrupt_before=["wait_approval", "ask_user"]
    )
```

---

#### Planning Subgraph (병렬 검색 포함)

```python
def create_planning_subgraph():
    """Planning 전용 워크플로우"""
    
    graph = StateGraph(TravelState)
    
    # ⚡ 병렬 실행 노드
    graph.add_node("parallel_search", parallel_agent_search_node)
    
    # Sequential nodes
    graph.add_node("create_itinerary", create_itinerary_node)
    graph.add_node("optimize_routes", optimize_routes_node)
    graph.add_node("calculate_budget", calculate_budget_node)
    
    # Flow
    graph.set_entry_point("parallel_search")
    graph.add_edge("parallel_search", "create_itinerary")
    graph.add_edge("create_itinerary", "optimize_routes")
    graph.add_edge("optimize_routes", "calculate_budget")
    graph.add_edge("calculate_budget", END)
    
    return graph.compile()
```

---

#### Parallel Agent Search (5배 속도 향상!)

```python
async def parallel_agent_search_node(state: TravelState) -> dict:
    """15개 에이전트 중 독립적인 것들을 병렬 실행"""
    
    destination = state["destination"]
    
    # 병렬 실행 가능한 에이전트 정의
    PARALLEL_TASKS = {
        # 핵심 장소 검색 (항상 실행)
        "restaurant": (search_restaurants, {
            "region": destination,
            "preference": state.get("food_preferences")
        }),
        "accommodation": (search_accommodations, {
            "region": destination,
            "preference": state.get("accommodation_preference")
        }),
        "landmark": (search_landmarks, {
            "region": destination,
            "preference": state.get("travel_style")
        }),
        "dessert": (search_cafes, {"region": destination}),
        
        # 환경 정보
        "weather": (get_weather_forecast, {
            "region": destination,
            "start_date": state["start_date"],
            "end_date": state["end_date"]
        }),
        "gps": (get_gps_info, {"region": destination}),
        
        # 선택적 (selected_agents에 있으면)
        "shopping": (search_shopping, {"region": destination}),
        "review": (summarize_reviews, {"region": destination}),
        "photo": (get_photos, {"region": destination}),
    }
    
    # 실행할 태스크 생성
    tasks = []
    agent_names = []
    
    for agent_name, (func, kwargs) in PARALLEL_TASKS.items():
        # 핵심 에이전트는 항상, 나머지는 selected_agents 확인
        if agent_name in ["restaurant", "accommodation", "landmark", "weather"] or \
           agent_name in state.get("selected_agents", []):
            tasks.append(asyncio.to_thread(func, **kwargs))
            agent_names.append(agent_name)
    
    # ⚡ 병렬 실행!
    logger.info(f"🚀 병렬 실행: {len(tasks)}개 에이전트")
    start_time = time.time()
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    elapsed = time.time() - start_time
    logger.info(f"✅ 완료: {elapsed:.2f}초 (순차 예상: {elapsed * len(tasks):.2f}초)")
    
    # 결과 매핑
    output = {}
    for agent_name, result in zip(agent_names, results):
        if isinstance(result, Exception):
            logger.error(f"❌ {agent_name} 실패: {result}")
            output[agent_name] = {"success": False, "error": str(result)}
        else:
            output[agent_name] = result
    
    return {
        "restaurants": output.get("restaurant", {}).get("data", []),
        "accommodations": output.get("accommodation", {}).get("data", []),
        "landmarks": output.get("landmark", {}).get("data", []),
        "desserts": output.get("dessert", {}).get("data", []),
        "weather_info": output.get("weather"),
        "gps_data": output.get("gps"),
        "completed_agents": agent_names
    }
```

---

#### Error Recovery (자동 재시도)

```python
def with_retry(max_retries: int = 3):
    """에러 복구 데코레이터"""
    
    def decorator(func):
        async def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                
                except APIError as e:
                    if attempt < max_retries - 1:
                        await asyncio.sleep(2 ** attempt)  # Exponential backoff
                        logger.warning(f"재시도 {attempt + 1}/{max_retries}")
                        continue
                    else:
                        # Fallback: 캐시된 데이터 사용
                        logger.error(f"최종 실패, 캐시 사용")
                        return await get_cached_fallback(*args, **kwargs)
                
                except Exception as e:
                    logger.error(f"예외: {e}")
                    raise
        
        return wrapper
    return decorator

@with_retry(max_retries=3)
async def search_restaurants(region: str, preference: str = None):
    """재시도 + Fallback 적용된 검색"""
    # 실제 구현
    pass
```

---

#### Streaming (실시간 진행상황)

```python
async def stream_planning_progress(state: TravelState):
    """실시간 진행상황 스트리밍"""
    
    async for event in graph.astream_events(state, version="v1"):
        
        if event["event"] == "on_chain_start":
            yield {
                "type": "step_start",
                "step": event["name"],
                "timestamp": event["time"]
            }
        
        elif event["event"] == "on_tool_start":
            yield {
                "type": "agent_call",
                "agent": event["name"],
                "status": "running"
            }
        
        elif event["event"] == "on_chat_model_stream":
            yield {
                "type": "thinking",
                "content": event["data"]["chunk"]
            }
        
        elif event["event"] == "on_chain_end":
            yield {
                "type": "step_complete",
                "step": event["name"],
                "duration": event["run_id"]
            }

# 사용 예시
async for progress in stream_planning_progress(state):
    await websocket.send_json(progress)
```

---

#### Human-in-the-Loop Resume

```python
# 1. 초기 실행 (정보 부족)
config = {"configurable": {"thread_id": "user-123-trip-abc"}}
result = await graph.ainvoke(initial_state, config)

# → "ask_user" 노드에서 중단, 질문 반환
# result = {"pending_question": "예산이 얼마인가요?", ...}

# 2. 사용자 답변 후 재개
updated_state = {
    **result,
    "budget": 500000,
    "is_info_complete": True
}
final_result = await graph.ainvoke(updated_state, config)

# → "planning" 노드부터 재개, 일정 생성 완료
```

## 🎭 Qwen Style Node (LangGraph 마지막 노드)

**역할: GPT가 만든 core_output을 캐릭터 말투로 변환 (껍데기)**

```python
# core/nodes/qwen_style_node.py
from style.qwen_service import QwenStyleService

qwen_service = QwenStyleService()

async def qwen_style_node(state: TravelState) -> dict:
    """
    LangGraph의 마지막 노드
    GPT가 만든 core_output을 캐릭터 말투로 변환
    
    Input:
        - state["core_output"]: GPT가 생성한 구조화된 결과
        - state["preferred_character"]: cat/dog/otter
    
    Output:
        - final_response: 캐릭터 말투로 변환된 최종 응답
        - ui_hints: 프론트엔드 렌더링 힌트
    """
    
    character = state["preferred_character"]  # cat/dog/otter
    core_output = state["core_output"]
    
    # Qwen으로 캐릭터 변환
    styled_output = await qwen_service.apply_character_style(
        character=character,
        core_output=core_output,
        locale="ko-KR"
    )
    
    return {
        "final_response": styled_output["text"],
        "ui_hints": styled_output.get("ui_hints"),
        "character_used": character
    }
```

### Qwen Service 구현

```python
# style/qwen_service.py
from vllm import LLM, SamplingParams
import json

class QwenStyleService:
    def __init__(self):
        self.llm = LLM(
            model="Qwen/Qwen2.5-14B-Instruct",
            tensor_parallel_size=1,
            trust_remote_code=True,
            gpu_memory_utilization=0.9
        )
        
        # LoRA 어댑터 경로 (파인튜닝 후)
        self.lora_adapters = {
            "cat": "./notebooks/lora_adapters/kkachil-cat-lora",
            "dog": "./notebooks/lora_adapters/sundong-dog-lora",
            "otter": "./notebooks/lora_adapters/eongddong-otter-lora"
        }
    
    async def apply_character_style(
        self,
        character: str,  # cat/dog/otter
        core_output: dict,
        locale: str = "ko-KR"
    ) -> dict:
        """
        GPT core_output을 캐릭터 말투로 변환
        
        중요: Qwen은 추론하지 않음! 단순 말투 변환만!
        """
        
        # 프롬프트 생성
        prompt = self._build_character_prompt(character, core_output)
        
        # vLLM 생성
        sampling_params = SamplingParams(
            temperature=0.7,
            top_p=0.9,
            max_tokens=512,
            stop=["</response>"]
        )
        
        # LoRA 사용 여부에 따라
        if character in self.lora_adapters:
            # LoRA 사용
            from vllm.lora.request import LoRARequest
            lora_request = LoRARequest(
                lora_name=character,
                lora_int_id=1,
                lora_local_path=self.lora_adapters[character]
            )
            result = self.llm.generate(
                prompt,
                sampling_params,
                lora_request=lora_request
            )
        else:
            # Prompt-based (LoRA 없을 때)
            result = self.llm.generate(prompt, sampling_params)
        
        # 파싱
        text = result[0].outputs[0].text.strip()
        
        return {
            "version": "1.0",
            "character": character,
            "text": text,
            "ui_hints": self._extract_ui_hints(core_output)
        }
    
    def _build_character_prompt(self, character: str, core_output: dict) -> str:
        """캐릭터 프롬프트 생성"""
        
        character_traits = {
            "cat": "까칠냥이 - 똑부러지고 직설적, ~냥 말투, 도도하지만 실속 챙김",
            "dog": "순둥멍멍이 - 다정하고 친근함, ~멍 말투, 항상 응원하고 격려",
            "otter": "엉뚱수달 - 발랄하고 엉뚱함, ~달 말투, 재치있고 창의적"
        }
        
        return f"""당신은 {character_traits[character]} 캐릭터입니다.

아래 정보를 캐릭터 말투로 자연스럽게 전달하세요.

**중요 규칙:**
1. 정보를 추가하거나 삭제하지 마세요 (데이터 그대로)
2. 숫자, 이름, 장소명 변경 금지
3. 캐릭터 말투만 적용
4. action_id 같은 ID는 절대 바꾸지 마세요

**전달할 정보 (GPT 결과):**
```json
{json.dumps(core_output, ensure_ascii=False, indent=2)}
```

**캐릭터 응답:**"""
    
    def _extract_ui_hints(self, core_output: dict) -> dict:
        """UI 렌더링 힌트 추출"""
        output_type = core_output.get("type", "text")
        
        hints = {
            "layout": "chat",  # default
            "actions": []
        }
        
        if output_type == "itinerary_plan":
            hints["layout"] = "timeline"
            hints["show_map"] = True
        elif output_type == "itinerary_update":
            hints["layout"] = "card"
            hints["highlight"] = core_output.get("changed_day")
        elif output_type == "recommendations":
            hints["layout"] = "grid"
        
        return hints
```

---

## 🔄 전체 요청 플로우 (수정)

```
사용자: "부산 3박 4일 해산물 먹방 여행 짜줘"
   ↓
Frontend → POST /chat
{
  "user_id": "user-123",
  "message": "부산 3박 4일 해산물 먹방 여행 짜줘",
  "character": "cat"
}
   ↓
Backend → LangGraph.ainvoke(state)

┌───────────────────────────────────────┐
│ LangGraph Execution (TravelState 공유) │
├───────────────────────────────────────┤
│ 1. analyze_intent (GPT)               │
│    → intent = "new_plan"              │
├───────────────────────────────────────┤
│ 2. load_context (DB + RAG)            │
│    → persona, rag_docs 로드            │
├───────────────────────────────────────┤
│ 3. check_completeness (GPT)           │
│    → 정보 충분함                       │
├───────────────────────────────────────┤
│ 4. planning_subgraph:                 │
│    ├─ parallel_search (15개 에이전트)  │
│    │  → restaurants, hotels, etc     │
│    ├─ create_itinerary (GPT)         │
│    │  → core_output 생성              │
│    ├─ optimize_routes (GPT)          │
│    └─ calculate_budget (GPT)         │
├───────────────────────────────────────┤
│ 5. validate (GPT)                     │
│    → 예산/시간 검증 통과               │
├───────────────────────────────────────┤
│ 6. save_to_db (MySQL)                 │
│    → trips/activities 저장            │
├───────────────────────────────────────┤
│ 7. update_memory (RAG)                │
│    → personal_journey_index 업데이트  │
├───────────────────────────────────────┤
│ 8. qwen_style_transform (Qwen) 🎭     │
│    Input: core_output = {             │
│       "type": "itinerary_plan",       │
│       "days": [...],                  │
│       "summary": "부산 3박4일 계획"    │
│    }                                  │
│    Output: final_response =           │
│      "야옹~ 부산 3박4일 먹방 플랜      │
│       짜봤다냥 😼 Day1부터 보자냥!"   │
└───────────────────────────────────────┘
   ↓
Backend Response:
{
  "status": "success",
  "character": "cat",
  "message": "야옹~ 부산 3박4일 먹방 플랜 짜봤다냥 😼...",
  "ui_hints": {"layout": "timeline", "show_map": true},
  "trip_id": "trip-abc123"
}
   ↓
Frontend 렌더링
```

**핵심:**
- 🧠 **GPT**: 모든 추론/결정 (1, 2, 3, 4, 5단계)
- 🔧 **팀 에이전트**: 데이터 수집 (4단계 parallel_search)
- 💾 **DB/RAG**: 상태 저장 (6, 7단계)
- 🎭 **Qwen**: 캐릭터 변환만 (8단계, 마지막)

---

## 📂 최종 폴더 구조

```
CAT_Qwen2.5/
├── plan/                          # 설계 문서 (현재 위치 유지)
│   ├── architecture.md
│   ├── multiagent.md
│   ├── interface.md
│   ├── ALL_IN_ONE_GUIDE_팀양식.md
│   └── integrated_design.md       # 👈 이 문서
│
├── frontend/                      # localy-main/src 이동 (또는 심볼릭 링크)
│   └── ...
│
├── backend/                       # localy-main/backend 확장
│   ├── agents/                    # 팀의 15개 에이전트 (그대로)
│   ├── tools/                     # LangChain Tools 래퍼 (신규)
│   ├── core/                      # Core Brain Layer (신규)
│   │   ├── agents/
│   │   │   ├── intent_agent.py
│   │   │   ├── planner_agent.py
│   │   │   ├── modifier_agent.py
│   │   │   ├── constraint_agent.py
│   │   │   └── memory_agent.py
│   │   ├── graph.py               # LangGraph 정의
│   │   └── state.py               # TravelState
│   ├── style/                     # Style Layer (신규)
│   │   ├── qwen_service.py
│   │   └── prompts/
│   ├── rag/                       # RAG Layer (신규)
│   │   ├── indexer.py
│   │   ├── retriever.py
│   │   └── embeddings.py
│   ├── models.py                  # MySQL Models (팀 코드 확장)
│   ├── schemas/                   # Pydantic schemas (팀 코드)
│   ├── routers/                   # API routes (팀 코드 확장)
│   │   ├── chat.py                # 메인 챗봇 endpoint (신규)
│   │   └── trips.py               # 여행 관리 (신규)
│   └── main.py                    # FastAPI app (팀 코드)
│
├── notebooks/                     # Qwen 파인튜닝 (현재 위치)
│   ├── 03_train_kkachil_cat.ipynb
│   ├── 04_train_sundong_dog.ipynb
│   ├── 05_train_eongddong_otter.ipynb
│   └── lora_adapters/
│
├── datasets/                      # 학습 데이터 (현재 위치)
└── docs/                          # 문서 (현재 위치)
```

---

## 🔧 개발 우선순위

### Phase 1: 기반 통합 (1-2주)
- [ ] MySQL 확장 스키마 추가 (trips/activities/conversation_logs)
- [ ] Qdrant 설치 및 2개 컬렉션 생성
- [ ] TravelState 통합 (팀 + 우리 필드)
- [ ] 팀의 15개 에이전트 → LangChain Tools 래핑

### Phase 2: Core Brain 구현 (2-3주)
- [ ] intent_agent 구현
- [ ] planner_agent 구현 (팀 tools 호출)
- [ ] constraint_agent 구현
- [ ] LangGraph workflow 구성
- [ ] /chat API endpoint 구현

### Phase 3: Style Layer 통합 (1-2주)
- [ ] Qwen vLLM 서빙 스크립트
- [ ] Style 변환 로직 구현
- [ ] LoRA 어댑터 로딩 (파인튜닝 모델 사용)

### Phase 4: RAG 구현 (1-2주)
- [ ] personal_journey_index 인덱싱 파이프라인
- [ ] travel_knowledge_index 초기 데이터 구축
- [ ] memory_agent 구현 (자동 인덱싱)
- [ ] retriever 연동

### Phase 5: 통합 테스트 (1주)
- [ ] End-to-end 플로우 검증
- [ ] 프론트엔드 연동 테스트

---

## ✅ 통합 체크리스트

**데이터 레이어:**
- [x] MySQL: 팀 스키마 사용 확정
- [x] MySQL 확장: trips/activities 테이블 설계 완료
- [x] Vector DB: Qdrant 2개 인덱스 설계 완료

**에이전트 레이어:**
- [x] 팀의 15개 에이전트 → Tools로 활용 확정
- [x] Core Brain 6개 에이전트 역할 정의 완료

**아키텍처:**
- [x] Frontend/Backend 분리 확정 (팀 코드 유지)
- [x] Core ↔ Style 인터페이스 설계 완료
- [x] 전체 플로우 정의 완료

**다음 단계:**
- [ ] Phase 1 구현 착수
- [ ] 각 컴포넌트별 상세 구현 계획 수립

---

## 💬 Notes

**비용 고려 제외 (사용자 요청):**
- GPT-4o API 비용 고려 안 함
- Qwen 14B 서빙 인프라 비용 무시
- 개발/검증 단계에서 비용 최적화 미고려

**핵심 원칙:**
- MySQL은 팀 것 그대로
- NoSQL/Vector는 우리 설계대로
- 팀 에이전트는 Tools로 재사용
- Core Brain + Style Layer는 우리가 새로 구축

🎯 **이제 구현만 하면 됨!** 🚀
