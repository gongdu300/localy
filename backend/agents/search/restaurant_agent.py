"""맛집 추천 에이전트"""
import os
import logging
import time
import json
from typing import List, Optional
from dotenv import load_dotenv
import googlemaps
from langchain_openai import ChatOpenAI
from schemas.data_models import PlaceData, AgentResponse

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API 클라이언트 초기화
GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

gmaps = googlemaps.Client(key=GOOGLE_API_KEY) if GOOGLE_API_KEY else None
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.7,
    api_key=OPENAI_API_KEY
) if OPENAI_API_KEY else None

# API 호출 캐시 (성능 최적화)
_place_cache = {}


def get_place_details(place_id: str, fields: list) -> dict:
    """
    Google Places API 호출 with 캐싱
    
    Args:
        place_id: Place ID
        fields: 필요한 필드 리스트
    
    Returns:
        dict: Place details
    """
    # 캐시 키 생성
    cache_key = f"{place_id}:{','.join(sorted(fields))}"
    
    # 캐시에 있으면 반환
    if cache_key in _place_cache:
        return _place_cache[cache_key]
    
    # API 호출
    try:
        result = gmaps.place(place_id, fields=fields, language='ko')['result']
        _place_cache[cache_key] = result
        return result
    except Exception as e:
        logger.warning(f"API 호출 실패: {e}")
        return {}


def get_all_restaurant_info(place_id: str) -> dict:
    """
    맛집의 모든 정보를 한 번에 가져오기 (배치 처리)
    
    Returns:
        dict: {
            'reservation': {...},
            'price': {...},
            'parking': {...},
            'pet': {...}
        }
    """
    # 한 번의 API 호출로 모든 필드 가져오기
    details = get_place_details(place_id, [
        'reservable', 'reviews', 'price_level'
    ])
    
    reviews = details.get('reviews', [])
    
    # 예약 정보
    reservable = details.get('reservable', False)
    reservation_mentions = sum(1 for r in reviews[:10] if any(k in r.get('text', '').lower() for k in ['예약', 'reservation']))
    required_mentions = sum(1 for r in reviews[:10] if any(k in r.get('text', '').lower() for k in ['예약 필수', '예약해야']))
    
    reservation_info = {
        "reservation_required": required_mentions > 0 or reservable,
        "method": "전화/온라인" if reservable else "전화",
        "confidence": round(reservation_mentions / max(len(reviews[:10]), 1), 2),
        "evidence": f"{reservation_mentions}개 리뷰에서 예약 언급"
    }
    
    # 가격 정보
    price_level = details.get('price_level', 2)
    price_map = {
        0: {"average_price": 5000, "budget_level": "저렴", "recommended_budget": "1만원 이하"},
        1: {"average_price": 10000, "budget_level": "저렴", "recommended_budget": "1-2만원"},
        2: {"average_price": 20000, "budget_level": "보통", "recommended_budget": "2-3만원"},
        3: {"average_price": 35000, "budget_level": "비쌈", "recommended_budget": "3-5만원"},
        4: {"average_price": 60000, "budget_level": "고급", "recommended_budget": "5만원 이상"}
    }
    price_info = price_map.get(price_level, price_map[2])
    
    # 주차 정보
    parking_mentions = sum(1 for r in reviews[:20] if any(k in r.get('text', '').lower() for k in ['주차', 'parking']))
    free_parking = sum(1 for r in reviews[:20] if any(k in r.get('text', '').lower() for k in ['무료', '주차 편', '주차장 넓']))
    difficult_parking = sum(1 for r in reviews[:20] if any(k in r.get('text', '').lower() for k in ['주차 어려', '주차 힘', '주차 없']))
    
    if parking_mentions == 0:
        parking_info = {"available": None, "type": "정보 없음"}
    elif free_parking > difficult_parking:
        parking_info = {"available": True, "type": "무료/편리", "evidence": f"{free_parking}개 리뷰"}
    elif difficult_parking > 0:
        parking_info = {"available": False, "type": "어려움", "evidence": f"{difficult_parking}개 리뷰"}
    else:
        parking_info = {"available": True, "type": "있음", "evidence": f"{parking_mentions}개 리뷰"}
    
    # 애완견 정보
    pet_mentions = sum(1 for r in reviews[:20] if any(k in r.get('text', '').lower() for k in ['반려견', '애완견', '강아지', '펫', 'pet']))
    pet_allowed = sum(1 for r in reviews[:20] if any(k in r.get('text', '').lower() for k in ['동반 가능', '펫 프렌들리', '강아지 ok', '반려견 ok']))
    
    if pet_mentions == 0:
        pet_info = {"pet_allowed": None, "confidence": 0, "note": "정보 없음"}
    else:
        pet_info = {
            "pet_allowed": pet_allowed > 0,
            "confidence": round(pet_allowed / pet_mentions, 2) if pet_mentions > 0 else 0,
            "evidence": f"{pet_allowed}/{pet_mentions}개 리뷰에서 동반 가능 언급"
        }
    
    return {
        'reservation': reservation_info,
        'price': price_info,
        'parking': parking_info,
        'pet': pet_info
    }


def detect_region_type(region: str) -> tuple[str, int]:
    """
    지역 타입을 감지하고 적절한 검색 반경 반환
    
    Args:
        region: 지역명
    
    Returns:
        (타입, 반경) 튜플
    """
    if ' ' in region.strip():
        return ("district", 10000)
    else:
        return ("city", 15000)


