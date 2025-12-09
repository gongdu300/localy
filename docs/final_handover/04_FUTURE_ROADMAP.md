# 04. 향후 계획 및 로드맵 (Future Roadmap)

## 🚧 남은 과제 (Remaining Tasks)

### 1. 프론트엔드 연동 고도화
- [ ] **UI 컴포넌트 개발**: 백엔드에서 보내주는 `json_data` (`gallery`, `shopping`)를 받아 실제로 화면에 렌더링하는 React 컴포넌트 완성 필요.
- [ ] **지도 연동**: `json_data` 내의 좌표(GPS) 정보를 받아 Google Maps 컴포넌트에 마커(Pin)를 찍는 로직 연결.
- [ ] **오디오 플레이어**: `audio_chunk`를 받아 끊김 없이 재생하는 Stream Player 버퍼링 최적화.

### 2. 성능 최적화
- [ ] **DB 캐싱**: 자주 검색되는 지역(예: 강릉, 제주)의 맛집/숙소 데이터는 Redis 또는 DB에 캐싱하여 API 호출 비용 절감.
- [ ] **LLM 응답 속도**: 현재 Qwen API(Pinggy)가 간헐적으로 느려짐. 전용 GPU 서버 호스팅 고려 필요.

### 3. 배포 (Deployment)
- [ ] **Docker 컨테이너화**: `backend`와 `frontend`를 각각 Dockerfile로 패키징.
- [ ] **Cloud 배포**: AWS/GCP 인스턴스에 배포 및 HTTPS 도메인 연결 (WebSocket Secure `wss://` 적용 필요).

---

## 🎯 최종 목표
**"사용자가 말만 하면, 화면과 음성이 동시에 반응하는 영화 같은 여행 비서 AI 완성"**

현재 백엔드 코어는 이 목표를 달성하기 위한 모든 준비를 마쳤습니다. 남은 프론트엔드 작업만 완료되면 완벽한 여행 OS가 될 것입니다.
화이팅입니다! 🚀
