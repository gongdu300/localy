# 🐾 Localy - AI 여행 플래너

<p align="center">
  <img src="ERD.png" alt="Localy Logo" width="400"/>
</p>

<p align="center">
  <strong>AI 기반 개인화 여행 계획 플랫폼</strong><br/>
  까칠이 & 순둥이 AI와 함께하는 스마트 여행 계획
</p>

---

## 📖 프로젝트 소개

**Localy**는 AI 챗봇을 활용하여 개인화된 여행 계획을 세울 수 있는 플랫폼입니다.

### 주요 기능
- 🤖 **AI 챗봇 대화** - 까칠이(Kkachil) & 순둥이(Sundong) AI와 실시간 대화
- 🗺️ **여행 일정 생성** - AI 기반 맞춤형 여행 일정 자동 생성
- 👤 **페르소나 분석** - 사용자 성향 분석을 통한 개인화 추천
- 📍 **지도 기반 탐색** - Kakao Maps 연동 장소 탐색
- 🍽️ **맛집 추천** - 목적지 기반 레스토랑 추천
- 🛒 **쇼핑 정보** - 지역별 쇼핑 스팟 안내

---

## 🛠️ 기술 스택

### Frontend
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

### Backend
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)

### AI & APIs
![LangGraph](https://img.shields.io/badge/LangGraph-Agent-FF6F00?style=for-the-badge&logo=langchain&logoColor=white)
![vLLM](https://img.shields.io/badge/vLLM-Custom%20Model-00ADD8?style=for-the-badge)
![Kakao Maps](https://img.shields.io/badge/Kakao%20Maps-API-FFCD00?style=for-the-badge&logo=kakao&logoColor=black)

### UI Components
![Radix UI](https://img.shields.io/badge/Radix%20UI-Components-161618?style=for-the-badge)
![Lucide](https://img.shields.io/badge/Lucide-Icons-F56565?style=for-the-badge)
![Recharts](https://img.shields.io/badge/Recharts-Charts-22C55E?style=for-the-badge)

---

## 🚀 실행 방법

### 사전 요구사항
- Node.js 18+
- Python 3.10+
- MySQL 8.0+

### 1. 레포지토리 클론
```bash
git clone https://github.com/your-org/localy.git
cd localy
```

### 2. 백엔드 실행
```bash
cd backend

# 가상환경 생성 및 활성화 (Windows)
python -m venv venv
.\venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python -m uvicorn main:app --reload --port 8000
```

**백엔드 URL**: http://localhost:8000  
**API 문서 (Swagger)**: http://localhost:8000/docs

### 3. 프론트엔드 실행
```bash
# 루트 디렉토리에서
npm install
npm run dev
```

**프론트엔드 URL**: http://localhost:3000

### 4. 환경 변수 설정
```env
# .env (프론트엔드)
VITE_API_BASE_URL=http://localhost:8000

# backend/.env
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/travel_platform
```

---

## 👥 팀원 R&R

| 이름 | 역할 | 담당 업무 |
|:---:|:---:|:---|
| 정기홍 | **PM** | 프로젝트 관리, 일정 조율, 기획 총괄 |
| 공민우 | **Frontend Lead** | React 컴포넌트 개발, UI/UX 설계 |
| 윤샘 | **Frontend Developer** | 화면 개발, 지도 연동, 반응형 UI |
| 신효빈 | **Backend Lead** | FastAPI 서버 구축, DB 설계, API 개발 |
| 황재성 | **Backend Developer** | 인증 시스템, API 개발, 테스트 |
| 김대영 | **AI Engineer** | LangGraph 에이전트 개발, vLLM 모델 연동 |
| 박슬기 | **Designer** | Figma 디자인, UI/UX 디자인, 에셋 제작 |

---

## 📁 디렉토리 구조

```
localy/
├── 📂 backend/                 # FastAPI 백엔드 서버
│   ├── 📂 agents/              # LangGraph AI 에이전트
│   │   ├── chat_agent.py       # 채팅 에이전트
│   │   ├── itinerary_agent.py  # 일정 생성 에이전트
│   │   ├── restaurant_agent.py # 맛집 추천 에이전트
│   │   ├── orchestrator.py     # 에이전트 오케스트레이터
│   │   └── character_layer.py  # 캐릭터 레이어 (까칠이/순둥이)
│   ├── 📂 core/                # 핵심 설정
│   │   └── database.py         # DB 연결 설정
│   ├── 📂 routers/             # API 라우터
│   │   ├── auth.py             # 인증 라우터
│   │   └── ai.py               # AI 챗봇 라우터
│   ├── 📂 schemas/             # Pydantic 스키마
│   ├── main.py                 # FastAPI 앱 엔트리포인트
│   ├── models.py               # SQLAlchemy 모델
│   └── requirements.txt        # Python 의존성
│
├── 📂 src/                     # React 프론트엔드
│   ├── 📂 assets/              # 정적 리소스 (이미지, 폰트)
│   ├── 📂 components/          # React 컴포넌트
│   │   ├── ChatScreen.tsx      # 페르소나 수집 챗봇
│   │   ├── TravelChatBot.tsx   # 여행 계획 챗봇
│   │   ├── TravelDashboard.tsx # 여행 대시보드
│   │   ├── MapScreen.tsx       # 지도 화면
│   │   └── FloatingChatBot.tsx # 플로팅 챗봇 버튼
│   ├── 📂 utils/               # 유틸리티 함수
│   │   └── aiApi.ts            # AI API 통신
│   ├── App.tsx                 # 메인 앱 컴포넌트
│   ├── main.tsx                # React 엔트리포인트
│   └── index.css               # 전역 스타일
│
├── index.html                  # HTML 엔트리포인트
├── vite.config.ts              # Vite 설정
├── package.json                # Node.js 의존성
├── tsconfig.json               # TypeScript 설정
└── README.md                   # 프로젝트 문서
```

---

## 📚 추가 문서

- [설정 가이드 (SETUP.md)](./SETUP.md) - 상세 환경 설정 및 문제 해결
- [에이전트 개발 가이드](./AGENT_DEVELOPMENT_GUIDE.md) - AI 에이전트 개발 가이드

---

## 📄 라이선스

This project is licensed under the MIT License.

---

<p align="center">
  Made with ❤️ by <strong>Localy Team</strong>
</p>
