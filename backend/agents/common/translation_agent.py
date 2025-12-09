from schemas.data_models import AgentResponse
from typing import Dict, Any, List

def translate_text(text: str, target_lang: str) -> AgentResponse:
    """[Shell] 번역"""
    
    return AgentResponse(
        success=True,
        agent_name="translation",
        data=[{"translated_text": f"[Translated to {target_lang}] {text}"}],
        message="번역 성공 (Mock)"
    )
