"""LangGraph API Router - 프론트엔드 연결"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from agents.graph import travel_agent_graph

router = APIRouter(
    prefix="/api/langgraph",
    tags=["langgraph"],
    responses={404: {"description": "Not found"}},
)


class ChatRequest(BaseModel):
    """채팅 요청 모델"""
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []
    preferred_character: Optional[str] = "otter"  # otter 또는 kkachil


class ChatResponse(BaseModel):
    """채팅 응답 모델"""
    response: str
    intent: str
    data: Optional[Dict[str, Any]] = None


@router.post("/chat", response_model=ChatResponse)
async def langgraph_chat(request: ChatRequest):
    """
    LangGraph 멀티에이전트 챗봇 엔드포인트
    
    Features:
    - Orchestrator가 의도 파악 (restaurant/region/itinerary/chat)
    - ReAct Agent 자동 Tool 선택
    - 엉뚱수달 캐릭터 레이어 적용
    - 캐싱으로 빠른 응답 (5분 TTL)
    
    Args:
        request: ChatRequest (message, conversation_history)
        
    Returns:
        ChatResponse (response, intent, data)
    """
from core.cache import langgraph_cache
from core.workflow import create_travel_graph
import logging

# Initialize Logger
logger = logging.getLogger(__name__)

# [Optimization] Lazy Global Cache
_WORKFLOW_CACHE = None

def get_workflow():
    global _WORKFLOW_CACHE
    if _WORKFLOW_CACHE is None:
        print("🚀 [LangGraph] First-time Compilation...")
        _WORKFLOW_CACHE = create_travel_graph()
        print("✅ [LangGraph] Workflow Compiled and Cached.")
    return _WORKFLOW_CACHE

@router.post("/chat", response_model=ChatResponse)
async def langgraph_chat(request: ChatRequest):
    """
    LangGraph 멀티에이전트 챗봇 엔드포인트
    """
    try:
        print("\n" + "=" * 80)
        print(f"🤖 [LangGraph API] 새 요청 수신")
        print(f"📝 메시지: {request.message}")
        print("=" * 80)
        
        # 캐시 확인
        cached_result = langgraph_cache.get(request.message)
        if cached_result:
            print(f"⚡ [캐시 HIT] 저장된 응답 반환")
            print("=" * 80 + "\n")
            return ChatResponse(**cached_result)
        
        print(f"❌ [캐시 MISS] LangGraph 실행 시작...")
        
        # [New] Get Cached Workflow
        app_workflow = get_workflow()
        
        # [New] LangGraph Execution with updated State
        initial_state = {
            "user_input": request.message,
            "messages": [{"role": "user", "content": request.message}],
            "user_id": "test-user", # Placeholder
            "detected_language": "ko"
        }
        
        # Use Cached Workflow Instance
        result = await app_workflow.ainvoke(initial_state)
        
        print(f"\n✅ [LangGraph 완료]")
        
        # Extract results from new State structure
        last_message = result.get("messages", [])[-1]["content"] if result.get("messages") else "응답을 생성하지 못했습니다."
        intent = result.get("intent_type") or result.get("search_mode") or "chat"
        
        daily_plans = result.get("daily_plans")
        
        # Format for Frontend
        response_data = {
            "response": last_message,
            "intent": intent,
            "data": {
                "daily_plans": daily_plans,
                "budget": result.get("budget_info"),
                "weather": result.get("weather_info")
            }
        }
        
        print(f"🎯 의도: {intent}")
        print(f"💬 응답: {last_message[:100]}...")
        print("=" * 80 + "\n")
        
        # 캐시에 저장
        langgraph_cache.set(request.message, response_data, intent)
        
        return ChatResponse(**response_data)
        
    except Exception as e:
        import traceback
        error_msg = f"LangGraph Error: {str(e)}\n{traceback.format_exc()}"
        print(f"❌ [LangGraph API] Error: {error_msg}")
        
        # Return error as valid response for debugging
        return ChatResponse(
            response="죄송해요, 내부 오류가 발생했어요. (Debug Mode)",
            intent="error",
            data={"error": error_msg}
        )


@router.get("/health")
async def health_check():
    """헬스 체크"""
    return {
        "status": "healthy",
        "service": "LangGraph Multi-Agent System",
        "character": "엉뚱수달 (Eongddong Otter)"
    }
