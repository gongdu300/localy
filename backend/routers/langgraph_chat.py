from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from agents.coordinator import get_coordinator_response

router = APIRouter(
    prefix="/api/langgraph",
    tags=["langgraph"],
    responses={404: {"description": "Not found"}},
)


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = []


class ChatResponse(BaseModel):
    response: str  # AI 응답
    phase: str  # chat
    required_info_complete: bool


@router.post("/chat", response_model=ChatResponse)
async def langgraph_chat(request: ChatRequest):
    """
    LangGraph Coordinator Agent 챗봇 엔드포인트
    - LLM이 자동으로 Agent 선택
    - Memory 기반 대화
    """
    try:
        print(f"\n=== Coordinator Agent 실행 ===")
        print(f"입력: {request.message}")
        
        # Coordinator Agent 호출
        response = get_coordinator_response(
            message=request.message,
            session_id="default"
        )
        
        print(f"응답: {response[:100]}...")
        
        # 결과 구성
        return ChatResponse(
            response=response,
            phase="chat",
            required_info_complete=True
        )
        
    except Exception as e:
        print(f"Coordinator 에러: {e}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail=f"Coordinator 실행 실패: {str(e)}"
        )


@router.get("/health")
async def langgraph_health():
    """
    Coordinator Agent 시스템 헬스 체크
    """
    return {
        "status": "ok",
        "system": "coordinator_agent_pattern",
        "agents": ["restaurant", "dessert", "accommodation", "landmark", "region", "chat"],
        "architecture": "LangChain Coordinator + LangGraph Agents"
    }