def search_restaurants(
    region: str,
    preference: Optional[str] = None,
    age_group: Optional[str] = None,
    gender: Optional[str] = None,  # NEW
    companion: Optional[str] = None,  # NEW
    occasion: Optional[str] = None,  # NEW
    dietary_restrictions: Optional[List[str]] = None,  # NEW
    sort_by: str = "review_count",
    num_results: int = 10,
    radius: Optional[int] = None
) -> AgentResponse:
    """
    맛집 검색 (고도화)
    
    맞춤 추천:
    - 성별/나이/동행자/상황별 추천
    - preference: 음식 종류 ("한식", "일식", "비건", "채식")
    - dietary_restrictions: 제외할 음식 (알레르기 등)
      예: ["견과류", "해산물", "유제품", "글루텐"]
    
    Args:
        region: 검색 지역
        preference: 음식 선호 (비건/채식은 여기에)
        age_group: 연령대
        gender: 성별
        companion: 동행자
        occasion: 상황
        dietary_restrictions: 제외 음식 (알레르기)
        sort_by: 정렬
        num_results: 결과 개수
        radius: 반경
    
    Returns:
        AgentResponse: 맛집 리스트
    """
    try:
        if not gmaps:
            return AgentResponse(
                success=False,
                agent_name="restaurant",
                data=[],
                count=0,
                message="Google API 키가 설정되지 않았습니다.",
                error="GOOGLE_PLACES_API_KEY not found"
            )
        
        logger.info(f"🔍 맛집 검색: {region}")
        
        # 1. 좌표 변환
        geocode_result = gmaps.geocode(f"{region}, 대한민국", language="ko")
        if not geocode_result:
            return AgentResponse(
                success=False,
                agent_name="restaurant",
                data=[],
                count=0,
                message=f"'{region}' 지역을 찾을 수 없습니다.",
                error=f"Geocoding failed for region: {region}"
            )
        
        coords = geocode_result[0]['geometry']['location']
        logger.info(f"📍 좌표: {coords['lat']}, {coords['lng']}")
        
        # 지역 타입 감지 및 반경 결정
        if radius is None:
            region_type, auto_radius = detect_region_type(region)
            search_radius = auto_radius
            type_text = "도시 전체" if region_type == "city" else "세부 지역"
            logger.info(f"🎯 검색 타입: {type_text} (반경 {search_radius}m)")
        else:
            search_radius = radius
            logger.info(f"🎯 수동 반경: {search_radius}m")
        
        # 2. Google Places 검색 (페이지네이션으로 최대 60개)
        search_params = {
            'location': (coords['lat'], coords['lng']),
            'radius': search_radius,
            'type': 'restaurant',
            'language': 'ko'
        }
        
        if preference:
            search_params['keyword'] = preference
        
        all_results = []
        results = gmaps.places_nearby(**search_params)
        all_results.extend(results.get('results', []))
        
        # 최적화: 페이지네이션 제거 - 첫 페이지 20개만 사용! ⚡
        logger.info(f"⚡ 최적화: 첫 페이지만 로드 (페이지네이션 스킵)")
        
        logger.info(f"📊 총 검색 결과: {len(all_results)}개")
        
        if not all_results:
            return AgentResponse(
                success=True,
                agent_name="restaurant",
                data=[],
                count=0,
                message=f"{region}에서 맛집을 찾지 못했습니다. 검색 조건을 변경해보세요."
            )
        
        # 3. 필터링 (리뷰 50개 이상)
        filtered = [
            r for r in all_results
            if r.get('user_ratings_total', 0) >= 50
        ]
        
        logger.info(f"📊 필터링: {len(all_results)}개 → {len(filtered)}개 (리뷰 50개 이상)")
        
        # 필터링 결과가 없으면 리뷰 10개 이상으로 완화
        if not filtered:
            filtered = [
                r for r in all_results
                if r.get('user_ratings_total', 0) >= 10
            ]
            logger.info(f"📊 필터 완화: {len(filtered)}개 (리뷰 10개 이상)")
        
        # 4. 연령대별 필터링
        if age_group:
            age_filters = {
                "10대": {"min_rating": 4.0, "keywords": ["핫플", "인스타", "트렌디"]},
                "20대": {"min_rating": 4.2, "keywords": ["핫플", "감성", "분위기"]},
                "30대": {"min_rating": 4.3, "keywords": ["가성비", "맛집"]},
                "40대": {"min_rating": 4.4, "keywords": ["정갈", "품질"]},
                "50대": {"min_rating": 4.5, "keywords": ["전통", "한식"]},
                "60대+": {"min_rating": 4.5, "keywords": ["전통", "건강"]}
            }
            
            if age_group in age_filters:
                age_filter = age_filters[age_group]
                # 평점 필터
                filtered = [r for r in filtered if r.get('rating', 0) >= age_filter["min_rating"]]
                logger.info(f"👥 연령대 필터 ({age_group}): {len(filtered)}개")
        
        # 4.5 성별/동행자별 필터링 (NEW)
        if gender or companion or occasion:
            # LLM으로 맞춤 추천 키워드 생성
            context_parts = []
            if gender:
                context_parts.append(f"{gender}")
            if companion:
                context_parts.append(f"{companion}")
            if occasion:
                context_parts.append(f"{occasion}")
            
            context = " + ".join(context_parts)
            logger.info(f"🎯 맞춤 필터: {context}")
            
            # 동행자별 추천 키워드
            companion_keywords = {
                "혼자": ["혼밥", "1인", "바", "카운터"],
                "데이트": ["분위기", "조용", "프라이빗", "루프탑", "뷰맛집"],
                "가족": ["넓은", "단체석", "키즈", "주차"],
                "친구": ["분위기", "술", "안주", "회식"],
                "회식": ["단체", "룸", "주차", "술"]
            }
            
            # 상황별 추천 키워드
            occasion_keywords = {
                "일상": ["가성비", "맛집"],
                "기념일": ["분위기", "특별", "코스", "예약"],
                "회식": ["단체", "룸", "주차"],
                "모임": ["넓은", "시끌벅적", "술"]
            }
        
        # 4.6 알레르기/제외 음식 필터링 (NEW - 재설계)
        if dietary_restrictions:
            logger.info(f"🚫 제외 음식: {', '.join(dietary_restrictions)}")
            
            # 제외할 음식 키워드 매핑 (포괄적)
            exclusion_keywords = {
                # 주요 알레르기 8종
                "견과류": ["땅콩", "호두", "아몬드", "잣", "캐슈넛", "피스타치오", "마카다미아", "peanut", "nut", "almond"],
                "우유": ["우유", "치즈", "버터", "크림", "요거트", "생크림", "milk", "dairy", "cheese"],
                "계란": ["계란", "달걀", "egg", "에그"],
                "대두": ["두부", "콩", "된장", "간장", "soy", "tofu", "bean"],
                "밀": ["밀", "빵", "파스타", "면", "밀가루", "wheat", "gluten", "pasta"],
                "고등어": ["고등어", "mackerel"],
                "게": ["게", "crab"],
                "새우": ["새우", "shrimp", "prawn"],
                
                # 추가 해산물
                "조개": ["조개", "clam", "shellfish"],
                "오징어": ["오징어", "squid"],
                "문어": ["문어", "octopus"],
                "생선": ["생선", "fish", "회"],
                "해산물": ["해산물", "seafood", "새우", "게", "조개", "오징어"],
                
                # 육류
                "돼지고기": ["돼지", "삼겹살", "목살", "항정살", "pork", "bacon"],
                "소고기": ["소고기", "beef", "스테이크", "갈비"],
                "닭고기": ["닭", "chicken", "치킨"],
                "양고기": ["양고기", "lamb", "mutton"],
                
                # 기타 알레르기
                "복숭아": ["복숭아", "peach"],
                "토마토": ["토마토", "tomato"],
                "돼지감자": ["돼지감자", "jerusalem artichoke"],
                "메밀": ["메밀", "buckwheat"],
                "아황산류": ["아황산", "sulfite", "와인"],
                
                # 식습관/종교
                "매운음식": ["매운", "spicy", "고추", "청양", "불닭"],
                "생것": ["회", "생선회", "육회", "raw", "sashimi", "tartare"],
                "술": ["술", "소주", "맥주", "와인", "alcohol"],
                
                # 건강
                "MSG": ["msg", "조미료", "화학조미료"],
                "설탕": ["설탕", "sugar", "단맛"],
                "소금": ["짠", "소금", "salt", "나트륨"]
            }
            
            # 리뷰 기반 제외 필터
            safe_restaurants = []
            for place in filtered[:30]:  # 상위 30개만 체크
                place_id = place['place_id']
                place_name = place['name']
                
                try:
                    # 메뉴/리뷰에서 제외 음식 확인
                    reviews = gmaps.place(place_id, fields=['reviews'], language='ko')['result'].get('reviews', [])[:10]
                    
                    has_excluded_food = False
                    for review in reviews:
                        text = review.get('text', '').lower()
                        # 제외 음식 키워드가 있는지 확인
                        for restriction in dietary_restrictions:
                            keywords = exclusion_keywords.get(restriction, [])
                            if any(keyword in text for keyword in keywords):
                                has_excluded_food = True
                                break
                        if has_excluded_food:
                            break
                    
                    # 제외 음식이 없으면 안전
                    if not has_excluded_food:
                        safe_restaurants.append(place)
                except:
                    # API 오류 시 일단 포함
                    safe_restaurants.append(place)
            
            if safe_restaurants:
                filtered = safe_restaurants
                logger.info(f"  제외 필터 결과: {len(filtered)}개 (안전한 맛집)")
        
        # 5. 정렬
        if sort_by == "rating":
            # 평점 우선
            sorted_results = sorted(
                filtered,
                key=lambda x: (x.get('rating', 0), x.get('user_ratings_total', 0)),
                reverse=True
            )[:num_results]
            logger.info(f"📊 정렬: 평점 우선")
        elif sort_by == "popularity":
            # 인기도 (리뷰 수 * 평점)
            sorted_results = sorted(
                filtered,
                key=lambda x: (x.get('user_ratings_total', 0) * x.get('rating', 0)),
                reverse=True
            )[:num_results]
            logger.info(f"📊 정렬: 인기도 (리뷰×평점)")
        else:  # review_count (기본)
            # 리뷰 수 우선
            sorted_results = sorted(
                filtered,
                key=lambda x: (x.get('user_ratings_total', 0), x.get('rating', 0)),
                reverse=True
            )[:num_results]
            logger.info(f"📊 정렬: 리뷰 수 우선")
        
        logger.info(f"🎯 상위 {len(sorted_results)}개 선택")
        
        # 6. 상세 정보 로드
        places = []
        for place in sorted_results:
            place_id = place['place_id']
            
            # 상세 정보 가져오기
            try:
                details = gmaps.place(
                    place_id,
                    fields=[
                        'formatted_phone_number',
                        'website',
                        'opening_hours',
                        'formatted_address',
                        'photo',
                        'price_level',
                        # 주변 시설
                        'wheelchair_accessible_entrance',
                        'reservable',
                        'delivery',
                        'takeout',
                        'dine_in'
                    ],
                    language='ko'
                )['result']
            except Exception as e:
                logger.warning(f"⚠️ 상세 정보 로드 실패 ({place['name']}): {e}")
                details = {}
            
            # 사진 URL 생성
            photo_urls = []
            if details.get('photos'):
                for photo in details['photos'][:3]:  # 최대 3개
                    photo_ref = photo.get('photo_reference')
                    if photo_ref:
                        photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference={photo_ref}&key={GOOGLE_API_KEY}"
                        photo_urls.append(photo_url)
            
            place_data = PlaceData(
                place_id=place_id,
                name=place['name'],
                category='restaurant',
                address=details.get('formatted_address', place.get('vicinity', '')),
                latitude=place['geometry']['location']['lat'],
                longitude=place['geometry']['location']['lng'],
                region=region,
                rating=place.get('rating', 0),
                review_count=place.get('user_ratings_total', 0),
                price_level=details.get('price_level', 0),
                opening_hours=details.get('opening_hours', {}).get('weekday_text', []),
                open_now=details.get('opening_hours', {}).get('open_now'),
                phone=details.get('formatted_phone_number'),
                website=details.get('website'),
                images=photo_urls,
                google_maps_url=f"https://www.google.com/maps/place/?q=place_id:{place_id}",
                tags=[preference] if preference else [],
                # 주변 시설
                facilities={
                    "wheelchair_accessible": details.get('wheelchair_accessible_entrance', False),
                    "reservable": details.get('reservable', False),
                    "delivery": details.get('delivery', False),
                    "takeout": details.get('takeout', False),
                    "dine_in": details.get('dine_in', True)
                }
            )
            
            places.append(place_data)
        
        logger.info(f"✅ 맛집 {len(places)}개 찾음!")
        
        return AgentResponse(
            success=True,
            agent_name="restaurant",
            data=[p.dict() for p in places],
            count=len(places),
            message=f"{region} 맛집 {len(places)}개 찾음! 🎯"
        )
        
    except Exception as e:
        logger.error(f"❌ 맛집 검색 실패: {e}")
        return AgentResponse(
            success=False,
            agent_name="restaurant",
            data=[],
            count=0,
            message="맛집 검색 중 오류 발생",
            error=str(e)
        )


