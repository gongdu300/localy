"""API 라우터 - /api prefix
회원가입 프로세스에서 호출되는 API 엔드포인트들
"""
from fastapi import APIRouter, HTTPException
from schemas.user import (
    ParseAnswerRequest,
    ParseAnswerResponse,
    AnalyzePersonaRequest,
    AnalyzePersonaResponse
)
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api",
    tags=["api"],
    responses={404: {"description": "Not found"}},
)


@router.post("/parse-answer", response_model=ParseAnswerResponse)
async def parse_answer(request: ParseAnswerRequest):
    """
    사용자의 자유 텍스트 입력을 파싱하여 표준화된 형태로 변환
    
    Args:
        request: 질문 타입과 사용자 입력
        
    Returns:
        파싱된 텍스트
    """
    try:
        question_type = request.question_type
        user_input = request.user_input.strip()
        
        logger.info(f"📝 Parse request - Type: {question_type}, Input: {user_input}")
        
        # 간단한 키워드 매칭으로 파싱
        parsed_text = user_input
        
        if question_type == "food":
            # 음식 관련 키워드 추출
            food_keywords = {
                "매운": "매운 음식",
                "단": "단 음식",
                "짠": "짠 음식",
                "한식": "한식",
                "양식": "양식",
                "중식": "중식",
                "일식": "일식",
                "해산물": "해산물",
                "고기": "고기",
                "채소": "채소",
                "생선": "생선"
            }
            for keyword, standard in food_keywords.items():
                if keyword in user_input:
                    parsed_text = standard
                    break
                    
        elif question_type == "region":
            # 지역 관련 키워드 추출
            region_keywords = {
                "서울": "서울",
                "부산": "부산",
                "제주": "제주",
                "강원": "강원도",
                "경기": "경기도",
                "도시": "복잡한 도시",
                "시골": "외딴 시골",
                "섬": "섬 지역"
            }
            for keyword, standard in region_keywords.items():
                if keyword in user_input:
                    parsed_text = standard
                    break
                    
        elif question_type == "theme":
            # 여행 테마 키워드
            theme_keywords = {
                "자연": "자연 탐방",
                "문화": "문화 체험",
                "맛집": "맛집 투어",
                "액티비티": "액티비티",
                "힐링": "힐링",
                "사진": "사진"
            }
            for keyword, standard in theme_keywords.items():
                if keyword in user_input:
                    parsed_text = standard
                    break
                    
        elif question_type == "transportation":
            transport_keywords = {
                "대중교통": "대중교통",
                "버스": "대중교통",
                "지하철": "대중교통",
                "렌터카": "렌터카",
                "자동차": "렌터카",
                "택시": "택시/카풀",
                "걷": "도보",
                "도보": "도보"
            }
            for keyword, standard in transport_keywords.items():
                if keyword in user_input:
                    parsed_text = standard
                    break
                    
        elif question_type == "budget":
            budget_keywords = {
                "10만": "10만원 이하",
                "저렴": "10만원 이하",
                "30만": "30만원",
                "적당": "30만원",
                "50만": "50만원",
                "제한": "제한 없음",
                "많": "제한 없음"
            }
            for keyword, standard in budget_keywords.items():
                if keyword in user_input:
                    parsed_text = standard
                    break
                    
        elif question_type == "accommodation":
            accommodation_keywords = {
                "호텔": "호텔",
                "펜션": "펜션",
                "게스트": "게스트하우스",
                "에어비": "에어비앤비",
                "민박": "게스트하우스"
            }
            for keyword, standard in accommodation_keywords.items():
                if keyword in user_input:
                    parsed_text = standard
                    break
        
        logger.info(f"✅ Parsed result: {parsed_text}")
        
        return ParseAnswerResponse(
            success=True,
            parsed_text=parsed_text
        )
        
    except Exception as e:
        logger.error(f"❌ Parse error: {str(e)}")
        # 에러가 발생해도 원본 텍스트를 반환
        return ParseAnswerResponse(
            success=True,
            parsed_text=request.user_input
        )


