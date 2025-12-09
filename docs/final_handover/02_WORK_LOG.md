# 02. 작업 일지 (Work Log)

## 📅 작업 내역 요약 (Recent Changes)

### 1. 에이전트 통합 (Team Member Agents Integration)
- **숙소 에이전트 (Accommodation Agent)**: 기존 Shell 코드 제거 후 팀원이 제공한 `AccommodationAgent` 모듈 통합 완료.
- **페르소나 에이전트 (Persona Agent)**: 사용자 성향 분석을 위한 페르소나 모듈 통합 및 LangGraph 노드 연결 완료.
- **쇼핑 & 갤러리 에이전트 (Shopping & Gallery Agents)**:
  - `shopping_agent` (마트/편의점) 및 `gallery_agent` (사진 검색) 신규 추가.
  - 단순 검색 시 "일정 짜기" 로직을 건너뛰도록 최적화.

### 2. 백엔드 로직 최적화 (Optimization)
- **WebSocket 연결 오류 해결**:
  - 기존: `app_workflow`가 서버 시작 시점에 컴파일되어 무거운 로딩 유발 -> 타임아웃 발생.
  - 수정: **Lazy Loading (지연 초기화)** 패턴 적용. 첫 요청 시점에 워크플로우를 컴파일하도록 변경하여 서버 부팅 속도 획기적 개선.
- **Qwen Context "빈 껍데기" 현상 해결**:
  - 원인: `qwen_transform_node`에서 `shopping`, `gallery` 데이터를 LLM에게 전달하지 않음.
  - 수정: `workflow.py` 데이터 전달 로직 수정 및 `qwen_client.py`의 미니파이(Minify) 로직 개선.
- **불필요한 에이전트 실행 방지**:
  - `analyze_intent` 노드를 개선하여 "맛집 추천" 요청 시 날씨/GPS/숙소 에이전트를 아예 실행하지 않음 (`budget/crowd` 단계도 생략).

### 3. 프론트엔드 연동 지원 (Frontend Support)
- **실시간 사진/리스트 전송**:
  - 기존: 텍스트만 전송되어 사진이 안 뜸.
  - 수정: `websocket_chat.py`에 `json_data` 프로토콜 추가. 에이전트가 찾은 `{ gallery: [...] }` 데이터를 즉시 클라이언트로 Push.
- **마크다운 이미지 Fallback**:
  - 프론트엔드 UI 렌더링 실패를 대비해, 캐릭터 대화 텍스트 내에 `![이미지](URL)` 태그를 포함시켜 채팅창에 이미지가 바로 뜨도록 조치.
- **서버 연결 안정화**:
  - Pinggy 터널 URL 변경 (`ueocy...` -> `kknyp...`) 및 `.env` 반영 완료.

---

## 🐛 트러블슈팅 기록 (Troubleshooting Log)
| 이슈 (Issue) | 원인 (Cause) | 해결 (Solution) |
| :--- | :--- | :--- |
| **Server Timeout / Boot Hang** | LangGraph 컴파일이 Import 시점에 발생 | `global _WORKFLOW_CACHE` 사용하여 Lazy Loading 적용 |
| **Empty Context (빈 답변)** | Workflow에서 데이터 전달 누락 | `workflow.py` state 매핑 수정 + `qwen_client.py` 파싱 로직 수정 |
| **Photos Not Showing** | WebSocket이 텍스트만 보냄 | `json_data` 메시지 타입 추가하여 이미지 URL 전송 |
| **"Day 1" Phrasing in Simple Search** | LLM 프롬프트가 항상 "일정" 모드였음 | 단순 검색 감지 시 "이곳을 추천합니다"로 프롬프트 분기 처리 |
