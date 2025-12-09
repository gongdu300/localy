"""예산 관리 에이전트 - 고도화 버전
한국관광공사 API + Google Directions API 활용
"""
import os
import logging
from typing import Dict, List, Optional
from dotenv import load_dotenv
import googlemaps
import requests
from schemas.data_models import AgentResponse, BudgetData

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API 설정
GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
KOREA_TOUR_API_KEY = os.getenv("KOREA_TOUR_API_KEY")
KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY")
gmaps = googlemaps.Client(key=GOOGLE_API_KEY) if GOOGLE_API_KEY else None


def get_coordinates(query: str) -> Optional[str]:
    """
    장소명으로 좌표 검색 (Kakao Local API)
    
    Args:
        query: 장소명 (예: "서울역")
    
    Returns:
        "x,y" 문자열 (경도,위도) 또는 None
    """
    if not KAKAO_REST_API_KEY:
        return None
        
    url = "https://dapi.kakao.com/v2/local/search/keyword.json"
    headers = {"Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"}
    params = {"query": query}
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        documents = data.get('documents')
        if documents:
            x = documents[0]['x']  # 경도 (Longitude)
            y = documents[0]['y']  # 위도 (Latitude)
            return f"{x},{y}"
    except Exception as e:
        logger.error(f"좌표 검색 실패 ({query}): {e}")
    
    return None


