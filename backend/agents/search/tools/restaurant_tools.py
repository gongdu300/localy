"""맛집 추천 관련 LangChain 툴 모음"""
from langchain.tools import tool
from typing import Optional, List


@tool
def search_restaurants_tool(
    region: str,
    preference: Optional[str] = None,
    age_group: Optional[str] = None,
    gender: Optional[str] = None,  # NEW
    companion: Optional[str] = None,  # NEW
    occasion: Optional[str] = None,  # NEW
    dietary_restrictions: Optional[List[str]] = None,  # NEW
    sort_by: str = "review_count",
    num_results: int = 10
) -> dict:
    """
    특정 지역의 맛집 검색 (고도화)
    
    맞춤 추천 기능:
    - 성별/나이/동행자/상황별 추천
    - 식단 제한 (채식/비건/할랄)
    
    Args:
        region: 검색 지역
        preference: 음식 선호
        age_group: 연령대
        gender: 성별 ("남성"/"여성")
        companion: 동행자 ("혼자"/"데이트"/"가족"/"친구"/"회식")
        occasion: 상황 ("일상"/"기념일"/"회식"/"모임")
        dietary_restrictions: 식단 제한 리스트
        sort_by: 정렬 기준
        num_results: 결과 개수
    
    Returns:
        dict: 맛집 리스트
    """
    from ..restaurant_agent import search_restaurants
    result = search_restaurants(region, preference, age_group, gender, companion, occasion, dietary_restrictions, sort_by, num_results)
    return result.dict()


@tool
def get_restaurant_reviews_tool(place_id: str, num_reviews: int = 20) -> dict:
    """
    특정 맛집의 리뷰 요약 (타임라인 포함)
    
    시간대별 리뷰 트렌드를 분석합니다.
    
    Args:
        place_id: Google Place ID
        num_reviews: 분석할 리뷰 개수
    
    Returns:
        dict: 리뷰 요약 + 타임라인
    """
    from agents.restaurant_agent import get_restaurant_reviews
    result = get_restaurant_reviews(place_id, num_reviews)
    return result.dict()


@tool
def extract_menu_tool(place_id: str, num_reviews: int = 20) -> dict:
    """
    리뷰에서 메뉴 추출
    
    Args:
        place_id: Google Place ID
        num_reviews: 분석할 리뷰 개수
    
    Returns:
        dict: 메뉴 정보
    """
    from agents.restaurant_agent import extract_menu
    result = extract_menu(place_id, num_reviews)
    return result.dict()


@tool
def verify_restaurant_tool(place_id: str, user_location: Optional[tuple] = None) -> dict:
    """
    맛집 검증 및 신뢰도 점수
    
    Args:
        place_id: Google Place ID
        user_location: 사용자 위치 (lat, lng)
    
    Returns:
        dict: 검증 결과
    """
    from agents.restaurant_agent import verify_restaurant
    result = verify_restaurant(place_id, user_location)
    return result.dict()


@tool
def compare_restaurants_tool(place_ids: List[str]) -> dict:
    """
    여러 맛집 비교 분석
    
    2-4개 맛집을 동시에 비교하여 추천합니다.
    
    Args:
        place_ids: 비교할 맛집의 place_id 리스트
    
    Returns:
        dict: 비교 분석 결과
    """
    from agents.restaurant_agent import compare_restaurants
    result = compare_restaurants(place_ids)
    return result.dict()


@tool
def get_restaurant_details_tool(place_id: str) -> dict:
    """
    맛집 상세 정보 (예약/가격/주차/애완견) 한 번에 조회
    
    배치 처리로 빠르게 모든 추가 정보를 가져옵니다.
    
    Args:
        place_id: Google Place ID
    
    Returns:
        dict: {
            'reservation': {...},  # 예약 정보
            'price': {...},  # 가격 분석
            'parking': {...},  # 주차 정보
            'pet': {...}  # 애완견 동반
        }
    """
    from agents.restaurant_agent import get_all_restaurant_info
    return get_all_restaurant_info(place_id)


@tool
def extract_reservation_info_tool(place_id: str) -> dict:
    """
    맛집 예약 정보 추출
    
    Args:
        place_id: Google Place ID
    
    Returns:
        dict: 예약 필수 여부, 방법, 신뢰도
    """
    from agents.restaurant_agent import extract_reservation_info
    return extract_reservation_info(place_id)


