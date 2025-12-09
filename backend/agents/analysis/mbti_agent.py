"""
MBTI Analysis Agent (Hybrid Version with GPT-4)
Combines keyword matching with GPT-4 semantic analysis for accurate trait detection.
"""
from typing import Dict
import logging
import os
from dotenv import load_dotenv
from schemas.data_models import AgentResponse

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# GPT-4 API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def analyze_mbti(answers: Dict[str, str]) -> AgentResponse:
    """
    하이브리드 방식으로 MBTI 4가지 축(E/I, S/N, T/F, J/P)을 분석합니다.
    
    1차: 키워드 매칭 (빠름)
    2차: 애매하면 GPT-4 의미 분석 (정확)
    
    Args:
        answers: {
            "planning": "철저하게 계획함", 
            "social": "사람 많은 곳이 좋음",
            "detail_focus": "맛집 리스트",
            "decision_style": "효율",
            "energy_source": "액티비티",
            "preparation": "체크리스트"
        }
    
    Returns:
        AgentResponse with data={"E/I": "E", "S/N": "N", "T/F": "T", "J/P": "J", "mbti": "ENTJ"}
    """
    try:
        logger.info(f"🧠 [MBTI Agent] 성향 분석 중 (하이브리드 - GPT-4): {answers}")
        
        # 점수 초기화
        e_score = 0  # E(외향) vs I(내향)
        s_score = 0  # S(감각) vs N(직관)
        t_score = 0  # T(사고) vs F(감정)
        j_score = 0  # J(판단) vs P(인식)
        
        # ===== E/I 분석 =====
        logger.info("🔍 E/I 축 분석 중...")
        
        # 1-1. social 질문 (키워드 매칭)
        social_answer = answers.get("social", "")
        if any(w in social_answer for w in ["사람", "북적", "활기", "파티", "친구", "많", "핫플"]):
            e_score += 2
            logger.info(f"  ✅ social: 키워드 매칭 → E (+2)")
        elif any(w in social_answer for w in ["조용", "혼자", "한적", "힐링", "여유", "적당"]):
            e_score -= 2
            logger.info(f"  ✅ social: 키워드 매칭 → I (-2)")
        else:
            # 키워드 없음 → GPT-4 분석
            e_score += _gpt4_analyze_ei(social_answer, "social")
            
        # 1-2. energy_source 질문 (키워드 매칭)
        energy_answer = answers.get("energy_source", "")
        if any(w in energy_answer for w in ["액티비티", "활동", "놀", "구경", "만나", "수다", "바쁘게"]):
            e_score += 1
            logger.info(f"  ✅ energy_source: 키워드 매칭 → E (+1)")
        elif any(w in energy_answer for w in ["쉬", "여유", "휴식", "조용", "호텔", "카페", "편하게"]):
            e_score -= 1
            logger.info(f"  ✅ energy_source: 키워드 매칭 → I (-1)")
        else:
            # 키워드 없음 → GPT-4 분석
            e_score += _gpt4_analyze_ei(energy_answer, "energy_source")
        
        # ===== S/N 분석 =====
        logger.info("🔍 S/N 축 분석 중...")
        detail_answer = answers.get("detail_focus", "")
        if any(w in detail_answer for w in ["리스트", "체크", "맛집", "명소", "일정", "계획", "사진"]):
            s_score += 2
            logger.info(f"  ✅ detail_focus: 키워드 매칭 → S (+2)")
        elif any(w in detail_answer for w in ["분위기", "경험", "추억", "느낌", "특별", "새로운"]):
            s_score -= 2
            logger.info(f"  ✅ detail_focus: 키워드 매칭 → N (-2)")
        else:
            # 키워드 없음 → GPT-4 분석
            s_score += _gpt4_analyze_sn(detail_answer)
        
        # ===== T/F 분석 =====
        logger.info("🔍 T/F 축 분석 중...")
        decision_answer = answers.get("decision_style", "")
        if any(w in decision_answer for w in ["효율", "시간", "비용", "동선", "최적", "합리"]):
            t_score += 2
            logger.info(f"  ✅ decision_style: 키워드 매칭 → T (+2)")
        elif any(w in decision_answer for w in ["감동", "추억", "기분", "느낌", "행복", "마음"]):
            t_score -= 2
            logger.info(f"  ✅ decision_style: 키워드 매칭 → F (-2)")
        else:
            # 키워드 없음 → GPT-4 분석
            t_score += _gpt4_analyze_tf(decision_answer)
        
        # ===== J/P 분석 =====
        logger.info("🔍 J/P 축 분석 중...")
        
        # 4-1. planning 질문
        plan_answer = answers.get("planning", "")
        if any(w in plan_answer for w in ["계획", "철저", "시간", "분 단위", "미리", "준비"]):
            j_score += 2
            logger.info(f"  ✅ planning: 키워드 매칭 → J (+2)")
        elif any(w in plan_answer for w in ["즉흥", "그때그때", "발길", "자유", "느낌"]):
            j_score -= 2
            logger.info(f"  ✅ planning: 키워드 매칭 → P (-2)")
        else:
            # 키워드 없음 → GPT-4 분석
            j_score += _gpt4_analyze_jp(plan_answer, "planning")
            
        # 4-2. preparation 질문
        prep_answer = answers.get("preparation", "")
        if any(w in prep_answer for w in ["체크리스트", "미리", "정리", "계획", "카테고리", "일주일"]):
            j_score += 1
            logger.info(f"  ✅ preparation: 키워드 매칭 → J (+1)")
        elif any(w in prep_answer for w in ["당일", "막", "적당", "필요한것만", "즉흥"]):
            j_score -= 1
            logger.info(f"  ✅ preparation: 키워드 매칭 → P (-1)")
        else:
            # 키워드 없음 → GPT-4 분석
            j_score += _gpt4_analyze_jp(prep_answer, "preparation")
            
        # 결과 도출
        mbti_result = {
            "E/I": "E" if e_score >= 0 else "I",
            "S/N": "S" if s_score >= 0 else "N",
            "T/F": "T" if t_score >= 0 else "F",
            "J/P": "J" if j_score >= 0 else "P"
        }
        
        # MBTI 문자열 조합
        mbti_string = mbti_result["E/I"] + mbti_result["S/N"] + mbti_result["T/F"] + mbti_result["J/P"]
        
        logger.info(f"✅ MBTI 분석 완료: {mbti_string} (점수: E{e_score} S{s_score} T{t_score} J{j_score})")
        
        return AgentResponse(
            success=True,
            agent_name="mbti_analysis",
            data=[{
                **mbti_result,
                "mbti": mbti_string,
                "scores": {
                    "E/I": e_score,
                    "S/N": s_score,
                    "T/F": t_score,
                    "J/P": j_score
                }
            }],
            message=f"성향 분석 완료: {mbti_string}"
        )
        
    except Exception as e:
        logger.error(f"MBTI 분석 실패: {e}")
        return AgentResponse(success=False, agent_name="mbti", message="분석 실패", error=str(e))


