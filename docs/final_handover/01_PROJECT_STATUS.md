# 01. 프로젝트 현황 (Project Status)

## 📌 개요
**Localy Travel OS**는 사용자의 자연어 요청("강릉 여행 짜줘", "맛집 추천해줘")을 분석하여, **5개의 전문화된 AI 에이전트**가 협력하여 최적의 여행 정보를 제공하는 멀티 에이전트 시스템입니다.

현재 **Backend (FastAPI + LangGraph)** 중심으로 개발이 완료되었으며, Frontend(React)와의 연동을 위한 **WebSocket 프로토콜** 및 **실시간 데이터 스트리밍**까지 구현된 상태입니다.

---

## 🏗️ 시스템 아키텍처
```mermaid
graph TD
    User[User (Frontend)] <-->|WebSocket| Server[FastAPI Server]
    Server <-->|Graph Logic| Supervisor[Supervisor Node]
    
    subgraph "Agents (Tools)"
        Supervisor -->|Route| Search[Integrated Search Agent]
        
        Search -->|Call| Place[Restaurant/Landmark Agent]
        Search -->|Call| Shop[Shopping Agent]
        Search -->|Call| Gallery[Photo Gallery Agent]
        Search -->|Call| Accom[Accommodation Agent]
        Search -->|Call| Weather[Weather Agent]
    end
    
    subgraph "Enhancement"
        Search -->|Result| Augment[Budget & Crowd Augmenter]
        Augment -->|Enriched Data| Persona[Qwen Persona Service]
        Persona -->|Character Text| TTS[VibeVoice TTS]
    end
    
    TTS -->|Audio| User
```

---

## ✅ 완료된 기능 (Implemented Features)

### 1. Multi-Agent Workflow (`backend/core/workflow.py`)
- **LangGraph** 기반의 에이전트 오케스트레이션 구현
- **동적 라우팅 (Dynamic Routing)**: 사용자 의도(`analyze_intent`)에 따라 필요한 에이전트만 실행
  - *맛집 검색*: 레스토랑 에이전트만 실행 (빠름)
  - *여행 계획*: 날씨, 숙소, 관광지, 맛집, 예산 등 모든 에이전트 병렬 실행
- **병렬 실행 (Parallel Execution)**: `asyncio`를 활용하여 5개 에이전트 동시 검색 -> 속도 최적화

### 2. Specialized Agents
| 에이전트 | 역할 | 사용 기술/API |
| :--- | :--- | :--- |
| **Restaurant** | 맛집/카페/디저트 검색 | Google Places API (Advanced Filtering) |
| **Accommodation** | 호텔/숙소 검색 | Google Places API |
| **Landmark** | 관광지/명소 검색 | Google Places API |
| **Shopping** | 마트/편의점/시장 검색 | Google Places (Keyword Optimization) |
| **Gallery** | 여행지 사진 수집 | Tavily API (Image Search) |
| **Weather** | 날씨 예보 | OpenWeatherMap API |
| **Budget/Crowd** | 예산 산출/혼잡도 분석 | Kakao Mobility, SK T-Data |

### 3. Character AI & TTS (`backend/core/qwen_client.py`)
- **Qwen 2.5 (72B/14B)** 모델 연동 (Pinggy 터널링)
- **페르소나(Persona)**: 3가지 캐릭터 (까칠냥, 순둥멍, 엉뚱달) 지원
- **TTS (Text-to-Speech)**: VibeVoice 기반 실시간 음성 생성 및 WebSocket 스트리밍
- **다국어 지원**: 한국어(Qwen), 영어(GPT-4) 자동 감지 및 전환

### 4. WebSocket & Protocol (`backend/routers/websocket_chat.py`)
- **실시간 스트리밍**: 텍스트(`text_chunk`), 오디오(`audio_chunk`) 실시간 전송
- **Json Data Payload**: 프론트엔드 UI 렌더링을 위한 구조화된 데이터 전송 (`json_data`)
  - 사진 갤러리 (`gallery`), 일정표 (`daily_plans`), 맛집 리스트 (`shopping`) 별도 전송
- **Fallback**: 사진 렌더링 실패 시 채팅 말풍선 내 마크다운 이미지(`![img](url)`) 자동 삽입

---

## 📂 주요 디렉토리 구조
```
backend/
├── agents/             # 각 에이전트 로직 (shopping, gallery, restaurant 등)
├── core/               # 핵심 로직 (workflow.py, qwen_client.py)
├── routers/            # API 라우터 (websocket_chat.py, langgraph.py)
├── services/           # 외부 서비스 연동 (tts_client.py)
├── final_handover/     # [New] 인수인계 문서 (현재 폴더)
├── main.py             # FastAPI 진입점
└── .env                # 환경 변수 설정
```
