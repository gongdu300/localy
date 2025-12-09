# 03. 설치 및 실행 가이드 (Setup Guide)

## 🛠️ 환경 설정 (Environment Setup)

### 1. 필수 요구사항 (Prerequisites)
- Python 3.10 이상
- PostgreSQL (로컬 설치) -> Port 5432
- Node.js (프론트엔드 실행용)

### 2. 가상환경 및 의존성 설치
```bash
# backend 폴더로 이동
cd backend

# 가상환경 생성 (없는 경우)
python -m venv venv

# 가상환경 활성화 (Windows)
.\venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

### 3. 환경 변수 설정 (.env)
`backend/.env` 파일이 존재해야 하며, 아래 키들이 필수적으로 설정되어야 합니다.
(보안상 실제 키 값은 별도 전달 필요)

```ini

# Database (Remote Dev Server)
DATABASE_URL=mysql+pymysql://travel_dev:travel12!!@192.168.0.222:3306/travel_platform_dev

# OpenAI (GPT-4 / Supervisor / Fallback)
OPENAI_API_KEY=sk-...

# Qwen Character Server (Pinggy URL) -> ★중요: 접속 안 되면 URL 갱신 필요
KAMP_QWEN_URL=https://kknyp-125-6-60-5.a.free.pinggy.link/

# Google Maps (Place Search)
GOOGLE_PLACES_API_KEY=...

# Tavily (Image Search)
TAVILY_API_KEY=...

# Weather
OPENWEATHER_API_KEY=...

# VibeVoice TTS Server
TTS_SERVER_URL=https://api.vibevoice.ai/... (가칭)
```

---

## 🚀 실행 방법 (How to Run)

### 1. 백엔드 서버 실행 (FastAPI)
```bash
cd backend
uvicorn main:app --reload
```
- 서버가 정상 실행되면 `http://127.0.0.1:8000/docs` 접속 가능.
- 초기 실행 시 `create_travel_graph()` 컴파일 로그는 **첫 WebSocket 연결 시**에 뜸 (Lazy Loading).

### 2. 프론트엔드 실행
(별도 터미널)
```bash
cd frontend
npm run dev
```
- 브라우저에서 `http://localhost:5173` 접속.

---

## 🧪 테스트 방법 (Verification Scenarios)

### 1. 맛집 추천 (단순 검색)
- 입력: "강릉 맛집 추천해줘"
- 기대 결과: 지도에 식당 핀이 찍히고, 채팅창에 식당 목록이 뜸. 날씨/숙소 검색은 실행되지 않아야 함.

### 2. 여행 계획 (복합 검색)
- 입력: "강릉 1박 2일 일정 짜줘"
- 기대 결과: 지도에 여러 경로가 표시되고, 날씨/예산 정보가 포함된 상세 일정이 채팅창에 뜸.

### 3. 사진 검색 (갤러리)
- 입력: "경포대 사진 보여줘"
- 기대 결과: 채팅창 내 캐러셀(슬라이드)로 사진들이 뜨고, 캐릭터가 사진 설명을 함.