# ===== GPT-4 의미 분석 헬퍼 함수들 =====

def _gpt4_analyze_ei(answer: str, question_type: str) -> int:
    """GPT-4로 E/I 성향 분석 (애매한 답변 처리)"""
    if not answer or not answer.strip():
        logger.info(f"  ⚠️  {question_type}: 답변 없음 → 중립 (0)")
        return 0
    
    if not OPENAI_API_KEY:
        logger.warning(f"  ⚠️  {question_type}: GPT-4 API 키 없음 → 중립 (0)")
        return 0
    
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        prompt = f"""사용자가 여행 성향 질문에 "{answer}"라고 답했습니다.

이 답변이 외향적(E, 사람들과 어울리고 활동적) 성향인지, 내향적(I, 혼자 또는 조용히) 성향인지 판단해주세요.

답변 형식: E 또는 I (한 글자만)"""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=5,
            temperature=0.1
        )
        
        result = response.choices[0].message.content.strip().upper()
        score = 1 if result == "E" else -1 if result == "I" else 0
        
        logger.info(f"  🤖 {question_type}: GPT-4 분석 → {result} ({score:+d})")
        return score
        
    except Exception as e:
        logger.warning(f"  ⚠️  {question_type}: GPT-4 분석 실패 → 중립 (0): {e}")
        return 0


