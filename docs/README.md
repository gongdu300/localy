# Travel OS - 3 Character Fine-Tuning Project

**로컬 LLM 기반 3가지 캐릭터 페르소나를 가진 여행 어시스턴트 시스템**

## 📋 프로젝트 개요

Travel OS는 3개의 서로 다른 성격을 가진 캐릭터 LLM을 파인튜닝하여 사용자 인터페이스로 사용하고, 백엔드는 LangGraph 기반 멀티에이전트 시스템(GPT-4)이 실제 여행 로직을 처리하는 시스템입니다.

### 3가지 캐릭터

1. **까칠냥이** 😾 - 츤데레, 직설적이지만 능력 있는 고양이
2. **순둥멍멍이** 🐶 - 친절하고 다정한 강아지
3. **엉뚱수달** 🦦 - 창의적이고 재미있는 수달

## 🎯 시스템 아키텍처

Travel OS는 **2단계 레이어 구조**로 설계되었습니다:

```
사용자
  ↓
캐릭터 LLM (Qwen2.5-14B, 로컬, 파인튜닝)
  역할: 입출력 라우팅 + 캐릭터 말투 유지
  ↓
멀티에이전트 시스템 (GPT-4 / Claude, 백엔드)
  역할: 실제 추론, 계산, 여행 계획 로직
  ├─ 일정 계획 에이전트
  ├─ 맛집 추천 에이전트  
  ├─ 동선 최적화 에이전트
  └─ RAG 검색 에이전트
  ↓
캐릭터 LLM (결과를 페르소나로 변환)
  ↓
사용자 응답
```

**자세한 내용:** [`architecture.md`](./architecture.md) 참고

## 🚀 빠른 시작

### 필수 요구사항

- **GPU**: 32GB VRAM (Qwen2.5-14B QLoRA 학습)
- **CUDA**: 11.8+ 또는 12.1+
- **Python**: 3.10+

### 1. 환경 설정

클라우드 GPU 환경에서 실행:

```bash
# Jupyter Notebook 실행
jupyter notebook
```

노트북 순서대로 실행:
1. `01_setup_environment.ipynb` - 환경 설정 & GPU 확인
2. `03_train_kkachil_cat.ipynb` - 까칠냥이 파인튜닝 ✅
3. `04_train_sundong_dog.ipynb` - 순둥멍멍이 파인튜닝 ✅
4. `05_train_eongddong_otter.ipynb` - 엉뚱수달 파인튜닝 (TODO)

### 2. 모델 서빙

파인튜닝 완료 후 vLLM으로 서빙:

```bash
# 까칠냥이 서빙 (포트 8002)
python -m vllm.entrypoints.openai.api_server \
  --model /models/kkachil-cat-merged \
  --port 8002

# 순둥멍멍이 서빙 (포트 8003)
python -m vllm.entrypoints.openai.api_server \
  --model /models/sundong-dog-merged \
  --port 8003
```

### 3. 로컬에서 테스트

```bash
# 까칠냥이 테스트
python test_kkachil_server.py --url https://your-tunnel-url.pinggy.link

# 순둥멍멍이 테스트
python test_sundong_server.py --url https://your-tunnel-url.pinggy.link
```

## 📁 프로젝트 구조

```
CAT_Qwen2.5/
├── docs/
│   ├── architecture.md                 # 시스템 아키텍처 ✅
│   ├── connect_to_kamp_server.md       # 서버 접속 가이드 ✅
│   ├── speech_way.md                   # 캐릭터 말투 가이드 ✅
│   └── README.md                       # 프로젝트 개요 ✅
├── notebooks/
│   ├── 01_setup_environment.ipynb      # 환경 설정
│   ├── 03_train_kkachil_cat.ipynb      # 까칠냥이 학습 ✅
│   ├── 04_train_sundong_dog.ipynb      # 순둥멍멍이 학습 ✅
│   └── 05_train_eongddong_otter.ipynb  # 엉뚱수달 학습 (TODO)
├── datasets/
│   ├── kkachil_cat_generated.jsonl     # 까칠냥이 데이터 (7,500) ✅
│   ├── sundong_dog_generated.jsonl     # 순둥멍멍이 데이터 (7,500) ✅
│   └── eongddong_otter_generated.jsonl # 엉뚱수달 데이터 (7,500) ✅
├── models/
│   ├── kkachil-cat-merged/             # 까칠냥이 병합 모델 ✅
│   └── sundong-dog-merged/             # 순둥멍멍이 병합 모델 ✅
├── test_kkachil_server.py              # 까칠냥이 테스트 ✅
├── test_sundong_server.py              # 순둥멍멍이 테스트 ✅
├── kkachil_server.ipynb                # 까칠냥이 서버 노트북 ✅
└── sundong_server.ipynb                # 순둥멍멍이 서버 노트북 ✅
```

## 🔧 기술 스택

### 캐릭터 페르소나 레이어 (로컬)
- **베이스 모델**: Qwen2.5-14B-Instruct
- **파인튜닝**: QLoRA (4bit)
- **프레임워크**: transformers, trl, peft, bitsandbytes
- **서빙**: vLLM 0.5.5 (OpenAI 호환 API)

### 멀티에이전트 레이어 (백엔드)
- **LLM**: GPT-4 / Claude
- **프레임워크**: LangGraph
- **기능**: 일정 계획, 맛집 추천, 동선 최적화, RAG 검색

## 📊 학습 설정

```python
# QLoRA 설정
LORA_R = 16
LORA_ALPHA = 32
LORA_DROPOUT = 0.05

# 학습 설정
NUM_EPOCHS = 3
BATCH_SIZE = 1
GRADIENT_ACCUMULATION_STEPS = 16
LEARNING_RATE = 2e-4
MAX_SEQ_LENGTH = 1024
```

## 📚 참고 문서

- [`architecture.md`](./architecture.md) - 시스템 아키텍처 상세 설명
- [`speech_way.md`](./speech_way.md) - 캐릭터 말투 가이드
- [`connect_to_kamp_server.md`](./connect_to_kamp_server.md) - 서버 접속 방법

## 🤝 팀 분담

- **데이터 팀**: 데이터셋 생성
- **모델 팀**: 파인튜닝 실행 (현재 작업)
- **백엔드 팀**: LangGraph 멀티에이전트 시스템
- **프론트엔드 팀**: 챗 UI

## 📄 라이선스

MIT License
