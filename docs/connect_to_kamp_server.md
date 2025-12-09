# ☁️ KAMP 클라우드 서버 연결 가이드

이 문서는 KAMP 클라우드 환경에서 실행 중인 Qwen 모델(vLLM)을 로컬 PC에서 접속하여 사용하는 방법을 설명합니다.

## 1. 서버 준비 (KAMP 클라우드)

먼저 클라우드 서버에서 모델을 로드하고 API 서버를 구동해야 합니다.

### 1-1. vLLM 서버 시작
주피터 노트북 `kkachil_server.ipynb`를 열고 **STEP 4** 셀을 실행하여 서버를 시작합니다.
- **포트**: 8002
- **엔드포인트**: `/v1`

### 1-2. 외부 접속 터널 열기 (선택)
클라우드 서버의 포트는 외부에서 직접 접속이 어려울 수 있습니다. 아래 방법 중 하나를 사용하여 터널을 엽니다.

#### 방법 A: Pinggy (추천 - 설치 불필요)
터미널에서 아래 명령어를 실행합니다.
```bash
ssh -p 443 -R0:localhost:8002 a.pinggy.io
```
- 화면에 출력된 `https://xxxx.a.free.pinggy.link` 주소를 복사합니다.
- **주의**: 처음 접속 시 `yes`를 입력해야 합니다.

#### 방법 B: Localtunnel (무료, 불안정할 수 있음)
```bash
lt --port 8002 --subdomain my-custom-subdomain
```
- URL: `https://my-custom-subdomain.loca.lt`
- **주의**: 접속 시 경고 페이지가 뜰 수 있으므로 클라이언트 헤더 설정이 필요합니다.

#### 방법 C: 공인 IP 직접 접속 (방화벽 허용 시)
터널 없이 공인 IP로 직접 접속합니다.
- IP 확인: `curl ifconfig.me`

---

## 2. 클라이언트 접속 (로컬 PC)

로컬 PC에서 Python 코드를 사용하여 서버에 접속합니다.

### 2-1. 필수 라이브러리 설치
```bash
pip install openai
```

### 2-2. 접속 코드 예시

```python
from openai import OpenAI

# 1. 터널 URL 사용 시 (Pinggy 등)
# base_url = "https://xxxx.a.free.pinggy.link/v1"

# 2. 공인 IP 사용 시
# base_url = "http://125.6.60.4:8002/v1"

# 3. Localtunnel 사용 시 (헤더 추가 필요)
# base_url = "https://my-custom-subdomain.loca.lt/v1"

client = OpenAI(
    base_url="https://xxxx.a.free.pinggy.link/v1",  # 실제 URL로 변경
    api_key="not-needed",
    # Localtunnel 사용 시 아래 헤더 필수
    # default_headers={"Bypass-Tunnel-Reminder": "true"},
    timeout=30.0  # 타임아웃 넉넉하게 설정
)

response = client.chat.completions.create(
    model="kkachil-cat-merged",  # 모델명은 서버에서 자동 인식되므로 아무거나 넣어도 됨
    messages=[
        {"role": "system", "content": "너는 까칠한 고양이 여행 가이드야."},
        {"role": "user", "content": "안녕?"}
    ]
)

print(response.choices[0].message.content)
```

### 2-3. 테스트 스크립트 사용
프로젝트 루트에 있는 `test_kkachil_server.py`를 사용하여 간편하게 테스트할 수 있습니다.

```bash
# Pinggy URL로 테스트
python test_kkachil_server.py --url https://xxxx.a.free.pinggy.link

# 공인 IP로 테스트
python test_kkachil_server.py --ip 125.6.60.4
```

---

## 3. 트러블슈팅

### ❌ Timeout Error (연결 시간 초과)
- **원인**: 서버가 응답하지 않거나 네트워크가 느림.
- **해결**:
  1. 클라우드에서 vLLM 서버가 실행 중인지 확인 (`ps aux | grep vllm`).
  2. 터널이 끊어졌는지 확인 (터미널 로그 확인).
  3. 클라이언트 코드에서 `timeout` 시간을 늘림.

### ❌ 503 Service Unavailable / Tunnel Unavailable
- **원인**: 터널은 열려있으나 백엔드(포트 8002)와 연결되지 않음.
- **해결**:
  1. 클라우드에서 vLLM 서버가 죽었는지 확인.
  2. 터널 프로그램(`lt` 또는 `ssh`)을 종료(`Ctrl+C`)하고 다시 실행.

### ❌ 404 Not Found
- **원인**: URL 경로가 잘못됨.
- **해결**: URL 끝에 `/v1`이 포함되어 있는지 확인 (예: `.../v1/chat/completions`).