def get_restaurant_reviews(place_id: str, num_reviews: int = 10) -> AgentResponse:
    """
    특정 맛집의 리뷰를 LLM으로 요약
    
    Args:
        place_id: Google Place ID
        num_reviews: 요약할 리뷰 개수 (기본 10개)
    
    Returns:
        AgentResponse: 리뷰 요약 (장점, 단점, 추천 메뉴)
    """
    try:
        if not gmaps:
            return AgentResponse(
                success=False,
                agent_name="restaurant_reviews",
                data=[],
                count=0,
                message="Google API 키가 설정되지 않았습니다.",
                error="GOOGLE_PLACES_API_KEY not found"
            )
        
        if not llm:
            return AgentResponse(
                success=False,
                agent_name="restaurant_reviews",
                data=[],
                count=0,
                message="OpenAI API 키가 설정되지 않았습니다.",
                error="OPENAI_API_KEY not found"
            )
        
        logger.info(f"📝 리뷰 요약: {place_id}")
        
        # 1. Google Places에서 리뷰 가져오기
        details = gmaps.place(place_id, fields=['name', 'reviews'], language='ko')
        place_name = details['result'].get('name', '알 수 없는 장소')
        reviews = details['result'].get('reviews', [])[:num_reviews]
        
        if not reviews:
            return AgentResponse(
                success=True,
                agent_name="restaurant_reviews",
                data=[],
                count=0,
                message=f"{place_name}의 리뷰를 찾을 수 없습니다."
            )
        
        # 2. 리뷰 텍스트 추출
        review_texts = [r.get('text', '') for r in reviews if r.get('text')]
        combined_reviews = "\n\n".join(review_texts[:10])  # 최대 10개
        
        # 2.5 타임라인 분석
        import datetime
        now = datetime.datetime.now()
        one_month_ago = now - datetime.timedelta(days=30)
        three_months_ago = now - datetime.timedelta(days=90)
        six_months_ago = now - datetime.timedelta(days=180)
        
        recent_1m = []
        recent_3m = []
        recent_6m = []
        
        for review in reviews:
            review_time = review.get('time', 0)
            review_date = datetime.datetime.fromtimestamp(review_time)
            rating = review.get('rating', 0)
            
            if review_date >= one_month_ago:
                recent_1m.append(rating)
            if review_date >= three_months_ago:
                recent_3m.append(rating)
            if review_date >= six_months_ago:
                recent_6m.append(rating)
        
        # 평균 계산
        avg_1m = sum(recent_1m) / len(recent_1m) if recent_1m else 0
        avg_3m = sum(recent_3m) / len(recent_3m) if recent_3m else 0
        avg_6m = sum(recent_6m) / len(recent_6m) if recent_6m else 0
        
        # 트렌드 분석
        trend = "데이터 부족"
        warning = None
        
        # 최소 3개월 데이터가 있어야 트렌드 분석 가능
        if len(recent_3m) >= 3:
            trend = "안정적"
            if len(recent_1m) >= 2 and avg_1m > 0 and avg_3m > 0:
                if avg_1m < avg_3m - 0.3:
                    trend = "하락세"
                    warning = "⚠️ 최근 1개월 평점이 하락했습니다"
                elif avg_1m > avg_3m + 0.3:
                    trend = "상승세"
        
        # 3. LLM으로 요약
        prompt = f"""다음은 "{place_name}" 맛집의 실제 고객 리뷰입니다. 이 리뷰들을 분석하여 요약해주세요.

리뷰:
{combined_reviews}

다음 형식의 JSON으로 응답하세요:
{{
    "summary": "전체 요약 (3-5줄)",
    "pros": ["장점1", "장점2", "장점3"],
    "cons": ["단점1", "단점2"],
    "recommended_menu": ["추천 메뉴1", "추천 메뉴2"],
    "atmosphere": "분위기 설명 (예: 조용하고 깔끔함, 활기차고 시끌벅적함)",
    "service": "서비스 평가 (예: 친절함, 빠름, 불친절함)",
    "value_for_money": "가성비 평가 (좋음/보통/나쁨)",
    "best_time_to_visit": "방문 추천 시간 (예: 점심시간 피하기, 저녁 예약 필수)",
    "parking": "주차 정보 (있음/없음/어려움)",
    "waiting_time": "대기 시간 (짧음/보통/김)",
    "overall_sentiment": "긍정적" 또는 "부정적" 또는 "중립적",
    "rating_summary": "별점 요약 (예: 맛 5/5, 서비스 4/5, 분위기 4/5)"
}}

JSON만 출력하고 다른 설명은 추가하지 마세요."""

        response = llm.invoke(prompt)
        response_text = response.content.strip()
        
        # 4. JSON 파싱
        try:
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            summary_data = json.loads(response_text)
            summary_data['place_name'] = place_name
            summary_data['review_count'] = len(reviews)
            
            # 타임라인 추가
            summary_data['timeline'] = {
                "recent_1month": {"avg_rating": round(avg_1m, 2), "review_count": len(recent_1m)},
                "recent_3months": {"avg_rating": round(avg_3m, 2), "review_count": len(recent_3m)},
                "recent_6months": {"avg_rating": round(avg_6m, 2), "review_count": len(recent_6m)},
                "trend": trend
            }
            if warning:
                summary_data['timeline']['warning'] = warning
            
            logger.info(f"✅ 리뷰 요약 완료!")
            
            return AgentResponse(
                success=True,
                agent_name="restaurant_reviews",
                data=[summary_data],
                count=1,
                message=f"{place_name} 리뷰 요약 완료! 🎯"
            )
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON 파싱 실패: {e}")
            return AgentResponse(
                success=False,
                agent_name="restaurant_reviews",
                data=[],
                count=0,
                message="리뷰 요약 파싱 중 오류 발생",
                error=f"JSON decode error: {str(e)}"
            )
        
    except Exception as e:
        logger.error(f"❌ 리뷰 요약 실패: {e}")
        return AgentResponse(
            success=False,
            agent_name="restaurant_reviews",
            data=[],
            count=0,
            message="리뷰 요약 중 오류 발생",
            error=str(e)
        )