def calculate_transportation_cost(origin: str, destination: str, mode: str = "transit") -> Dict:
    """
    교통비 계산 (Kakao Directions API)
    
    Args:
        origin: 출발지 (장소명)
        destination: 목적지 (장소명)
        mode: transit | driving (Kakao는 통합 경로)
    
    Returns:
        교통비 정보
    """
    try:
        if not KAKAO_REST_API_KEY:
            return {"cost": 0, "error": "Kakao API 키 없음"}
        
        # 1. 좌표 변환
        origin_coords = get_coordinates(origin)
        dest_coords = get_coordinates(destination)
        
        if not origin_coords or not dest_coords:
            return {"cost": 0, "error": "좌표 변환 실패"}
            
        # 2. 길찾기 API 호출
        url = "https://apis-navi.kakaomobility.com/v1/directions"
        headers = {
            "Authorization": f"KakaoAK {KAKAO_REST_API_KEY}",
            "Content-Type": "application/json"
        }
        params = {
            "origin": origin_coords,
            "destination": dest_coords,
            "priority": "RECOMMEND"
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        routes = data.get('routes', [])
        if not routes:
            return {"cost": 0, "error": "경로 없음"}
            
        summary = routes[0]['summary']
        fare = summary.get('fare', {})
        
        # 택시비 + 통행료
        taxi_cost = fare.get('taxi', 0)
        toll_fare = fare.get('toll', 0)
        total_fare = taxi_cost + toll_fare
        
        # 대중교통 모드라면 택시비 대신 일반적인 시외버스/KTX 등의 평균 비용을 추산해야 하지만,
        # Kakao Navi는 자동차 기준이므로 택시비를 기준으로 하되 조금 조정하거나 그대로 사용
        # 여기서는 택시비 그대로 사용 (가장 보수적인 예산)
        
        duration_min = summary.get('duration', 0) // 60
        distance_km = summary.get('distance', 0) / 1000
        
        logger.info(f"Kakao 길찾기: {origin}->{destination} ({distance_km:.1f}km, {total_fare}원)")
        
        return {
            "cost": total_fare,
            "duration": f"{duration_min}분",
            "distance": f"{distance_km:.1f}km",
            "mode": "driving (Kakao)"
        }
        
    except Exception as e:
        logger.error(f"교통비 계산 실패: {e}")
        return {"cost": 0, "error": str(e)}


def estimate_accommodation_cost(region: str, accommodation_type: str = "호텔") -> Dict:
    """
    숙박비 추정 (지역별 평균 가격 데이터베이스)
    
    한국관광공사 API 의존성 제거 - 자체 데이터 사용
    
    Args:
        region: 지역명 (예: 강릉, 부산)
        accommodation_type: 숙박 유형
    
    Returns:
        숙박비 정보
    """
    # 지역별 가격 계수 (서울 기준 1.0)
    region_multipliers = {
        "서울": 1.2, "강남": 1.5, "명동": 1.3,
        "부산": 1.0, "해운대": 1.2, "광안리": 1.1,
        "제주": 1.3, "서귀포": 1.2,
        "강릉": 1.0, "속초": 1.0, "양양": 0.9,
        "전주": 0.9, "경주": 0.9, "여수": 1.0,
        "인천": 0.9, "대전": 0.8, "대구": 0.8,
        "광주": 0.8, "울산": 0.8, "춘천": 0.8
    }
    
    # 숙박 유형별 기본 가격
    base_prices = {
        "호텔": 80000,
        "리조트": 150000,
        "펜션": 120000,
        "게스트하우스": 30000,
        "한옥": 60000,
        "모텔": 50000,
        "에어비앤비": 70000
    }
    
    # 지역 찾기 (부분 매칭)
    multiplier = 1.0
    matched_region = None
    for r, m in region_multipliers.items():
        if r in region:
            multiplier = m
            matched_region = r
            break
    
    # 최종 가격 계산
    base_price = base_prices.get(accommodation_type, 70000)
    final_price = int(base_price * multiplier)
    
    logger.info(f"숙박비 추정: {region} ({matched_region or '기타'}) - {accommodation_type} {final_price:,}원")
    
    return {
        "estimated_cost": final_price,
        "source": "지역별 평균 가격 DB",
        "region_multiplier": multiplier,
        "matched_region": matched_region or "기타 지역"
    }


def get_admission_fees(region: str) -> Dict:
    """
    관광지 입장료 조회 (지역별 데이터베이스)
    
    한국관광공사 API 의존성 제거 - 자체 데이터 사용
    
    Args:
        region: 지역명
    
    Returns:
        입장료 정보
    """
    # 주요 관광지 입장료 DB
    attraction_fees = {
        "서울": [
            {"name": "경복궁", "fee": 3000},
            {"name": "창덕궁", "fee": 3000},
            {"name": "덕수궁", "fee": 1000},
            {"name": "N서울타워", "fee": 16000},
        ],
        "부산": [
            {"name": "해운대", "fee": 0},
            {"name": "감천문화마을", "fee": 0},
            {"name": "태종대", "fee": 0},
            {"name": "부산타워", "fee": 12000},
        ],
        "제주": [
            {"name": "성산일출봉", "fee": 5000},
            {"name": "만장굴", "fee": 4000},
            {"name": "한라산", "fee": 0},
            {"name": "우도", "fee": 0},
        ],
        "강릉": [
            {"name": "경포대", "fee": 0},
            {"name": "오죽헌", "fee": 3000},
            {"name": "선교장", "fee": 5000},
        ],
        "경주": [
            {"name": "불국사", "fee": 6000},
            {"name": "석굴암", "fee": 6000},
            {"name": "첨성대", "fee": 0},
        ],
        "전주": [
            {"name": "한옥마을", "fee": 0},
            {"name": "경기전", "fee": 3000},
        ],
    }
    
    # 지역 찾기 (부분 매칭)
    attractions = []
    for r, attr_list in attraction_fees.items():
        if r in region:
            attractions = attr_list
            break
    
    # 못 찾으면 기본값
    if not attractions:
        attractions = [
            {"name": "관광지A", "fee": 3000},
            {"name": "관광지B", "fee": 5000},
        ]
    
    # 상위 3개 평균
    total_fee = sum(a["fee"] for a in attractions[:3])
    attraction_names = [a["name"] for a in attractions[:3]]
    
    logger.info(f"입장료 추정: {region} - {total_fee:,}원 ({len(attractions)}개 관광지)")
    
    return {
        "total_admission": total_fee,
        "attractions": attraction_names,
        "source": "지역별 관광지 DB",
        "count": len(attractions)
    }


def track_budget_advanced(
    total_budget: int,
    region: str,
    days: int = 2,
    transportation: Optional[Dict] = None,
    accommodation_type: str = "호텔",
    num_people: int = 1,
    manual_accommodation_cost: Optional[int] = None  # 추가: 실제 조회된 가격
) -> AgentResponse:
    """
    예산 추적 - 고도화 버전
    
    Args:
        total_budget: 총 예산
        region: 여행 지역
        days: 여행 일수
        transportation: 교통 정보
        accommodation_type: 숙박 유형
        num_people: 인원 수
        manual_accommodation_cost: 실제 조회된 1박 숙박비 (없으면 추정치 사용)
    """
    try:
        # 안전장치: 필수값 누락 시 기본값 적용
        if total_budget is None: total_budget = 0
        if days is None: days = 2
        if num_people is None: num_people = 2

        logger.info(f"💰 고급 예산 계산: {region}, {days}일, {num_people}명")
        
        breakdown = {}
        
        # 1. 교통비
        if transportation:
            transport_cost = calculate_transportation_cost(
                transportation.get("origin", "서울"),
                transportation.get("destination", region),
                transportation.get("mode", "transit")
            )
            breakdown["교통비"] = transport_cost['cost'] * num_people * 2  # 왕복
        else:
            breakdown["교통비"] = 20000 * num_people * 2
        
        # 2. 숙박비
        if manual_accommodation_cost is not None and manual_accommodation_cost > 0:
            # 실제 조회된 가격 사용
            total_accommodation = manual_accommodation_cost * (days - 1)
            breakdown["숙박비"] = total_accommodation
            logger.info(f"  🏨 실제 숙박비 적용: {manual_accommodation_cost:,}원/박 -> 총 {total_accommodation:,}원")
        else:
            # 기존 추정 로직 사용
            accommodation = estimate_accommodation_cost(region, accommodation_type)
            breakdown["숙박비"] = accommodation['estimated_cost'] * (days - 1)
        
        # 3. 식비 (1인 3만원/일)
        breakdown["식비"] = 30000 * days * num_people
        
        # 4. 입장료
        admission = get_admission_fees(region)
        breakdown["입장료"] = admission['total_admission'] * num_people
        
        # 5. 기타 (쇼핑, 간식 등)
        breakdown["기타"] = 50000 * days * num_people
        
        # 총 지출
        total_spent = sum(breakdown.values())
        remaining = total_budget - total_spent
        
        # 경고
        warning = remaining < 0
        
        budget_data = BudgetData(
            total_budget=total_budget,
            spent=breakdown,
            remaining=remaining,
            warning=warning,
            breakdown={
                "transportation_details": transportation,
                "accommodation_type": accommodation_type,
                "days": days,
                "num_people": num_people
            }
        )
        
        message = f"✅ 예산: {remaining:,}원 남음" if remaining >= 0 else f"⚠️ 예산 초과: {abs(remaining):,}원"
        
        return AgentResponse(
            success=True,
            agent_name="budget",
            data=[budget_data.dict()],
            count=1,
            message=message
        )
        
    except Exception as e:
        logger.error(f"❌ 예산 추적 실패: {e}")
        return AgentResponse(
            success=False,
            agent_name="budget",
            message="예산 추적 실패",
            error=str(e)
        )


# 간단 버전 (팀양식 기본)
def track_budget(total_budget: int, expenses: Dict[str, int]) -> AgentResponse:
    """
    예산 추적 - 기본 버전
    
    Args:
        total_budget: 총 예산
        expenses: 지출 내역
    
    Returns:
        AgentResponse
    """
    try:
        total_spent = sum(expenses.values())
        remaining = total_budget - total_spent
        
        budget_data = BudgetData(
            total_budget=total_budget,
            spent=expenses,
            remaining=remaining,
            warning=remaining < 0
        )
        
        message = f"예산: {remaining:,}원 남음" if remaining >= 0 else f"⚠️ 예산 초과: {abs(remaining):,}원"
        
        return AgentResponse(
            success=True,
            agent_name="budget",
            data=[budget_data.dict()],
            count=1,
            message=message
        )
    except Exception as e:
        return AgentResponse(
            success=False,
            agent_name="budget",
            message="예산 추적 실패",
            error=str(e)
        )
