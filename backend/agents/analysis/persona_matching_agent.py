"""
Persona Matching Agent (Enhanced Version)
Select the best character based on MBTI 4 axes with M:1 mapping logic.
"""
from typing import Dict
import logging
from schemas.data_models import AgentResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def match_character(traits: Dict[str, str]) -> AgentResponse:
    """
    MBTI 4가지 축을 바탕으로 최적의 캐릭터를 매칭합니다.
    16가지 MBTI → 3개 캐릭터 명확한 M:1 매핑
    
    Args:
        traits: {"E/I": "E", "S/N": "N", "T/F": "T", "J/P": "J"}
        
    Returns:
        AgentResponse with data={"character": "cat", "mbti": "ENTJ", "reason": "..."}
    """
    try:
        logger.info(f"🎭 [Matching Agent] 캐릭터 매칭 중: {traits}")
        
        is_E = traits.get("E/I") == "E"
        is_I = traits.get("E/I") == "I"
        is_S = traits.get("S/N") == "S"
        is_N = traits.get("S/N") == "N"
        is_T = traits.get("T/F") == "T"
        is_F = traits.get("T/F") == "F"
        is_J = traits.get("J/P") == "J"
        is_P = traits.get("J/P") == "P"
        
        # 점수 계산 (브라더의 로직)
        scores = {"cat": 0, "dog": 0, "otter": 0}
        
        # 🐱 까칠냥 (I + T 핵심 - 독립적이고 논리적)
        if is_I: scores["cat"] += 3  # 내향성 중요!
        if is_T: scores["cat"] += 3  # 사고형 중요!
        if is_J: scores["cat"] += 2  # 계획적
        if is_S: scores["cat"] += 1  # 현실적
        
        # 🐶 순둥멍 (E + F 핵심 - 사교적이고 감성적)
        if is_E: scores["dog"] += 3  # 외향성 중요!
        if is_F: scores["dog"] += 3  # 감정형 중요!
        if is_J: scores["dog"] += 1  # 약간 계획적
        if is_S: scores["dog"] += 1  # 현실적
        
        # 🦦 엉뚱수달 (N + P 핵심 - 창의적이고 즉흥적)
        if is_N: scores["otter"] += 3  # 직관형 중요!
        if is_P: scores["otter"] += 3  # 즉흥형 중요!
        if is_E: scores["otter"] += 1  # 활동적
        if is_I: scores["otter"] += 1  # 혼자도 잘 놈
        
        # 최고 점수 캐릭터 선정
        best_char = max(scores, key=scores.get)
        best_score = scores[best_char]
        
        # MBTI 문자열 조합
        mbti_string = traits.get("E/I", "E") + traits.get("S/N", "N") + traits.get("T/F", "T") + traits.get("J/P", "J")
        
        # 캐릭터별 상세 이유 생성 (self 제거!)
        reasons = {
            "cat": _generate_cat_reason(traits, mbti_string),
            "dog": _generate_dog_reason(traits, mbti_string),
            "otter": _generate_otter_reason(traits, mbti_string)
        }
        
        logger.info(f"✅ 매칭 완료: {best_char} ({mbti_string}) - 점수 {best_score}")
        logger.info(f"   전체 점수: Cat={scores['cat']}, Dog={scores['dog']}, Otter={scores['otter']}")
        
        return AgentResponse(
            success=True,
            agent_name="persona_matching",
            data=[{
                "character": best_char,
                "mbti": mbti_string,
                "scores": scores,
                "reason": reasons[best_char]
            }],
            message=f"매칭 완료: {best_char} ({mbti_string})"
        )
        
    except Exception as e:
        logger.error(f"캐릭터 매칭 실패: {e}")
        return AgentResponse(success=False, agent_name="matching", message="매칭 실패", error=str(e))

def _generate_cat_reason(traits: Dict[str, str], mbti: str) -> str:
    """까칠냥 선정 이유 생성"""
    reasons = []
    
    if traits.get("E/I") == "I":
        reasons.append("혼자만의 시간을 소중히 여기는 당신")
    if traits.get("T/F") == "T":
        reasons.append("논리적이고 효율적인 판단을 하는 당신")
    if traits.get("J/P") == "J":
        reasons.append("철저한 계획으로 여행을 준비하는 당신")
    
    if not reasons:
        reasons.append("차분하고 독립적인 여행을 즐기는 당신")
    
    base = ", ".join(reasons)
    return f"{base}에게는 '까칠냥'이 완벽한 파트너예요! 🐱 똑부러지면서도 실속 있는 여행을 함께 만들어갈게요!"

def _generate_dog_reason(traits: Dict[str, str], mbti: str) -> str:
    """순둥멍 선정 이유 생성"""
    reasons = []
    
    if traits.get("E/I") == "E":
        reasons.append("사람들과 어울리는 걸 좋아하는 당신")
    if traits.get("T/F") == "F":
        reasons.append("감성적이고 따뜻한 마음을 가진 당신")
    
    if not reasons:
        reasons.append("밝고 긍정적인 에너지로 여행하는 당신")
    
    base = ", ".join(reasons)
    return f"{base}에게는 '순둥멍'이 최고의 친구죠! 🐶 항상 응원하고 함께 즐거운 추억을 만들어갈게요!"

def _generate_otter_reason(traits: Dict[str, str], mbti: str) -> str:
    """엉뚱수달 선정 이유 생성"""
    reasons = []
    
    if traits.get("S/N") == "N":
        reasons.append("새로운 경험과 특별한 추억을 중시하는 당신")
    if traits.get("J/P") == "P":
        reasons.append("즉흥적이고 자유로운 여행을 즐기는 당신")
    
    if not reasons:
        reasons.append("창의적이고 모험을 즐기는 당신")
    
    base = ", ".join(reasons)
    return f"{base}! '엉뚱수달'과 함께 예측 불가 재미있는 여행을 떠나봐요! 🦦"