@router.post("/analyze-persona", response_model=AnalyzePersonaResponse)
async def analyze_persona(request: AnalyzePersonaRequest):
    """
    MBTI 스타일 질문 답변을 분석하여 사용자의 여행 캐릭터를 결정
    
    Args:
        request: 6개의 MBTI 스타일 질문에 대한 답변
        
    Returns:
        캐릭터(cat/dog/otter), MBTI 성향, 이유
    """
    try:
        logger.info(f"🎯 Analyzing persona for user: {request.user_id}")
        
        # 각 답변을 분석하여 점수 계산
        scores = {
            "cat": 0,    # 고양이: 독립적, 자유로운
            "dog": 0,    # 강아지: 사교적, 계획적
            "otter": 0   # 수달: 균형잡힌, 유연한
        }
        
        # Planning: 계획 성향
        if "분 단위" in request.planning or "계획" in request.planning:
            scores["dog"] += 2
        elif "그때그때" in request.planning or "즉흥" in request.planning:
            scores["cat"] += 2
        else:
            scores["otter"] += 1
            
        # Social: 사교성
        if "북적" in request.social or "많" in request.social:
            scores["dog"] += 2
        elif "조용" in request.social or "한적" in request.social:
            scores["cat"] += 2
        else:
            scores["otter"] += 1
            
        # Detail Focus: 디테일 집중도
        if "디테일" in request.detail_focus or "계획" in request.detail_focus:
            scores["dog"] += 1
        elif "경험" in request.detail_focus or "느낌" in request.detail_focus:
            scores["cat"] += 1
        else:
            scores["otter"] += 1
            
        # Decision Style: 결정 스타일
        if "신중" in request.decision_style or "계획" in request.decision_style:
            scores["dog"] += 1
        elif "유연" in request.decision_style or "즉흥" in request.decision_style:
            scores["cat"] += 1
        else:
            scores["otter"] += 1
            
        # Energy Source: 에너지 소스
        if "느긋" in request.energy_source or "휴식" in request.energy_source:
            scores["cat"] += 1
        elif "활동" in request.energy_source or "바쁘게" in request.energy_source:
            scores["dog"] += 1
        else:
            scores["otter"] += 1
            
        # Preparation: 준비 스타일
        if "꼼꼼" in request.preparation or "미리" in request.preparation:
            scores["dog"] += 1
        elif "필요한" in request.preparation or "간단" in request.preparation:
            scores["cat"] += 1
        else:
            scores["otter"] += 1
        
        # 최고 점수를 받은 캐릭터 선택
        character = max(scores, key=scores.get)
        
        logger.info(f"📊 Scores - Cat: {scores['cat']}, Dog: {scores['dog']}, Otter: {scores['otter']}")
        logger.info(f"🎭 Selected character: {character}")
        
        # MBTI 성향 결정
        mbti_traits = {
            "type_e": "E" if scores["dog"] > scores["cat"] else "I",
            "type_j": "J" if scores["dog"] > scores["cat"] else "P"
        }
        
        # 캐릭터별 설명
        reasons = {
            "cat": "자유롭고 독립적인 여행 스타일을 선호하시네요! 🐱 계획보다는 즉흥적으로 움직이며, 혼자만의 시간을 즐기는 당신은 고양이 같은 여행자입니다.",
            "dog": "사교적이고 계획적인 여행을 좋아하시는군요! 🐶 친구들과 함께하는 즐거운 여행, 꼼꼼한 계획을 세우는 당신은 강아지 같은 여행자입니다.",
            "otter": "균형잡힌 여행 스타일을 가지셨네요! 🦦 상황에 따라 유연하게 대처하며, 계획과 즉흥을 적절히 섞는 당신은 수달 같은 여행자입니다."
        }
        
        return AnalyzePersonaResponse(
            character=character,
            mbti_traits=mbti_traits,
            reason=reasons[character]
        )
        
    except Exception as e:
        logger.error(f"❌ Persona analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"페르소나 분석 중 오류가 발생했습니다: {str(e)}")