def _gpt4_analyze_sn(answer: str) -> int:
    """GPT-4로 S/N 성향 분석"""
    if not answer or not answer.strip():
        return 0
    
    if not OPENAI_API_KEY:
        logger.warning(f"  ⚠️  detail_focus: GPT-4 API 키 없음 → 중립 (0)")
        return 0
    
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        prompt = f"""사용자가 "여행에서 가장 중요한 건?"이라는 질문에 "{answer}"라고 답했습니다.

이 답변이 감각형(S, 구체적 세부사항 중시) 성향인지, 직관형(N, 추상적 경험 중시) 성향인지 판단해주세요.

답변 형식: S 또는 N (한 글자만)"""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=5,
            temperature=0.1
        )
        
        result = response.choices[0].message.content.strip().upper()
        score = 2 if result == "S" else -2 if result == "N" else 0
        
        logger.info(f"  🤖 detail_focus: GPT-4 분석 → {result} ({score:+d})")
        return score
        
    except Exception as e:
        logger.warning(f"  ⚠️  detail_focus: GPT-4 분석 실패 → 중립 (0): {e}")
        return 0


def _gpt4_analyze_tf(answer: str) -> int:
    """GPT-4로 T/F 성향 분석"""
    if not answer or not answer.strip():
        return 0
    
    if not OPENAI_API_KEY:
        logger.warning(f"  ⚠️  decision_style: GPT-4 API 키 없음 → 중립 (0)")
        return 0
    
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        prompt = f"""사용자가 "일정 짤 때 뭐가 중요해?"라는 질문에 "{answer}"라고 답했습니다.

이 답변이 사고형(T, 효율과 논리 중시) 성향인지, 감정형(F, 감성과 가치 중시) 성향인지 판단해주세요.

답변 형식: T 또는 F (한 글자만)"""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=5,
            temperature=0.1
        )
        
        result = response.choices[0].message.content.strip().upper()
        score = 2 if result == "T" else -2 if result == "F" else 0
        
        logger.info(f"  🤖 decision_style: GPT-4 분석 → {result} ({score:+d})")
        return score
        
    except Exception as e:
        logger.warning(f"  ⚠️  decision_style: GPT-4 분석 실패 → 중립 (0): {e}")
        return 0


def _gpt4_analyze_jp(answer: str, question_type: str) -> int:
    """GPT-4로 J/P 성향 분석"""
    if not answer or not answer.strip():
        logger.info(f"  ⚠️  {question_type}: 답변 없음 → 중립 (0)")
        return 0
    
    if not OPENAI_API_KEY:
        logger.warning(f"  ⚠️  {question_type}: GPT-4 API 키 없음 → 중립 (0)")
        return 0
    
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        prompt = f"""사용자가 여행 계획/준비에 관한 질문에 "{answer}"라고 답했습니다.

이 답변이 판단형(J, 계획적이고 준비함) 성향인지, 인식형(P, 즉흥적이고 유연함) 성향인지 판단해주세요.

답변 형식: J 또는 P (한 글자만)"""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=5,
            temperature=0.1
        )
        
        result = response.choices[0].message.content.strip().upper()
        
        # planning은 +2/-2, preparation은 +1/-1
        weight = 2 if question_type == "planning" else 1
        score = weight if result == "J" else -weight if result == "P" else 0
        
        logger.info(f"  🤖 {question_type}: GPT-4 분석 → {result} ({score:+d})")
        return score
        
    except Exception as e:
        logger.warning(f"  ⚠️  {question_type}: GPT-4 분석 실패 → 중립 (0): {e}")
        return 0
