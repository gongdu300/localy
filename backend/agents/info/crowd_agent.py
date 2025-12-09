"""혼잡도 에이전트
Google Places API 활용
"""
import os
import logging
from typing import Optional
from dotenv import load_dotenv
import googlemaps
from schemas.data_models import AgentResponse

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
gmaps = googlemaps.Client(key=GOOGLE_API_KEY) if GOOGLE_API_KEY else None


def get_crowd_info(place_id: str) -> AgentResponse:
    """
    혼잡도 확인
    
    Args:
        place_id: Google Place ID
    
    Returns:
        AgentResponse with crowd recommendation
    """
    try:
        logger.info(f"👥 혼잡도 확인: {place_id}")
        
        if not gmaps:
            return AgentResponse(
                success=False,
                agent_name="crowd",
                message="Google API 키 없음",
                error="GOOGLE_PLACES_API_KEY not found"
            )
        
        # Google Places 상세 정보
        try:
            details = gmaps.place(
                place_id,
                fields=['name', 'current_opening_hours', 'rating', 'user_ratings_total']
            )['result']
        except Exception as e:
            # Broaden catch to debug what exception is actually raised
            error_str = str(e)
            if 'NOT_FOUND' in error_str or 'NotFound' in error_str:
                logger.error(f"❌ 장소 ID를 찾을 수 없음: {place_id}")
                return AgentResponse(
                    success=False,
                    agent_name="crowd",
                    message="장소 정보를 찾을 수 없습니다. (Place ID 만료됨)",
                    error="NOT_FOUND: The provided Place ID is valid but no longer exists."
                )
            raise e
        
        place_name = details.get('name', '장소')
        rating = details.get('rating', 0)
        review_count = details.get('user_ratings_total', 0)
        
        # 혼잡도 추정 로직
        recommendation = generate_recommendation(rating, review_count)
        
        return AgentResponse(
            success=True,
            agent_name="crowd",
            data=[{
                'place_name': place_name,
                'place_id': place_id,
                'recommendation': recommendation,
                'rating': rating,
                'review_count': review_count,
                'popularity_level': categorize_popularity(review_count)
            }],
            count=1,
            message="혼잡도 확인 완료!"
        )
        
    except Exception as e:
        logger.error(f"❌ 혼잡도 확인 실패: {e}")
        return AgentResponse(
            success=False,
            agent_name="crowd",
            message="혼잡도 확인 실패",
            error=str(e)
        )


def generate_recommendation(rating: float, review_count: int) -> str:
    """
    혼잡도 기반 추천 생성
    
    Args:
        rating: 평점
        review_count: 리뷰 수
    
    Returns:
        추천 문구
    """
    if review_count < 100:
        return "🟢 한산함 - 조용히 즐기기 좋음, 언제든 방문 가능"
    elif review_count < 500:
        return "🟡 보통 - 평일 오전/오후 방문 추천"
    elif review_count < 2000:
        return "🟠 인기 많음 - 주말 피크타임 혼잡, 평일 방문 권장"
    else:
        return "🔴 매우 혼잡 - 사전 예약 필수, 평일 이른 시간 방문 강력 권장"


def categorize_popularity(review_count: int) -> str:
    """
    인기도 분류
    
    Args:
        review_count: 리뷰 수
    
    Returns:
        인기도 레벨
    """
    if review_count < 100:
        return "낮음"
    elif review_count < 500:
        return "보통"
    elif review_count < 2000:
        return "높음"
    else:
        return "매우 높음"
