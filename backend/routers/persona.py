from fastapi import APIRouter, HTTPException
from typing import Optional
from schemas.data_models import UserPersona
from agents.persona.persona_agent import agent as persona_agent

router = APIRouter(
    prefix="/agents/persona",
    tags=["persona_agent"],
    responses={404: {"description": "Not found"}},
)

@router.post("/create")
async def create_persona_endpoint(user_id: str, persona_data: UserPersona):
    """페르소나 생성"""
    try:
        result = persona_agent.create(user_id, persona_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}")
async def get_persona_endpoint(user_id: str):
    """페르소나 조회"""
    try:
        result = persona_agent.get(user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{user_id}")
async def update_persona_endpoint(user_id: str, persona_data: UserPersona):
    """페르소나 수정"""
    try:
        result = persona_agent.update(user_id, persona_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{user_id}")
async def delete_persona_endpoint(user_id: str):
    """페르소나 삭제"""
    try:
        result = persona_agent.delete(user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