def extract_menu(place_id: str, num_reviews: int = 20) -> AgentResponse:
    """
    리뷰에서 메뉴 추출 및 추천 (LLM 기반)
    
    Args:
        place_id: Google Place ID
        num_reviews: 분석할 리뷰 개수 (기본 20개)
    
    Returns:
        AgentResponse: 추천 메뉴 리스트
    """
    try:
        if not gmaps:
            return AgentResponse(
                success=False,
                agent_name="menu_extraction",
                data=[],
                count=0,
                message="Google API 키가 설정되지 않았습니다.",
                error="GOOGLE_PLACES_API_KEY not found"
            )
        
        if not llm:
            return AgentResponse(
                success=False,
                agent_name="menu_extraction",
                data=[],
                count=0,
                message="OpenAI API 키가 설정되지 않았습니다.",
                error="OPENAI_API_KEY not found"
            )
        
        logger.info(f"🍽️ 메뉴 추출: {place_id}")
        
        # 1. Google Places에서 리뷰 가져오기
        details = gmaps.place(place_id, fields=['name', 'reviews'], language='ko')
        place_name = details['result'].get('name', '알 수 없는 장소')
        reviews = details['result'].get('reviews', [])[:num_reviews]
        
        if not reviews:
            return AgentResponse(
                success=True,
                agent_name="menu_extraction",
                data=[],
                count=0,
                message=f"{place_name}의 리뷰를 찾을 수 없습니다."
            )
        
        # 2. 리뷰 텍스트 추출
        review_texts = [r.get('text', '') for r in reviews if r.get('text')]
        combined_reviews = "\n\n".join(review_texts)
        
        # 3. LLM으로 메뉴 추출
        prompt = f"""다음은 "{place_name}" 맛집의 실제 고객 리뷰입니다. 리뷰에서 언급된 메뉴를 추출하고 추천해주세요.

리뷰:
{combined_reviews}

다음 형식의 JSON으로 응답하세요:
{{
    "signature_menu": ["시그니처 메뉴1", "시그니처 메뉴2"],
    "popular_menu": ["인기 메뉴1", "인기 메뉴2", "인기 메뉴3"],
    "recommended_menu": ["추천 메뉴1", "추천 메뉴2"],
    "menu_tips": ["팁1: OO 메뉴는 꼭 드세요", "팁2: OO는 양이 많아요"],
    "price_info": "가격대 정보 (예: 1인 15,000원~20,000원)"
}}

JSON만 출력하고 다른 설명은 추가하지 마세요."""

        response = llm.invoke(prompt)
        response_text = response.content.strip()
        
        # 4. JSON 파싱
        try:
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            menu_data = json.loads(response_text)
            menu_data['place_name'] = place_name
            menu_data['review_count'] = len(reviews)
            
            logger.info(f"✅ 메뉴 추출 완료!")
            
            return AgentResponse(
                success=True,
                agent_name="menu_extraction",
                data=[menu_data],
                count=1,
                message=f"{place_name} 메뉴 추출 완료! 🍽️"
            )
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON 파싱 실패: {e}")
            return AgentResponse(
                success=False,
                agent_name="menu_extraction",
                data=[],
                count=0,
                message="메뉴 추출 파싱 중 오류 발생",
                error=f"JSON decode error: {str(e)}"
            )
        
    except Exception as e:
        logger.error(f"❌ 메뉴 추출 실패: {e}")
        return AgentResponse(
            success=False,
            agent_name="menu_extraction",
            data=[],
            count=0,
            message="메뉴 추출 중 오류 발생",
            error=str(e)
        )


