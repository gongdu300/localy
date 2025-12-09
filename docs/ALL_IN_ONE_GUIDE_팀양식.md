# 🌟 클로드급 여행 플래너 - 완전 개발 가이드

> **이 문서 하나로 처음부터 끝까지 개발 가능**

---

## 📋 목차
1. [빠른 시작](#빠른-시작)
2. [데이터 스키마](#데이터-스키마)
3. [에이전트 템플릿](#에이전트-템플릿)
4. [툴 템플릿](#툴-템플릿)
5. [15개 에이전트 스펙](#15개-에이전트-스펙)
6. [작업 체크리스트](#작업-체크리스트)


### `schemas/data_models.py`
```python
"""통일된 데이터 스키마"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PlaceData(BaseModel):
    """모든 장소 데이터의 표준 형식"""
    place_id: str = Field(..., description="Google Place ID")
    name: str
    category: str  # restaurant | cafe | hotel | landmark | shopping
    address: str
    latitude: float
    longitude: float
    region: str
    rating: float = 0
    review_count: int = 0
    price_level: int = 0
    opening_hours: List[str] = []
    open_now: Optional[bool] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    images: List[str] = []
    google_maps_url: str
    description: Optional[str] = None
    tags: List[str] = []

class AgentResponse(BaseModel):
    """모든 에이전트의 표준 응답"""
    success: bool
    agent_name: str
    data: List[Dict[str, Any]] = []
    count: int = 0
    message: str
    error: Optional[str] = None

class UserPersona(BaseModel):
    """
    사용자 페르소나 - 회원가입 시 수집, 여행 계획 시 참고용
    
    ⚠️ 중요: 페르소나는 기본 선호도일 뿐!
    - LLM은 페르소나를 참고하되, 매번 사용자에게 확인 필요
    - 예: "평소 한식 좋아하시는데, 이번엔 어떤 음식 드시고 싶으세요?"
    - 사용자가 다른 선택을 할 수 있음 (페르소나 ≠ 강제)
    """
    user_id: str
    age_group: str  # "20대", "30대", "40대", "50대+"
    gender: Optional[str] = None
    travel_style: List[str] = []  # ["힐링", "액티비티", "맛집투어", "문화체험"]
    budget_level: str = "중"  # "저" | "중" | "고"
    food_preferences: List[str] = []  # ["한식", "일식", "양식", "해산물"]
    accommodation_style: str = "호텔"  # "호텔" | "펜션" | "게스트하우스" | "한옥"
    interests: List[str] = []  # ["사진", "쇼핑", "자연", "역사", "카페"]
    created_at: str
    updated_at: str

class TravelState(BaseModel):
    """
    전역 상태 관리 - 여행 계획 전체 정보 저장
    
    Phase 1: 기본 정보만 사용
    Phase 2: 에이전트 간 공유
    Phase 3: LangGraph 워크플로우 전체 상태
    """
    # 기본 정보
    user_id: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    num_travelers: int = 1
    total_budget: Optional[int] = None
    
    # 선택된 지역들
    selected_regions: List[str] = []
    current_region: Optional[str] = None
    
    # 일차별 계획 (Phase 3용 상세 구조)
    daily_plans: Dict[int, DailyItinerary] = {}
    
    # 검색 결과 캐시
    search_results: Dict[str, List[PlaceData]] = {}
    
    # 선택된 장소들
    selected_places: Dict[str, List[PlaceData]] = {}  # {category: [places]}
    
    # 경로 정보
    routes: List[RouteData] = []
    
    # 날씨 정보
    weather_forecast: List[WeatherData] = []
    
    # 예산 정보
    budget: Optional[BudgetData] = None
    
    # 대화 기록
    chat_history: List[Dict[str, str]] = []
    
    # 대화 컨텍스트 (Phase 3용)
    context: Optional[ConversationContext] = None
    
    # 페르소나 (선택사항)
    persona: Optional[UserPersona] = None
    
    # 메타데이터
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    completed: bool = False

class RouteData(BaseModel):
    """GPS 경로 데이터"""
    origin: str
    destination: str
    mode: str  # "transit" | "driving" | "walking"
    duration: str  # "2시간 30분"
    distance: str  # "237km"
    cost: Optional[str] = None  # "약 25,000원"
    steps: List[Dict[str, Any]] = []
    google_maps_url: str

class WeatherData(BaseModel):
    """날씨 데이터"""
    date: str  # "2025-12-05"
    day_of_week: str  # "금요일"
    temperature_high: int
    temperature_low: int
    condition: str  # "맑음" | "흐림" | "비" | "눈"
    precipitation: int = 0  # 강수 확률 (%)
    icon: str  # "☀️" | "☁️" | "🌧️" | "❄️"
    clothing_recommendation: str

class BudgetData(BaseModel):
    """예산 데이터"""
    total_budget: int
    spent: Dict[str, int] = {}  # {"식비": 50000, "숙박": 150000}
    remaining: int
    warning: bool = False  # 예산 초과 경고

class ItineraryItem(BaseModel):
    """일정 항목"""
    time: str  # "09:00"
    place_name: str
    place_id: str
    category: str
    duration: str  # "1시간"
    google_maps_url: str
    notes: Optional[str] = None

class DailyItinerary(BaseModel):
    """일차별 일정"""
    day_number: int
    date: str
    items: List[ItineraryItem] = []
    total_duration: str
    route_map_url: str  # 전체 경로 지도

class ConversationContext(BaseModel):
    """
    대화 컨텍스트 - Phase 3 LangGraph용
    
    현재 대화 단계, 다음 액션, 조건부 분기 등
    """
    current_step: str  # "collecting_info" | "searching_places" | "creating_itinerary"
    next_action: Optional[str] = None
    pending_questions: List[str] = []
    user_confirmations: Dict[str, bool] = {}
    workflow_state: str = "initial"  # LangGraph 워크플로우 상태
```

---

## 🤖 에이전트 템플릿

### `agents/template_agent.py`
```python
"""에이전트 템플릿 - 복사해서 사용"""
import os
import logging
from typing import List, Optional
from dotenv import load_dotenv
import googlemaps
from schemas.data_models import PlaceData, AgentResponse

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
gmaps = googlemaps.Client(key=GOOGLE_API_KEY) if GOOGLE_API_KEY else None

def search_places(
    region: str,
    category: str,  # restaurant | cafe | lodging | tourist_attraction
    preference: Optional[str] = None,
    num_results: int = 10
) -> AgentResponse:
    """장소 검색 메인 함수"""
    try:
        logger.info(f"🔍 검색: {region} - {category}")
        
        # 1. 좌표 변환
        result = gmaps.geocode(f"{region}, 대한민국", language="ko")
        coords = result[0]['geometry']['location']
        
        # 2. Google Places 검색
        results = gmaps.places_nearby(
            location=(coords['lat'], coords['lng']),
            radius=5000,
            type=category,
            keyword=preference,
            language="ko"
        )
        
        # 3. 필터링 (리뷰 50개 이상)
        filtered = [r for r in results['results'] 
                   if r.get('user_ratings_total', 0) >= 50]
        
        # 4. Top N
        sorted_results = sorted(
            filtered,
            key=lambda x: (x['user_ratings_total'], x['rating']),
            reverse=True
        )[:num_results]
        
        # 5. 상세 정보 로드
        places = []
        for place in sorted_results:
            place_id = place['place_id']
            details = gmaps.place(place_id, fields=[
                'formatted_phone_number', 'website', 
                'opening_hours', 'formatted_address', 'photos'
            ])['result']
            
            places.append(PlaceData(
                place_id=place_id,
                name=place['name'],
                category=category,
                address=details.get('formatted_address', ''),
                latitude=place['geometry']['location']['lat'],
                longitude=place['geometry']['location']['lng'],
                region=region,
                rating=place.get('rating', 0),
                review_count=place.get('user_ratings_total', 0),
                price_level=place.get('price_level', 0),
                opening_hours=details.get('opening_hours', {}).get('weekday_text', []),
                open_now=details.get('opening_hours', {}).get('open_now'),
                phone=details.get('formatted_phone_number'),
                website=details.get('website'),
                google_maps_url=f"https://www.google.com/maps/place/?q=place_id:{place_id}"
            ))
        
        return AgentResponse(
            success=True,
            agent_name=category,
            data=[p.dict() for p in places],
            count=len(places),
            message=f"{region} {category} {len(places)}곳 찾음! 🎯"
        )
        
    except Exception as e:
        logger.error(f"❌ 실패: {e}")
        return AgentResponse(
            success=False,
            agent_name=category,
            message="검색 실패",
            error=str(e)
        )

# 테스트
if __name__ == "__main__":
    result = search_places("강릉", "restaurant", "대게", 5)
    print(f"결과: {result.count}개")
    for place in result.data:
        print(f"- {place['name']} ({place['rating']}⭐)")
```

---

## 🛠️ 툴 템플릿

### `tools/template_tool.py`
```python
"""LangChain 툴 템플릿"""
from langchain.tools import tool

@tool
def search_places_tool(region: str, category: str, preference: str = None) -> dict:
    """
    장소 검색 툴
    
    Args:
        region: 검색 지역
        category: restaurant | cafe | lodging | tourist_attraction
        preference: 선호도
    """
    from agents.template_agent import search_places
    result = search_places(region, category, preference)
    return result.dict()
```

---

## 🎯 15개 에이전트 스펙

### 1. 맛집 (`restaurant_agent.py`)
```python
# template_agent.py 복사 후 수정
def search_restaurants(region: str, preference: str = None) -> AgentResponse:
    return search_places(region, "restaurant", preference)
```

### 2. 카페 (`dessert_agent.py`)
```python
def search_cafes(region: str, preference: str = None) -> AgentResponse:
    return search_places(region, "cafe", preference)
```

### 3. 숙소 (`accommodation_agent.py`)
```python
def search_accommodations(region: str, preference: str = None) -> AgentResponse:
    return search_places(region, "lodging", preference)
```

### 4. 관광지 (`landmark_agent.py`)
```python
def search_landmarks(region: str, preference: str = None) -> AgentResponse:
    return search_places(region, "tourist_attraction", preference)
```

### 5. 쇼핑 (`shopping_agent.py`)
```python
def search_shopping(region: str, preference: str = None) -> AgentResponse:
    return search_places(region, "shopping_mall", preference)
```

### 6. GPS/교통 (`gps_agent.py`)
```python
"""GPS 경로 검색"""
def get_route_info(origin: str, destination: str, mode: str = "transit") -> AgentResponse:
    """경로 검색"""
    try:
        directions = gmaps.directions(origin, destination, mode=mode, language="ko")
        if not directions:
            return AgentResponse(success=False, agent_name="gps", message="경로 없음")
        
        route = directions[0]
        leg = route['legs'][0]
        
        return AgentResponse(
            success=True,
            agent_name="gps",
            data=[{
                'origin': leg['start_address'],
                'destination': leg['end_address'],
                'mode': mode,
                'duration': leg['duration']['text'],
                'distance': leg['distance']['text'],
                'google_maps_url': f"https://www.google.com/maps/dir/{origin}/{destination}"
            }],
            count=1,
            message=f"{origin} → {destination} 경로 찾음!"
        )
    except Exception as e:
        return AgentResponse(success=False, agent_name="gps", message="실패", error=str(e))
```

### 7. 날씨 (`weather_agent.py`)
```python
"""날씨 예보"""
import requests

def get_weather_forecast(region: str, start_date: str, end_date: str) -> AgentResponse:
    """날씨 예보 (OpenWeatherMap API)"""
    try:
        # 좌표 변환
        result = gmaps.geocode(f"{region}, 대한민국")
        coords = result[0]['geometry']['location']
        
        # OpenWeatherMap API
        api_key = os.getenv("OPENWEATHERMAP_API_KEY")
        url = "https://api.openweathermap.org/data/2.5/forecast"
        response = requests.get(url, params={
            'lat': coords['lat'],
            'lon': coords['lng'],
            'appid': api_key,
            'units': 'metric',
            'lang': 'kr'
        })
        
        data = response.json()
        forecasts = []
        
        for item in data['list'][:5]:  # 5일치
            forecasts.append({
                'date': item['dt_txt'].split()[0],
                'temperature': round(item['main']['temp']),
                'condition': item['weather'][0]['description'],
                'icon': '☀️' if 'clear' in item['weather'][0]['main'].lower() else '☁️'
            })
        
        return AgentResponse(
            success=True,
            agent_name="weather",
            data=forecasts,
            count=len(forecasts),
            message=f"{region} 날씨 예보 완료!"
        )
    except Exception as e:
        return AgentResponse(success=False, agent_name="weather", message="실패", error=str(e))
```

### 8. 일정 생성 (`itinerary_agent.py`)
```python
"""일정 생성"""
def create_itinerary(day_number: int, selected_places: Dict) -> AgentResponse:
    """최적 동선으로 일정 생성"""
    try:
        schedule = []
        current_time = "09:00"
        
        # 간단한 순서 정렬 (실제로는 TSP 알고리즘 사용)
        for category, places in selected_places.items():
            for place in places:
                schedule.append({
                    'time': current_time,
                    'place': place['name'],
                    'category': category,
                    'duration': '1시간',
                    'google_maps_url': place['google_maps_url']
                })
                # 시간 증가 로직
                hour = int(current_time.split(':')[0]) + 1
                current_time = f"{hour:02d}:00"
        
        return AgentResponse(
            success=True,
            agent_name="itinerary",
            data=schedule,
            count=len(schedule),
            message=f"{day_number}일차 일정 생성 완료!"
        )
    except Exception as e:
        return AgentResponse(success=False, agent_name="itinerary", message="실패", error=str(e))
```

### 9. 예산 관리 (`budget_agent.py`)
```python
"""예산 관리"""
def track_budget(total_budget: int, expenses: Dict) -> AgentResponse:
    """예산 추적"""
    try:
        total_spent = sum(expenses.values())
        remaining = total_budget - total_spent
        
        return AgentResponse(
            success=True,
            agent_name="budget",
            data=[{
                'total_budget': total_budget,
                'total_spent': total_spent,
                'remaining': remaining,
                'expenses': expenses,
                'warning': remaining < 0
            }],
            count=1,
            message=f"예산: {remaining:,}원 남음"
        )
    except Exception as e:
        return AgentResponse(success=False, agent_name="budget", message="실패", error=str(e))
```

### 10. 리뷰 요약 (`review_agent.py`)
```python
"""리뷰 요약"""
from langchain_openai import ChatOpenAI

def summarize_reviews(place_id: str) -> AgentResponse:
    """LLM으로 리뷰 요약"""
    try:
        # Google Places 리뷰 가져오기
        details = gmaps.place(place_id, fields=['reviews'])
        reviews = details['result'].get('reviews', [])[:10]
        
        # LLM 요약
        llm = ChatOpenAI(model="gpt-4o-mini")
        review_text = "\n".join([r['text'] for r in reviews])
        summary = llm.invoke(f"다음 리뷰를 3줄로 요약:\n{review_text}")
        
        return AgentResponse(
            success=True,
            agent_name="review",
            data=[{'summary': summary.content}],
            count=1,
            message="리뷰 요약 완료!"
        )
    except Exception as e:
        return AgentResponse(success=False, agent_name="review", message="실패", error=str(e))
```

### 11. 사진 갤러리 (`photo_agent.py`)
```python
"""사진 수집"""
def get_place_photos(place_id: str) -> AgentResponse:
    """Google Places 사진 수집"""
    try:
        details = gmaps.place(place_id, fields=['photos'])
        photos = details['result'].get('photos', [])
        
        photo_urls = []
        for photo in photos[:5]:  # 최대 5개
            photo_ref = photo['photo_reference']
            url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference={photo_ref}&key={GOOGLE_API_KEY}"
            photo_urls.append(url)
        
        return AgentResponse(
            success=True,
            agent_name="photo",
            data=[{'images': photo_urls}],
            count=len(photo_urls),
            message=f"사진 {len(photo_urls)}개 수집!"
        )
    except Exception as e:
        return AgentResponse(success=False, agent_name="photo", message="실패", error=str(e))
```

### 12. 혼잡도 (`crowd_agent.py`)
```python
"""혼잡도 확인"""
def get_crowd_info(place_id: str) -> AgentResponse:
    """Popular Times 정보"""
    try:
        # Google Places에서 혼잡도 정보 가져오기
        details = gmaps.place(place_id, fields=['current_opening_hours'])
        
        # 간단한 추천
        recommendation = "평일 오전 방문 추천"
        
        return AgentResponse(
            success=True,
            agent_name="crowd",
            data=[{'recommendation': recommendation}],
            count=1,
            message="혼잡도 확인 완료!"
        )
    except Exception as e:
        return AgentResponse(success=False, agent_name="crowd", message="실패", error=str(e))
```

### 13. 다국어 (`translation_agent.py`)
```python
"""번역"""
def translate_text(text: str, target_lang: str = "en") -> AgentResponse:
    """텍스트 번역"""
    try:
        llm = ChatOpenAI(model="gpt-4o-mini")
        translated = llm.invoke(f"Translate to {target_lang}: {text}")
        
        return AgentResponse(
            success=True,
            agent_name="translation",
            data=[{'original': text, 'translated': translated.content}],
            count=1,
            message="번역 완료!"
        )
    except Exception as e:
        return AgentResponse(success=False, agent_name="translation", message="실패", error=str(e))
```

### 14. 긴급 정보 (`emergency_agent.py`)
```python
"""긴급 정보"""
def find_emergency_services(region: str) -> AgentResponse:
    """병원, 경찰서 검색"""
    try:
        result = gmaps.geocode(f"{region}, 대한민국")
        coords = result[0]['geometry']['location']
        
        # 병원 검색
        hospitals = gmaps.places_nearby(
            location=(coords['lat'], coords['lng']),
            radius=3000,
            type="hospital",
            language="ko"
        )
        
        emergency_places = []
        for place in hospitals['results'][:3]:
            emergency_places.append({
                'name': place['name'],
                'address': place.get('vicinity'),
                'type': '병원',
                'google_maps_url': f"https://www.google.com/maps/place/?q=place_id:{place['place_id']}"
            })
        
        return AgentResponse(
            success=True,
            agent_name="emergency",
            data=emergency_places,
            count=len(emergency_places),
            message="긴급 정보 검색 완료!"
        )
    except Exception as e:
        return AgentResponse(success=False, agent_name="emergency", message="실패", error=str(e))
```

### 15. 지역 추천 (`region_agent.py`)
```python
"""지역 추천"""
def recommend_regions(destination: str) -> AgentResponse:
    """세부 지역 추천"""
    regions_db = {
        "부산": [
            {"name": "해운대", "description": "해변과 마린시티"},
            {"name": "광안리", "description": "광안대교 야경"},
            {"name": "남포동", "description": "자갈치시장, 먹거리"}
        ],
        "강릉": [
            {"name": "경포대", "description": "경포호와 해변"},
            {"name": "안목해변", "description": "커피 거리"},
            {"name": "주문진", "description": "항구와 해산물"}
        ]
    }
    
    regions = regions_db.get(destination, [])
    
    return AgentResponse(
        success=True,
- [ ] 환경 설정
- [ ] 데이터 스키마 생성
- [ ] 1. 맛집 에이전트 (담당: ___)
- [ ] 2. 카페/디저트 에이전트 (담당: ___)
- [ ] 3. 숙소 에이전트 (담당: ___)
- [ ] 4. 관광지 에이전트 (담당: ___)
- [ ] 5. 쇼핑 에이전트 (담당: ___)
- [ ] 6. GPS/교통 에이전트 (담당: ___)
- [ ] 7. 날씨 에이전트 (담당: ___)
- [ ] 8. 일정 생성 에이전트 (담당: ___)
- [ ] 9. 예산 관리 에이전트 (담당: ___)
- [ ] 10. 리뷰 요약 에이전트 (담당: ___)
- [ ] 11. 사진 갤러리 에이전트 (담당: ___)
- [ ] 12. 혼잡도 에이전트 (담당: ___)
- [ ] 13. 다국어 에이전트 (담당: ___)
- [ ] 14. 긴급 정보 에이전트 (담당: ___)
- [ ] 15. 지역 추천 에이전트 (담당: ___)
- [ ] 16. 페르소나 관리 에이전트 (담당: ___)
- [ ] MySQL DB 설정
- [ ] 통합 테스트

### Phase 2 (Week 3-4)
- [ ] 멀티 에이전트 협업
- [ ] Supervisor 패턴

### Phase 3 (Week 5-8)
- [ ] LangGraph 워크플로우
- [ ] 클로드급 대화!

---

## 🤖 LLM 활용 예시

### 팀원이 LLM(Claude/GPT)에게 요청하는 방법

#### 예시 1: Phase 자동 판단 및 구현
```
"ALL_IN_ONE_GUIDE.md를 보고 현재 Phase를 판단해서 구현해줘.

1. Phase 1인지 2인지 3인지 자동 판단
2. 해당 Phase에 맞는 구조로 구현
3. 필요한 스키마만 사용

Phase 판단 기준:
- Phase 1: 기본 에이전트만 있음 → PlaceData, AgentResponse, TravelState(기본 필드만)
- Phase 2: 멀티 에이전트 협업 → + RouteData, WeatherData, BudgetData
- Phase 3: LangGraph 워크플로우 → + ConversationContext, DailyItinerary

자동으로 판단해서 만들어줘."
```

#### 예시 2: 특정 Phase로 바로 구현
```
"Phase 1 기준으로 맛집 에이전트를 만들어줘.

Phase 1 요구사항:
- 기본 에이전트 구조 (template_agent.py 기반)
- PlaceData, AgentResponse만 사용
- TravelState는 기본 필드만 (destination, dates, selected_regions)
- 복잡한 워크플로우 없이 단순 검색/응답

이 기준으로 만들어줘."
```

#### 예시 3: Phase 업그레이드
```
"현재 Phase 1 코드를 Phase 2로 업그레이드해줘.

Phase 2 추가 사항:
- 멀티 에이전트 협업 (Supervisor 패턴)
- RouteData, WeatherData, BudgetData 스키마 추가
- TravelState에 routes, weather_forecast, budget 필드 사용
- 에이전트 간 정보 공유

기존 코드는 그대로 두고 확장만 해줘."
```

#### 예시 4: 페르소나 활용 (참고용)
```
"사용자 페르소나를 참고해서 맛집을 추천해줘.

1. UserPersona의 food_preferences 확인 (예: 한식 선호)
2. 하지만 매번 사용자에게 물어보기:
   '평소 한식 좋아하시는데, 이번 여행에선 어떤 음식 드시고 싶으세요?'
3. 사용자가 '일식'이라고 하면 → 일식 검색
4. 사용자가 '아무거나'라고 하면 → 페르소나 기반 (한식) 검색

페르소나는 기본값일 뿐, 사용자 선택이 우선!"
```

---

### 📊 Phase별 구현 체크리스트 (LLM용)

#### Phase 1 구현 시
- [ ] PlaceData, AgentResponse 스키마 사용
- [ ] TravelState 기본 필드만 (destination, dates, num_travelers)
- [ ] 단순 검색 → 응답 구조
- [ ] 에이전트 독립 실행
- [ ] 복잡한 워크플로우 없음

#### Phase 2 구현 시
- [ ] Phase 1 스키마 + RouteData, WeatherData, BudgetData
- [ ] TravelState에 routes, weather_forecast, budget 추가
- [ ] Supervisor 패턴 구현
- [ ] 에이전트 간 메시지 전달
- [ ] 작업 분배 로직

#### Phase 3 구현 시
- [ ] 모든 스키마 사용 (10개 전부)
- [ ] TravelState 전체 필드 활용
- [ ] ConversationContext로 대화 상태 관리
- [ ] DailyItinerary로 상세 일정 관리
- [ ] LangGraph 워크플로우 (nodes, edges, checkpoints)
- [ ] 조건부 분기 (날씨 기반 등)
- [ ] 대화 저장/복원

---

### LLM이 자동으로 해주는 것
- ✅ Phase 자동 판단
- ✅ 필요한 스키마만 선택
- ✅ 폴더 구조 생성
- ✅ 모든 파일 생성 (코드 복사)
- ✅ Phase에 맞는 구조로 구현
- ✅ 테스트 코드 실행
- ✅ 에러 수정
- ✅ 문서화

**팀원들은 코드를 직접 작성할 필요 없이 LLM에게 요청만 하면 됩니다!**

---

## 🎉 완료!

**이 문서 하나로 모든 개발이 가능합니다!**

1. 위 코드 복사
2. 파일 생성
3. 테스트
4. 배포

**끝!** 🚀
