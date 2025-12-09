from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# Language detection and TTS
from utils.language_detector import detect_primary_language, should_use_tts
from services.tts_client import tts_client

# New imports from migrated code
from core.workflow import create_travel_graph
from schemas.state import TeamAgentState

router = APIRouter(
    prefix="/api/langgraph",
    tags=["langgraph"],
    responses={404: {"description": "Not found"}},
)

# Initialize graph once
travel_agent_graph = create_travel_graph()

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = []
    preferred_character: Optional[str] = "cat"  # 'cat', 'dog', 'otter'
    destination: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    agent_results: Optional[dict] = None
    audio_base64: Optional[str] = None  # Base64 인코딩된 WAV 오디오
    detected_language: Optional[str] = None  # "ko" or "en"

@router.post("/chat", response_model=ChatResponse)
async def langgraph_chat(request: ChatRequest):
    """
    LangGraph 멀티에이전트 챗봇 엔드포인트
    """
    try:
        # 초기 상태 설정 (TeamAgentState 구조에 맞춤)
        # TODO: 실제 세션에서 이전 대화 기록이나 컨텍스트를 불러오는 로직 필요
        initial_state: TeamAgentState = {
            "user_input": request.message,
            "messages": request.conversation_history + [{"role": "user", "content": request.message}],
            "next_agent": None,
            "budget": None,
            "routes": [],
            "weather_forecast": [],
            "crowd_info": None,
            "places": [],
            "daily_plans": {},
            "context": None,
            "final_response": "",
            
            # Phase 5 Fields
            "preferred_character": request.preferred_character,
            "destination": request.destination or "강릉", # 기본값
            "start_date": "2025-05-01", 
            "end_date": "2025-05-02",
            "parsed_intent": None,
            "restaurants": None,
            "accommodations": None,
            "desserts": None,
            "landmarks": None,
            "weather_info": None,
            "gps_data": None
        }
        
        print(f"\n=== LangGraph 실행 ===")
        print(f"입력: {request.message}")
        
        # LangGraph 실행
        # stream() 대신 invoke() 사용 (HTTP 응답은 동기적이므로 일단 invoke로 최종 상태 반환)
        # Frontend에서 스트리밍을 원하면 SSE나 WebSocket으로 변경 필요
        result = await travel_agent_graph.ainvoke(initial_state)
        
        # 마지막 메시지를 최종 응답으로 간주
        last_message = ""
        if result.get("messages"):
            last_message = result["messages"][-1]["content"]
        
        print(f"응답: {last_message[:50]}...")
        
        # 결과 구성
        agent_results = {}
        if result.get("budget"):
            agent_results["budget"] = result["budget"]
        if result.get("daily_plans"):
            agent_results["itinerary"] = result["daily_plans"]
        if result.get("crowd_info"):
            agent_results["crowd_info"] = result["crowd_info"]
        
        # 언어 감지 및 TTS
        detected_lang = detect_primary_language(request.message)
        audio_base64 = None
        
        if detected_lang == "en":
            # 영어 텍스트 → VibeVoice TTS
            print(f"🎤 Generating TTS for English response...")
            audio_base64 = tts_client.synthesize_base64(last_message)
            if audio_base64:
                print(f"✅ TTS generated: {len(audio_base64)} chars (base64)")
            else:
                print(f"⚠️ TTS generation failed")
        else:
            print(f"📝 Korean detected - text only response")
        
        return ChatResponse(
            response=last_message,
            agent_results=agent_results if agent_results else None,
            audio_base64=audio_base64,
            detected_language=detected_lang
        )
        
    except Exception as e:
        print(f"LangGraph 에러: {e}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail=f"LangGraph 실행 실패: {str(e)}"
        )


@router.get("/health")
async def langgraph_health():
    """
    LangGraph 시스템 헬스 체크
    """
    return {
        "status": "ok",
        "system": "team_agents_v2",
        "agents": ["supervisor", "budget", "crowd", "itinerary"]
    }