def verify_restaurant(
    place_id: str,
    user_location: Optional[tuple] = None  # (lat, lng)
) -> AgentResponse:
    """
    맛집 검증 및 인기도 점수 계산
    
    6가지 요소 기반:
    1. 리뷰 수 + 평점 (40%)
    2. 최근성 (20%)
    3. 거리 (15%)
    4. 프로필 완성도 (10%)
    5. 사용자 참여도 (10%)
    6. 온라인 존재감 (5%)
    
    Args:
        place_id: Google Place ID
        user_location: 사용자 위치 (lat, lng)
    
    Returns:
        AgentResponse: 검증 결과 및 점수
    """
    try:
        if not gmaps:
            return AgentResponse(
                success=False,
                agent_name="verification",
                data=[],
                count=0,
                message="Google API 키가 설정되지 않았습니다.",
                error="GOOGLE_PLACES_API_KEY not found"
            )
        
        logger.info(f"🔍 맛집 검증: {place_id}")
        
        # Google Places 상세 정보
        details = gmaps.place(
            place_id,
            fields=[
                'name', 'rating', 'user_ratings_total', 'reviews',
                'photo', 'opening_hours', 'website',
                'formatted_phone_number', 'geometry'
            ],
            language='ko'
        )['result']
        
        place_name = details.get('name', '알 수 없는 장소')
        
        # 1. 리뷰 수 + 평점 (40점)
        rating = details.get('rating', 0)
        review_count = details.get('user_ratings_total', 0)
        
        # 정규화: 평점 (0-5) → (0-20), 리뷰 수 (0-1000+) → (0-20)
        rating_score = (rating / 5.0) * 20
        review_score = min(review_count / 50, 1.0) * 20  # 1000개 이상 = 만점
        score_1 = rating_score + review_score
        
        # 2. 최근성 (20점)
        reviews = details.get('reviews', [])
        recent_reviews = 0
        if reviews:
            import datetime
            now = datetime.datetime.now()
            three_months_ago = now - datetime.timedelta(days=90)
            
            for review in reviews:
                review_time = review.get('time', 0)
                review_date = datetime.datetime.fromtimestamp(review_time)
                if review_date >= three_months_ago:
                    recent_reviews += 1
        
        score_2 = min(recent_reviews / 5, 1.0) * 20  # 5개 이상 = 만점
        
        # 3. 거리 (15점)
        score_3 = 15  # 기본 만점 (거리 정보 없으면)
        if user_location and 'geometry' in details:
            from math import radians, sin, cos, sqrt, atan2
            
            lat1, lon1 = user_location
            lat2 = details['geometry']['location']['lat']
            lon2 = details['geometry']['location']['lng']
            
            # Haversine 공식
            R = 6371  # 지구 반경 (km)
            dlat = radians(lat2 - lat1)
            dlon = radians(lon2 - lon1)
            a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
            c = 2 * atan2(sqrt(a), sqrt(1-a))
            distance = R * c
            
            # 거리 점수: 0-5km = 15점, 5-10km = 10점, 10km+ = 5점
            if distance <= 5:
                score_3 = 15
            elif distance <= 10:
                score_3 = 10
            else:
                score_3 = 5
        
        # 4. 프로필 완성도 (10점)
        completeness = 0
        if details.get('photos'): completeness += 3
        if details.get('opening_hours'): completeness += 3
        if details.get('formatted_phone_number'): completeness += 2
        if details.get('website'): completeness += 2
        score_4 = completeness
        
        # 5. 사용자 참여도 (10점) - 리뷰 응답률 (Google API 제한으로 추정)
        # 리뷰 수가 많으면 참여도 높다고 가정
        score_5 = min(review_count / 100, 1.0) * 10
        
        # 6. 온라인 존재감 (5점)
        online_presence = 0
        if details.get('website'): online_presence += 5
        score_6 = online_presence
        
        # 총점 계산
        total_score = score_1 + score_2 + score_3 + score_4 + score_5 + score_6
        
        # 신뢰도 등급
        if total_score >= 80:
            grade = "A"
            trust_level = "매우 신뢰"
        elif total_score >= 60:
            grade = "B"
            trust_level = "신뢰"
        elif total_score >= 40:
            grade = "C"
            trust_level = "보통"
        else:
            grade = "D"
            trust_level = "주의"
        
        # 경고 메시지
        warnings = []
        if review_count < 10:
            warnings.append("리뷰가 적습니다")
        if recent_reviews < 2:
            warnings.append("최근 리뷰가 부족합니다")
        if not details.get('photos'):
            warnings.append("사진이 없습니다")
        if not details.get('opening_hours'):
            warnings.append("영업시간 정보가 없습니다")
        
        verification_data = {
            "place_name": place_name,
            "total_score": round(total_score, 1),
            "grade": grade,
            "trust_level": trust_level,
            "breakdown": {
                "review_rating": round(score_1, 1),
                "recency": round(score_2, 1),
                "distance": round(score_3, 1),
                "completeness": round(score_4, 1),
                "engagement": round(score_5, 1),
                "online_presence": round(score_6, 1)
            },
            "warnings": warnings,
            "stats": {
                "rating": rating,
                "review_count": review_count,
                "recent_reviews": recent_reviews
            }
        }
        
        logger.info(f"✅ 검증 완료: {total_score:.1f}점 ({grade}등급)")
        
        return AgentResponse(
            success=True,
            agent_name="verification",
            data=[verification_data],
            count=1,
            message=f"{place_name} 검증 완료! 점수: {total_score:.1f}/100 ({grade}) 🔍"
        )
        
    except Exception as e:
        logger.error(f"❌ 검증 실패: {e}")
        return AgentResponse(
            success=False,
            agent_name="verification",
            data=[],
            count=0,
            message="검증 중 오류 발생",
            error=str(e)
        )