@tool
def analyze_menu_price_tool(place_id: str) -> dict:
    """
    맛집 가격 분석
    
    Args:
        place_id: Google Place ID
    
    Returns:
        dict: 평균 가격, 가격대, 추천 예산
    """
    from agents.restaurant_agent import analyze_menu_price
    return analyze_menu_price(place_id)


@tool
def get_parking_info_tool(place_id: str) -> dict:
    """
    맛집 주차 정보
    
    Args:
        place_id: Google Place ID
    
    Returns:
        dict: 주차 가능 여부, 타입
    """
    from agents.restaurant_agent import get_parking_info
    return get_parking_info(place_id)


@tool
def get_pet_friendly_info_tool(place_id: str) -> dict:
    """
    애완견 동반 가능 여부
    
    Args:
        place_id: Google Place ID
    
    Returns:
        dict: 반려견 동반 가능 여부, 신뢰도
    """
    from agents.restaurant_agent import get_pet_friendly_info
    return get_pet_friendly_info(place_id)


@tool
def analyze_rating_distribution_tool(place_id: str) -> dict:
    """
    별점 분포 분석
    
    Args:
        place_id: Google Place ID
    
    Returns:
        dict: 1~5점 분포 및 비율
    """
    from agents.restaurant_agent import analyze_rating_distribution
    return analyze_rating_distribution(place_id)


@tool
def calculate_revisit_rate_tool(place_id: str) -> dict:
    """
    재방문율 분석
    
    Args:
        place_id: Google Place ID
    
    Returns:
        dict: 재방문율, 레벨
    """
    from agents.restaurant_agent import get_place_details, calculate_revisit_rate
    reviews = get_place_details(place_id, ['reviews']).get('reviews', [])
    return calculate_revisit_rate(reviews)


@tool
def extract_keywords_tool(place_id: str) -> dict:
    """
    리뷰 키워드 추출
    
    Args:
        place_id: Google Place ID
    
    Returns:
        dict: 상위 키워드, 카테고리별 키워드
    """
    from agents.restaurant_agent import get_place_details, extract_keywords
    reviews = get_place_details(place_id, ['reviews']).get('reviews', [])
    return extract_keywords(reviews)


@tool
def analyze_sentiment_timeline_tool(place_id: str) -> dict:
    """
    감정 분석 타임라인
    
    Args:
        place_id: Google Place ID
    
    Returns:
        dict: 월별 감정 분포, 전체 비율
    """
    from agents.restaurant_agent import get_place_details, analyze_sentiment_timeline
    reviews = get_place_details(place_id, ['reviews']).get('reviews', [])
    return analyze_sentiment_timeline(reviews)


@tool
def get_advanced_review_analysis_tool(place_id: str) -> dict:
    """
    고급 리뷰 분석 통합 (한 번에 모든 분석)
    
    Args:
        place_id: Google Place ID
    
    Returns:
        dict: 별점 분포, 재방문율, 키워드, 감정 분석
    """
    from agents.restaurant_agent import get_advanced_review_analysis
    return get_advanced_review_analysis(place_id)


@tool
def get_blog_review_count_tool(place_name: str, address: str = "") -> dict:
    """
    네이버 블로그 리뷰 수
    
    Args:
        place_name: 맛집 이름
        address: 주소 (선택)
    
    Returns:
        dict: 블로그 리뷰 수, 최근 포스트
    """
    from agents.restaurant_agent import get_blog_review_count
    return get_blog_review_count(place_name, address)


@tool
def get_youtube_mentions_tool(place_name: str) -> dict:
    """
    유튜브 언급 수
    
    Args:
        place_name: 맛집 이름
    
    Returns:
        dict: 비디오 수, 인기 영상
    """
    from agents.restaurant_agent import get_youtube_mentions
    return get_youtube_mentions(place_name)


@tool
def get_instagram_popularity_tool(place_name: str) -> dict:
    """
    인스타그램 인기도
    
    Args:
        place_name: 맛집 이름
    
    Returns:
        dict: 해시태그, 검색 URL
    """
    from agents.restaurant_agent import get_instagram_popularity
    return get_instagram_popularity(place_name)


@tool
def get_social_data_tool(place_name: str, address: str = "") -> dict:
    """
    소셜 데이터 통합 (블로그 + 유튜브 + 인스타그램)
    
    Args:
        place_name: 맛집 이름
        address: 주소 (선택)
    
    Returns:
        dict: 블로그, 유튜브, 인스타그램 데이터
    """
    from agents.restaurant_agent import get_social_data
    return get_social_data(place_name, address)
