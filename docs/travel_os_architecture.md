# Travel OS 완전 설계 문서
## 여행 운영체제 - 캐릭터 AI부터 멀티에이전트 시스템까지

> Travel OS는 파인튜닝된 캐릭터 LLM과 RAG 기반 멀티에이전트 시스템을 결합한 차세대 여행 운영체제입니다.

---

## 📚 목차

1. [시스템 개요](#1-시스템-개요)
2. [전체 아키텍처](#2-전체-아키텍처)
3. [캐릭터 페르소나 레이어](#3-캐릭터-페르소나-레이어)
4. [Orchestrator & 멀티에이전트](#4-orchestrator--멀티에이전트)
5. [데이터 아키텍처 & RAG](#5-데이터-아키텍처--rag)
6. [구현 가이드](#6-구현-가이드)

---

## 1. 시스템 개요

### 1.1 비전

**플랫폼을 넘어선 운영체제**

```
기존 여행 앱           →    Travel OS
├─ 맛집 앱            →    통합 AI 파트너
├─ 숙소 앱            →    실시간 최적화
├─ 일정 앱            →    완전 개인화
└─ 지도 앱            →    무한 확장
```

### 1.2 핵심 차별점

1. **캐릭터 AI** - 까칠냥이/순둥멍멍이/엉뚱수달 (Qwen2.5 파인튜닝)
2. **멀티에이전트** - 10+ 전문 에이전트 협업
3. **Hybrid RAG** - Vector + Graph + Elastic 통합 검색
4. **실시간** - GPS, 혼잡도, 날씨 모니터링

---

## 2. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                      사용자 (음성/텍스트/GPS)                   │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│         캐릭터 페르소나 레이어 (Qwen2.5-14B QLoRA)              │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │까칠냥이   │  │순둥멍멍이 │  │엉뚱수달  │                  │
│  │ :8002    │  │ :8003    │  │ :8004   │                  │
│  └──────────┘  └──────────┘  └──────────┘                 │
│                                                             │
│  역할: 입출력 라우팅 + 캐릭터 일관성 + 감정 표현               │
│  기술: QLoRA 파인튜닝, vLLM 서빙, 7500 샘플/캐릭터            │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│        Orchestrator (GPT-4) - 커널                           │
│  의도 파악 → 에이전트 선택 → 실행 계획 → 결과 통합             │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                  전문 에이전트 레이어                           │
│                                                             │
│  [계획]                [검색]               [실시간]          │
│  일정 계획              맛집 추천             GPS 네비게이션     │
│  숙소 검색              이벤트 검색           날씨 모니터        │
│  예산 관리              리뷰 분석             혼잡도 예측        │
│                                                             │
│  [최적화]                                                    │
│  경로 최적화 (TSP)      교통편 검색                            │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│              하이브리드 데이터 레이어                            │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Vector DB │  │  MySQL   │  │  Neo4j   │  │  Redis   │  │
│  │(ChromaDB)│  │  (정형)   │  │ (관계)   │  │ (캐시)   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  🆓 무료      │  익숙함      │ (Phase 2) │  빠름        │  │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │Elastic   │  │InfluxDB  │  │   S3     │                 │
│  │(전문검색) │  │(시계열)   │  │(미디어)   │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│  (Phase 3)   │  (Phase 2)   │  (Phase 3)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                     외부 API 레이어                            │
│  Google Maps │ Kakao │ Weather │ Booking │ 공공데이터        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 캐릭터 페르소나 레이어

### 3.1 파인튜닝 모델 사양

**베이스 모델:** Qwen2.5-14B-Instruct  
**파인튜닝:** QLoRA (4-bit)  
**데이터:** 캐릭터당 7,500 샘플  
**서빙:** vLLM (OpenAI 호환 API)

| 캐릭터 | 성격 | 말투 | 포트 | 샘플 데이터 |
|--------|------|------|------|-------------|
| 까칠냥이 😾 | 츤데레, 직설적 | ~냥 | 8002 | kkachil_cat_generated.jsonl |
| 순둥멍멍이 🐶 | 친절, 열정적 | ~멍 | 8003 | sundong_dog_generated.jsonl |
| 엉뚱수달 🦦 | 창의적, 4차원 | ~달 | 8004 | eongddong_otter_generated.jsonl |

### 3.2 역할 & 책임

```python
class CharacterPersonaLayer:
    """캐릭터 페르소나 레이어"""
    
    def __init__(self, character="kkachil"):
        self.character_llm = QwenFineTuned(f"{character}-merged")
        self.backend_orchestrator = OrchestratorClient()
    
    async def handle_user_input(self, message: str):
        """사용자 입력 처리"""
        
        # 1. 요청 복잡도 판단
        complexity = self.assess_complexity(message)
        
        if complexity == "simple":
            # 직접 답변 (간단한 인사, 질문)
            return await self.character_llm.invoke(message)
        
        else:
            # 2. 백엔드 에이전트에 위임
            response = "계산 좀 해볼게냥! 잠깐만 기다려라냥~"
            await self.send_to_user(response)
            
            # 3. Orchestrator 호출
            result = await self.backend_orchestrator.process(message)
            
            # 4. 결과를 캐릭터 말투로 변환
            final = await self.character_llm.invoke({
                "system": "결과를 까칠냥이 말투로 변환...",
                "context": result,
                "user": message
            })
            
            return final
```

### 3.3 배포

```bash
# vLLM 서버 시작
vllm serve /models/kkachil-cat-merged --port 8002
vllm serve /models/sundong-dog-merged --port 8003
vllm serve /models/eongddong-otter-merged --port 8004

# Pinggy 터널
ssh -p 443 -R0:localhost:8002 a.pinggy.io
ssh -p 443 -R0:localhost:8003 a.pinggy.io
```

---

## 4. Orchestrator & 멀티에이전트

### 4.1 Orchestrator (커널)

```python
class OrchestratorAgent:
    """Travel OS의 핵심 조율자"""
    
    async def execute(self, state):
        # 1. 의도 분류
        intent = await self.classify_intent(state['messages'])
        
        # 2. 필요 에이전트 결정
        agents = {
            "plan_trip": ["itinerary", "restaurant", "accommodation", "route"],
            "find_restaurant": ["restaurant", "crowd", "route"],
            "navigate": ["gps", "weather", "crowd"]
        }[intent]
        
        # 3. 실행 계획 생성 (의존성 고려)
        plan = self.create_execution_plan(agents)
        
        # 4. 순차/병렬 실행
        return await self.execute_plan(plan, state)
```

### 4.2 핵심 에이전트

#### Itinerary Planner (일정 계획)
```python
# RAG: 유사 여행 검색
similar_trips = await vector_store.search(f"{destination} {dates}")

# LLM: 개인화 일정 생성
itinerary = await llm.invoke({
    "destination": destination,
    "user_prefs": user_preferences,
    "similar_trips": similar_trips,
    "weather": weather_forecast
})
```

#### Restaurant Finder (맛집 추천)
```python
# 1. ElasticSearch: 전문 검색
results = await elastic.search(cuisine, location)

# 2. Vector DB: 리뷰 임베딩 검색
reviews = await pinecone.search(f"{name} 리뷰")

# 3. 개인화 순위
ranked = personalized_ranking(results, user_prefs)
```

#### Route Optimizer (경로 최적화)
```python
# TSP 알고리즘으로 최적 경로
optimized = tsp_solver.solve(distance_matrix)

# 실시간 교통 정보 반영
for route in routes:
    traffic = await maps_api.get_traffic(route)
    route['duration'] = traffic['duration_in_traffic']
```

#### GPS Navigator (실시간)
```python
# 1초마다 위치 추적
while not complete:
    location = await gps.get_current()
    
    # 경로 이탈 감지
    if is_off_route(location):
        new_route = await recalculate(location, destination)
```

### 4.3 LangGraph 워크플로우

```python
from langgraph.graph import StateGraph

workflow = StateGraph(TravelOSState)

# 노드
workflow.add_node("orchestrator", orchestrator)
workflow.add_node("itinerary", itinerary_planner)
workflow.add_node("restaurant", restaurant_finder)
workflow.add_node("route", route_optimizer)
workflow.add_node("synthesizer", synthesizer)

# 라우팅
workflow.add_conditional_edges(
    "orchestrator",
    lambda s: s['pending_tasks'][0] if s['pending_tasks'] else "synthesizer",
    {
        "itinerary": "itinerary",
        "restaurant": "restaurant",
        "route": "route",
        "synthesizer": "synthesizer"
    }
)

# 각 에이전트 → Orchestrator 복귀
for agent in ["itinerary", "restaurant", "route"]:
    workflow.add_edge(agent, "orchestrator")

app = workflow.compile()
```

---

## 5. 데이터 아키텍처 & RAG

### 5.1 하이브리드 저장 전략

| 데이터 | 저장소 | 이유 |
|--------|--------|------|
| **대화 로그** | ChromaDB + MySQL | 의미 검색 + 시간순 조회 |
| **사용자 선호** | ChromaDB + Neo4j | 유사도 검색 + 관계 분석 |
| **맛집/POI** | ElasticSearch + ChromaDB | 전문 검색 + 의미 검색 |
| **GPS 궤적** | InfluxDB | 시계열 특화 |
| **사진/영상** | S3 + ChromaDB | 파일 저장 + 이미지 임베딩 |
| **관계 데이터** | Neo4j | 친구, POI 연결 |
| **실시간 상태** | Redis | 빠른 읽기/쓰기 |

### 5.2 Hybrid RAG

```python
class HybridRAG:
    """Vector + BM25 + Graph 통합 검색"""
    
    async def retrieve(self, query, user_id):
        # 1. Vector Search (ChromaDB)
        vector_results = await chromadb.query(embedding, user_id)
        
        # 2. BM25 Search (Elastic - Phase 3)
        bm25_results = await elastic.search(query, user_id)
        
        # 3. Graph Search (Neo4j - Phase 2)
        graph_results = await neo4j.find_related(user_id, query)
        
        # 4. Reciprocal Rank Fusion
        fused = self.rrf([vector_results, bm25_results, graph_results])
        
        return fused[:k]
```

### 5.3 Neo4j 관계 그래프

```python
# 사용자 → 음식 선호도
CREATE (u:User {id: "u123"})
CREATE (c:Cuisine {name: "Italian"})
CREATE (u)-[:LIKES {strength: 0.9}]->(c)

# 친구 추천
MATCH (u:User {id: "u123"})-[:FRIEND]->(f:User)
      -[:VISITED {rating: r}]->(p:Place)
WHERE r >= 4.0 AND NOT (u)-[:VISITED]->(p)
RETURN p ORDER BY r DESC LIMIT 10
```

### 5.4 Multi-Layer Cache

```python
# L1: In-Memory (가장 빠름)
if key in memory_cache:
    return memory_cache[key]

# L2: Redis (빠름)
value = await redis.get(key)
if value:
    memory_cache[key] = value
    return value

# L3: MySQL (느림)
value = await mysql.get(key)
if value:
    await redis.set(key, value, ex=3600)
    memory_cache[key] = value
    return value
```

### 5.5 Cold Start 해결

```python
# 신규 사용자 (대화 0개)
if not personal_history:
    return {
        # Fallback 1: 일반 지식
        'general': await knowledge_base.search(query),
        
        # Fallback 2: 인기 추천
        'popular': await get_popular_items(query),
        
        # Fallback 3: 온보딩 설문
        'onboarding': user_onboarding_data
    }
```

---

## 6. 구현 가이드

### 6.1 Phase 1: MVP (3개월)

**Week 1-4: 캐릭터 모델**
- [x] 데이터 생성 (7,500/캐릭터)
- [x] QLoRA 파인튜닝
- [x] vLLM 서빙

**Week 5-8: 기본 에이전트**
- [ ] Orchestrator
- [ ] Itinerary Planner (RAG)
- [ ] Restaurant Finder
- [ ] Route Optimizer

**Week 9-12: 데이터 레이어**
- [ ] ChromaDB (Vector DB) 🆓
- [ ] MySQL (RDS)
- [ ] Redis (Cache)
- [ ] Hybrid RAG

### 6.2 Phase 2: 실시간 (2개월)

- [ ] GPS Navigator
- [ ] Crowd Analytics (ML)
- [ ] Weather Monitor
- [ ] Real-time Pipeline (Kafka)

### 6.3 Phase 3: 고급 기능 (3개월)

- [ ] Neo4j (Graph DB)
- [ ] ElasticSearch (전문 검색)
- [ ] 예약 통합
- [ ] 결제 시스템

### 6.4 시작하기

```bash
# 1. 환경 설정
pip install langgraph langchain openai chromadb mysql-connector-python

# 2. 캐릭터 모델 서빙
vllm serve /models/kkachil-cat-merged --port 8002

# 3. 백엔드 시작
python travel_os_backend.py

# 4. 테스트
curl -X POST http://localhost:8000/chat \
  -d '{"character":"kkachil","message":"부산 여행 추천해줘"}'
```

---

## 🎯 핵심 정리

1. **3-Layer 아키텍처**
   - 캐릭터 페르소나 (Qwen2.5 파인튜닝)
   - Orchestrator + 멀티에이전트 (GPT-4)
   - 하이브리드 데이터 (6개 DB)

2. **Hybrid RAG**
   - Vector (의미) + BM25 (키워드) + Graph (관계)
   - Cold Start 대응 (온보딩/협업 필터링)

3. **확장성**
   - 에이전트 독립 추가
   - API 유연 연동
   - 단계별 구축

---

**Travel OS - 여행의 모든 것을 관장하는 운영체제** 🚀