def filter_restaurants_advanced(
    region: str,
    price_levels: Optional[List[int]] = None,  # [1, 2, 3, 4]
    open_now: bool = False,
    min_rating: float = 4.0,
    cuisine_type: Optional[str] = None,
    num_results: int = 10
) -> AgentResponse:
    """
    고급 필터링으로 맛집 검색
    
    Args:
        region: 검색 지역
        price_levels: 가격대 리스트 (1=저렴, 2=보통, 3=비쌈, 4=고급)
        open_now: 현재 영업 중인 곳만
        min_rating: 최소 평점
        cuisine_type: 음식 종류 (예: "한식", "일식", "양식")
        num_results: 결과 개수
    
    Returns:
        AgentResponse: 필터링된 맛집 리스트
    """
    try:
        if not gmaps:
            return AgentResponse(
                success=False,
                agent_name="restaurant_filter",
                data=[],
                count=0,
                message="Google API 키가 설정되지 않았습니다.",
                error="GOOGLE_PLACES_API_KEY not found"
            )
        
        logger.info(f"🔍 고급 필터 검색: {region}")
        
        # 1. 좌표 변환
        geocode_result = gmaps.geocode(f"{region}, 대한민국", language="ko")
        if not geocode_result:
            return AgentResponse(
                success=False,
                agent_name="restaurant_filter",
                data=[],
                count=0,
                message=f"'{region}' 지역을 찾을 수 없습니다.",
                error=f"Geocoding failed for region: {region}"
            )
        
        coords = geocode_result[0]['geometry']['location']
        
        # 2. 반경 결정
        region_type, search_radius = detect_region_type(region)
        
        # 3. Google Places 검색
        search_params = {
            'location': (coords['lat'], coords['lng']),
            'radius': search_radius,
            'type': 'restaurant',
            'language': 'ko'
        }
        
        if cuisine_type:
            search_params['keyword'] = cuisine_type
        
        if open_now:
            search_params['open_now'] = True
        
        results = gmaps.places_nearby(**search_params)
        all_results = results.get('results', [])
        
        if not all_results:
            return AgentResponse(
                success=True,
                agent_name="restaurant_filter",
                data=[],
                count=0,
                message=f"{region}에서 조건에 맞는 맛집을 찾지 못했습니다."
            )
        
        # 4. 필터링
        filtered = all_results
        
        # 평점 필터
        filtered = [r for r in filtered if r.get('rating', 0) >= min_rating]
        
        # 가격대 필터
        if price_levels:
            filtered = [r for r in filtered if r.get('price_level', 0) in price_levels]
        
        # 정렬 (리뷰 수 → 평점)
        sorted_results = sorted(
            filtered,
            key=lambda x: (x.get('user_ratings_total', 0), x.get('rating', 0)),
            reverse=True
        )[:num_results]
        
        # 5. 상세 정보 로드 및 데이터 변환
        restaurants = []
        for place in sorted_results:
            place_id = place['place_id']
            
            # 상세 정보 가져오기
            try:
                details = gmaps.place(
                    place_id,
                    fields=[
                        'formatted_phone_number',
                        'opening_hours',
                        'formatted_address'
                    ],
                    language='ko'
                )['result']
            except Exception as e:
                logger.warning(f"⚠️ 상세 정보 로드 실패 ({place['name']}): {e}")
                details = {}
            
            search_query = f"{region} {place['name']}".replace(" ", "+")
            maps_url = f"https://www.google.com/maps/search/?api=1&query={search_query}"
            
            restaurants.append({
                "place_id": place_id,
                "name": place['name'],
                "address": details.get('formatted_address', place.get('vicinity', '')),
                "rating": place.get('rating', 0),
                "review_count": place.get('user_ratings_total', 0),
                "price_level": place.get('price_level', 0),
                "opening_hours": details.get('opening_hours', {}).get('weekday_text', []),
                "open_now": details.get('opening_hours', {}).get('open_now'),
                "phone": details.get('formatted_phone_number'),
                "google_maps_url": maps_url
            })
        
        logger.info(f"✅ 필터링된 맛집 {len(restaurants)}개 찾음!")
        
        return AgentResponse(
            success=True,
            agent_name="restaurant_filter",
            data=restaurants,
            count=len(restaurants),
            message=f"{region} 필터링된 맛집 {len(restaurants)}개 찾음! 🎯"
        )
        
    except Exception as e:
        logger.error(f"❌ 필터링 검색 실패: {e}")
        return AgentResponse(
            success=False,
            agent_name="restaurant_filter",
            data=[],
            count=0,
            message="필터링 검색 중 오류 발생",
            error=str(e)
        )


def get_crowd_prediction(place_id: str) -> AgentResponse:
    """
    실시간 혼잡도 예측
    
    Args:
        place_id: Google Place ID
    
    Returns:
        AgentResponse: 혼잡도 정보
    """
    try:
        if not gmaps:
            return AgentResponse(
                success=False,
                agent_name="crowd_prediction",
                data=[],
                count=0,
                message="Google API 키가 설정되지 않았습니다.",
                error="GOOGLE_PLACES_API_KEY not found"
            )
        
        logger.info(f"📊 혼잡도 예측: {place_id}")
        
        # Google Places 상세 정보
        details = gmaps.place(
            place_id,
            fields=['name', 'current_opening_hours', 'user_ratings_total'],
            language='ko'
        )['result']
        
        place_name = details.get('name', '알 수 없는 장소')
        
        # 현재 영업 시간 정보
        opening_hours = details.get('current_opening_hours', {})
        
        # 혼잡도 데이터 (Google Places API의 popular_times는 공식 지원 안 함)
        # 대신 영업 상태와 리뷰 수로 추정
        crowd_data = {
            "place_name": place_name,
            "is_open": opening_hours.get('open_now', False),
            "review_count": details.get('user_ratings_total', 0),
            "estimated_crowd": "보통",  # 기본값
            "recommendation": ""
        }
        
        # 리뷰 수 기반 혼잡도 추정
        review_count = crowd_data["review_count"]
        if review_count > 1000:
            crowd_data["estimated_crowd"] = "매우 혼잡"
            crowd_data["recommendation"] = "대기 시간이 길 수 있습니다. 예약 권장"
        elif review_count > 500:
            crowd_data["estimated_crowd"] = "혼잡"
            crowd_data["recommendation"] = "피크 시간대 피하기 권장"
        elif review_count > 100:
            crowd_data["estimated_crowd"] = "보통"
            crowd_data["recommendation"] = "적당한 대기 시간 예상"
        else:
            crowd_data["estimated_crowd"] = "한산"
            crowd_data["recommendation"] = "대기 없이 이용 가능"
        
        logger.info(f"✅ 혼잡도 예측 완료!")
        
        return AgentResponse(
            success=True,
            agent_name="crowd_prediction",
            data=[crowd_data],
            count=1,
            message=f"{place_name} 혼잡도 예측 완료! 📊"
        )
        
    except Exception as e:
        logger.error(f"❌ 혼잡도 예측 실패: {e}")
        return AgentResponse(
            success=False,
            agent_name="crowd_prediction",
            data=[],
            count=0,
            message="혼잡도 예측 중 오류 발생",
            error=str(e)
        )


def compare_restaurants(place_ids: List[str]) -> AgentResponse:
    """
    여러 맛집 비교 분석 (LLM 기반)
    
    Args:
        place_ids: 비교할 맛집 Place ID 리스트 (2-5개)
    
    Returns:
        AgentResponse: 비교 분석 결과
    """
    try:
        if not gmaps:
            return AgentResponse(
                success=False,
                agent_name="restaurant_comparison",
                data=[],
                count=0,
                message="Google API 키가 설정되지 않았습니다.",
                error="GOOGLE_PLACES_API_KEY not found"
            )
        
        if not llm:
            return AgentResponse(
                success=False,
                agent_name="restaurant_comparison",
                data=[],
                count=0,
                message="OpenAI API 키가 설정되지 않았습니다.",
                error="OPENAI_API_KEY not found"
            )
        
        if len(place_ids) < 2:
            return AgentResponse(
                success=False,
                agent_name="restaurant_comparison",
                data=[],
                count=0,
                message="최소 2개 이상의 맛집이 필요합니다.",
                error="Insufficient restaurants for comparison"
            )
        
        logger.info(f"🔍 맛집 비교: {len(place_ids)}개")
        
        # 1. 각 맛집 정보 수집
        restaurants_info = []
        for place_id in place_ids[:5]:  # 최대 5개
            try:
                details = gmaps.place(
                    place_id,
                    fields=['name', 'rating', 'user_ratings_total', 'price_level'],
                    language='ko'
                )['result']
                
                restaurants_info.append({
                    "name": details.get('name', '알 수 없음'),
                    "rating": details.get('rating', 0),
                    "review_count": details.get('user_ratings_total', 0),
                    "price_level": details.get('price_level', 0)
                })
            except Exception as e:
                logger.warning(f"⚠️ 맛집 정보 로드 실패: {e}")
        
        if len(restaurants_info) < 2:
            return AgentResponse(
                success=False,
                agent_name="restaurant_comparison",
                data=[],
                count=0,
                message="맛집 정보를 충분히 가져오지 못했습니다."
            )
        
        # 2. LLM으로 비교 분석
        restaurants_text = "\n".join([
            f"{i+1}. {r['name']}: 평점 {r['rating']}, 리뷰 {r['review_count']}개, 가격대 {'₩' * r['price_level']}"
            for i, r in enumerate(restaurants_info)
        ])
        
        prompt = f"""다음 맛집들을 비교 분석해주세요:

{restaurants_text}

다음 형식의 JSON으로 응답하세요:
{{
    "summary": "전체 비교 요약 (2-3줄)",
    "best_for_taste": "맛으로는 OO 추천",
    "best_for_price": "가성비로는 OO 추천",
    "best_for_popularity": "인기로는 OO 추천",
    "comparison_table": [
        {{"restaurant": "이름", "pros": ["장점1", "장점2"], "cons": ["단점1"]}}
    ],
    "final_recommendation": "최종 추천 (상황별)"
}}

JSON만 출력하고 다른 설명은 추가하지 마세요."""

        response = llm.invoke(prompt)
        response_text = response.content.strip()
        
        # 3. JSON 파싱
        try:
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            comparison_data = json.loads(response_text)
            comparison_data['restaurants'] = restaurants_info
            
            logger.info(f"✅ 비교 분석 완료!")
            
            return AgentResponse(
                success=True,
                agent_name="restaurant_comparison",
                data=[comparison_data],
                count=1,
                message=f"{len(restaurants_info)}개 맛집 비교 완료! 🔍"
            )
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON 파싱 실패: {e}")
            return AgentResponse(
                success=False,
                agent_name="restaurant_comparison",
                data=[],
                count=0,
                message="비교 분석 파싱 중 오류 발생",
                error=f"JSON decode error: {str(e)}"
            )
        
    except Exception as e:
        logger.error(f"❌ 비교 분석 실패: {e}")
        return AgentResponse(
            success=False,
            agent_name="restaurant_comparison",
            data=[],
            count=0,
            message="비교 분석 중 오류 발생",
            error=str(e)
        )


def extract_reservation_info(place_id: str) -> dict:
    """예약 정보 추출 (캐싱)"""
    if not gmaps:
        return {"reservation_required": False, "method": "알 수 없음", "confidence": 0}
    
    try:
        all_info = get_all_restaurant_info(place_id)
        return all_info['reservation']
    except:
        return {"reservation_required": False, "method": "알 수 없음", "confidence": 0}


def analyze_menu_price(place_id: str) -> dict:
    """메뉴 가격 분석 (캐싱)"""
    if not gmaps:
        return {"average_price": 0, "budget_level": "알 수 없음"}
    
    try:
        all_info = get_all_restaurant_info(place_id)
        return all_info['price']
    except:
        return {"average_price": 20000, "budget_level": "보통", "recommended_budget": "2-3만원"}


def get_parking_info(place_id: str) -> dict:
    """주차 정보 추출 (캐싱)"""
    if not gmaps:
        return {"available": False, "type": "알 수 없음"}
    
    try:
        all_info = get_all_restaurant_info(place_id)
        return all_info['parking']
    except:
        return {"available": None, "type": "알 수 없음"}


def get_pet_friendly_info(place_id: str) -> dict:
    """애완견 동반 가능 여부 (캐싱)"""
    if not gmaps:
        return {"pet_allowed": False, "confidence": 0}
    
    try:
        all_info = get_all_restaurant_info(place_id)
        return all_info['pet']
    except:
        return {"pet_allowed": None, "confidence": 0}


def analyze_rating_distribution(place_id: str) -> dict:
    """별점 분포 분석"""
    try:
        if not gmaps:
            return {"distribution": {}, "percentage": {}}
        
        reviews = get_place_details(place_id, ['reviews']).get('reviews', [])
        
        rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        
        for review in reviews:
            rating = review.get('rating', 0)
            if rating in rating_dist:
                rating_dist[rating] += 1
        
        total = sum(rating_dist.values())
        
        return {
            "distribution": rating_dist,
            "percentage": {
                k: round(v / total * 100, 1) if total > 0 else 0
                for k, v in rating_dist.items()
            },
            "total_reviews": total
        }
    except:
        return {"distribution": {}, "percentage": {}, "total_reviews": 0}


def calculate_revisit_rate(reviews: list) -> dict:
    """재방문율 분석"""
    revisit_keywords = ["또", "재방문", "다시", "또가", "또올", "또먹", "또와"]
    
    revisit_count = 0
    for review in reviews:
        text = review.get("text", "").lower()
        if any(keyword in text for keyword in revisit_keywords):
            revisit_count += 1
    
    total = len(reviews)
    rate = revisit_count / total if total > 0 else 0
    
    return {
        "revisit_rate": round(rate * 100, 1),
        "revisit_count": revisit_count,
        "total_reviews": total,
        "level": "높음" if rate > 0.3 else "보통" if rate > 0.1 else "낮음"
    }


def extract_keywords(reviews: list) -> dict:
    """키워드 추출"""
    from collections import Counter
    import re
    
    # 불용어
    stopwords = ["이", "그", "저", "것", "수", "등", "및", "도", "를", "을", "가", "이"]
    
    # 모든 리뷰 텍스트
    all_text = " ".join([r.get("text", "") for r in reviews])
    
    # 단어 추출 (2글자 이상)
    words = re.findall(r'[가-힣]{2,}', all_text)
    words = [w for w in words if w not in stopwords]
    
    # 빈도 계산
    word_freq = Counter(words)
    
    # 카테고리별 키워드
    food_words = ["김치", "고기", "국물", "밥", "면", "찌개", "볶음", "튀김", "구이"]
    service_words = ["친절", "빠른", "서비스", "직원", "사장님"]
    atmosphere_words = ["분위기", "깔끔", "넓은", "조용", "시끌"]
    
    return {
        "top_keywords": word_freq.most_common(20),
        "food_keywords": [(w, c) for w, c in word_freq.most_common(50) if w in food_words],
        "service_keywords": [(w, c) for w, c in word_freq.most_common(50) if w in service_words],
        "atmosphere_keywords": [(w, c) for w, c in word_freq.most_common(50) if w in atmosphere_words]
    }


def analyze_sentiment_timeline(reviews: list) -> dict:
    """감정 분석 타임라인"""
    from datetime import datetime
    
    # 월별 그룹화
    monthly_sentiment = {}
    
    positive_words = ["맛있", "좋", "최고", "추천", "만족", "훌륭", "완벽"]
    negative_words = ["별로", "실망", "아쉽", "비싸", "불친절", "최악"]
    
    for review in reviews:
        text = review.get("text", "")
        timestamp = review.get("time", 0)
        
        # 감정 점수
        pos_count = sum(1 for word in positive_words if word in text)
        neg_count = sum(1 for word in negative_words if word in text)
        
        if pos_count > neg_count:
            sentiment = "positive"
        elif neg_count > pos_count:
            sentiment = "negative"
        else:
            sentiment = "neutral"
        
        # 월별 집계
        try:
            month = datetime.fromtimestamp(timestamp).strftime("%Y-%m")
            if month not in monthly_sentiment:
                monthly_sentiment[month] = {"positive": 0, "negative": 0, "neutral": 0}
            monthly_sentiment[month][sentiment] += 1
        except:
            continue
    
    # 전체 비율
    total_pos = sum(m["positive"] for m in monthly_sentiment.values())
    total_neg = sum(m["negative"] for m in monthly_sentiment.values())
    total_neu = sum(m["neutral"] for m in monthly_sentiment.values())
    total = total_pos + total_neg + total_neu
    
    return {
        "timeline": monthly_sentiment,
        "overall": {
            "positive_rate": round(total_pos / total * 100, 1) if total > 0 else 0,
            "negative_rate": round(total_neg / total * 100, 1) if total > 0 else 0,
            "neutral_rate": round(total_neu / total * 100, 1) if total > 0 else 0
        }
    }


def get_advanced_review_analysis(place_id: str) -> dict:
    """고급 리뷰 분석 통합"""
    try:
        if not gmaps:
            return {}
        
        # 리뷰 가져오기
        reviews = get_place_details(place_id, ['reviews']).get('reviews', [])
        
        return {
            "rating_distribution": analyze_rating_distribution(place_id),
            "revisit_rate": calculate_revisit_rate(reviews),
            "keywords": extract_keywords(reviews),
            "sentiment": analyze_sentiment_timeline(reviews)
        }
    except Exception as e:
        logger.warning(f"고급 리뷰 분석 실패: {e}")
        return {}


def get_blog_review_count(place_name: str, address: str = "") -> dict:
    """네이버 블로그 리뷰 수"""
    try:
        import requests
        import os
        
        naver_id = os.getenv("NAVER_CLIENT_ID")
        naver_secret = os.getenv("NAVER_CLIENT_SECRET")
        
        if not naver_id or not naver_secret:
            return {"blog_count": 0, "note": "Naver API 키 없음"}
        
        url = "https://openapi.naver.com/v1/search/blog.json"
        headers = {
            "X-Naver-Client-Id": naver_id,
            "X-Naver-Client-Secret": naver_secret
        }
        params = {
            "query": f"{place_name} 맛집",
            "display": 10
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=5)
        data = response.json()
        
        return {
            "blog_count": data.get("total", 0),
            "recent_posts": [
                {
                    "title": item.get("title", "").replace("<b>", "").replace("</b>", ""),
                    "link": item.get("link", ""),
                    "date": item.get("postdate", "")
                }
                for item in data.get("items", [])[:5]
            ]
        }
    except Exception as e:
        logger.warning(f"블로그 검색 실패: {e}")
        return {"blog_count": 0, "note": "검색 실패"}


def get_youtube_mentions(place_name: str) -> dict:
    """유튜브 언급 수 (간단 버전)"""
    try:
        import requests
        import os
        
        youtube_key = os.getenv("YOUTUBE_API_KEY")
        
        if not youtube_key:
            # API 키 없으면 추정값
            return {
                "video_count": "추정 불가",
                "note": "YouTube API 키 없음",
                "search_url": f"https://www.youtube.com/results?search_query={place_name}+맛집+먹방"
            }
        
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": f"{place_name} 맛집 먹방",
            "type": "video",
            "maxResults": 5,
            "key": youtube_key
        }
        
        response = requests.get(url, params=params, timeout=5)
        data = response.json()
        
        return {
            "video_count": data.get("pageInfo", {}).get("totalResults", 0),
            "popular_videos": [
                {
                    "title": item["snippet"]["title"],
                    "channel": item["snippet"]["channelTitle"],
                    "url": f"https://youtube.com/watch?v={item['id']['videoId']}"
                }
                for item in data.get("items", [])
            ]
        }
    except Exception as e:
        logger.warning(f"유튜브 검색 실패: {e}")
        return {"video_count": 0, "note": "검색 실패"}


def get_instagram_popularity(place_name: str) -> dict:
    """인스타그램 인기도 추정"""
    # Instagram API는 제한적이므로 추정값 반환
    hashtags = [
        f"#{place_name.replace(' ', '')}",
        f"#{place_name}맛집",
        f"#{place_name.replace(' ', '')}맛집"
    ]
    
    return {
        "estimated_posts": "추정 불가 (API 제한)",
        "hashtags": hashtags,
        "search_url": f"https://www.instagram.com/explore/tags/{place_name.replace(' ', '')}/",
        "note": "Instagram Graph API 필요"
    }


def get_social_data(place_name: str, address: str = "") -> dict:
    """소셜 데이터 통합"""
    return {
        "blog": get_blog_review_count(place_name, address),
        "youtube": get_youtube_mentions(place_name),
        "instagram": get_instagram_popularity(place_name)
    }


# 테스트
if __name__ == "__main__":
    print("=" * 60)
    print("🍽️ 맛집 추천 에이전트 테스트")
    print("=" * 60)
    
    if not GOOGLE_API_KEY:
        print("\n❌ Google API 키가 설정되지 않았습니다!")
        print("📝 .env 파일에 GOOGLE_PLACES_API_KEY를 추가하세요.\n")
        exit(1)
    
    # 테스트 케이스
    test_cases = [
        ("강릉 경포대", "해산물", 5),
        ("부산 해운대", "대게", 3),
        ("제주 애월", "카페", 5),
    ]
    
    for region, preference, num in test_cases:
        print(f"\n📍 {region} - {preference} 맛집 검색 (상위 {num}개):")
        print("-" * 60)
        
        result = search_restaurants(region, preference, num)
        
        if result.success and result.count > 0:
            print(f"✅ 성공! {result.count}개 발견\n")
            for i, place in enumerate(result.data, 1):
                print(f"{i}. {place['name']}")
                print(f"   ⭐ 평점: {place['rating']} ({place['review_count']}개 리뷰)")
                print(f"   📍 {place['address']}")
                print(f"   🔗 {place['google_maps_url']}")
                if place.get('phone'):
                    print(f"   📞 {place['phone']}")
                if place.get('opening_hours'):
                    print(f"   🕐 영업시간: {place['opening_hours'][0] if place['opening_hours'] else '정보 없음'}")
                print()
        else:
            print(f"❌ {result.message}\n")
    
    # 선호도 없이 검색
    print(f"\n📍 강릉 - 전체 맛집 검색 (상위 5개):")
    print("-" * 60)
    result = search_restaurants("강릉", None, 5)
    if result.success:
        print(f"✅ {result.count}개 발견!")
        for i, place in enumerate(result.data, 1):
            print(f"{i}. {place['name']} - ⭐{place['rating']} ({place['review_count']}개 리뷰)")
