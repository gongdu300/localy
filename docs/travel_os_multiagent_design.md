# Travel OS 멀티에이전트 시스템 설계
## 여행의 모든 것을 관장하는 운영체제

> Travel OS는 단순한 챗봇을 넘어 여행의 모든 측면을 관리하는 **완전한 운영체제**입니다. 벡터DB와 RAG 기반 개인화, 실시간 데이터 연동, GPS 최적화를 통해 사용자에게 맞춤형 여행 경험을 제공합니다.

---

## 📚 목차

1. [시스템 개요](#1-시스템-개요)
2. [핵심 아키텍처](#2-핵심-아키텍처)
3. [에이전트 상세 설계](#3-에이전트-상세-설계)
4. [데이터 레이어](#4-데이터-레이어)
5. [워크플로우 예시](#5-워크플로우-예시)
6. [확장 로드맵](#6-확장-로드맵)
7. [구현 가이드](#7-구현-가이드)

---

## 1. 시스템 개요

### 1.1 비전

**Travel OS = 여행의 모든 것을 관장하는 운영체제**

```
기존 여행 앱 (플랫폼)     Travel OS (운영체제)
├─ 맛집 앱               ├─ 모든 여행 기능 통합
├─ 숙소 앱               ├─ 개인화된 AI 파트너
├─ 교통 앱               ├─ 실시간 최적화
├─ 일정 앱               ├─ 컨텍스트 유지
└─ 지도 앱               └─ 무한 확장 가능
```

### 1.2 핵심 원칙

1. **사용자 중심 개인화**
   - 벡터DB에 사용자 선호도 저장
   - RAG로 과거 여행 이력 활용
   - 실시간 학습

2. **완전한 자율성**
   - 사용자는 의도만 전달
   - 시스템이 모든 것을 처리
   - 필요시에만 확인 요청

3. **확장 가능한 구조**
   - 새로운 에이전트 쉽게 추가
   - 외부 API 유연하게 연동
   - 기능 독립적으로 업데이트

---

## 2. 핵심 아키텍처

### 2.1 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────────┐
│                         사용자                                │
│                 (음성/텍스트/위치 정보)                         │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│              캐릭터 페르소나 레이어 (로컬 LLM)                  │
│         까칠냥이 / 순둥멍멍이 / 엉뚱수달 (Qwen2.5)             │
│                                                             │
│  역할: 입출력 라우팅 + 캐릭터 일관성 + 감정 표현               │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                  Orchestrator (GPT-4 기반)                   │
│              "여행 OS의 커널(Kernel)" - 핵심 조율자             │
│                                                             │
│  역할:                                                       │
│  - 사용자 의도 파악                                           │
│  - 에이전트 선택 및 순서 결정                                  │
│  - 상태 관리 (State Management)                             │
│  - 에러 처리 및 복구                                          │
│  - 결과 통합 및 사용자 응답 생성                               │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                    전문 에이전트 레이어                         │
│              (각 에이전트는 독립적으로 동작)                     │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Itinerary Planner │  │ Restaurant Finder │               │
│  │   일정 계획        │  │    맛집 추천       │               │
│  └──────────────────┘  └──────────────────┘                │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Accommodation    │  │ Transportation   │                │
│  │   숙소 검색        │  │    교통 최적화     │               │
│  └──────────────────┘  └──────────────────┘                │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Route Optimizer  │  │ Weather Monitor  │                │
│  │   경로 최적화      │  │    날씨 확인       │               │
│  └──────────────────┘  └──────────────────┘                │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Crowd Analytics  │  │ Budget Manager   │                │
│  │   혼잡도 분석      │  │    예산 관리       │               │
│  └──────────────────┘  └──────────────────┘                │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Real-time GPS    │  │ Event Searcher   │                │
│  │   GPS 네비게이션   │  │    이벤트 검색     │               │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                      데이터 레이어                             │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Vector DB  │  │   Relational │  │   Cache    │            │
│  │  (Pinecone)│  │   DB (PostgreSQL)│ │  (Redis)   │         │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ User Prefs │  │   Trip History │  │  Knowledge │          │
│  │  사용자 선호 │  │  여행 기록   │  │   Base     │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                    외부 API 레이어                             │
│                                                             │
│  Google Maps │ OpenWeather │ Booking.com │ 공공데이터        │
│  Kakao Map   │ 대중교통 API  │ 항공사 API   │ 맛집 리뷰 크롤링 │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 State Schema

```python
from typing import TypedDict, Annotated, List, Dict
from operator import add

class TravelOSState(TypedDict):
    """Travel OS 전체 상태"""
    
    # 사용자 정보
    user_id: str
    user_location: Dict  # {"lat": 37.5, "lng": 127.0}
    user_preferences: Dict  # 벡터DB에서 로드
    
    # 대화 컨텍스트
    messages: Annotated[List, add]
    user_intent: str  # "plan_trip", "find_restaurant", "modify_itinerary"
    
    # 여행 정보
    trip_context: Dict
    destination: str
    dates: Dict  # {"start": "2024-01-01", "end": "2024-01-03"}
    budget: float
    num_people: int
    
    # 각 에이전트 결과
    itinerary: Dict
    restaurants: List[Dict]
    accommodations: List[Dict]
    transportation: Dict
    routes: List[Dict]
    weather: Dict
    events: List[Dict]
    crowd_info: Dict
    
    # 메타 정보
    active_agents: List[str]
    completed_tasks: List[str]
    pending_tasks: List[str]
    requires_user_approval: bool
    
    # 최종 응답
    final_response: str
```

---

## 3. 에이전트 상세 설계

### 3.1 Orchestrator (핵심 조율자)

**역할:** Travel OS의 "두뇌"

```python
class OrchestratorAgent:
    """
    사용자 의도를 파악하고 적절한 에이전트들을 호출
    """
    
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4-turbo", temperature=0)
        self.intent_classifier = self.create_intent_classifier()
    
    async def execute(self, state: TravelOSState) -> TravelOSState:
        """메인 로직"""
        
        # 1. 의도 파악
        intent = await self.classify_intent(state['messages'][-1])
        state['user_intent'] = intent
        
        # 2. 필요한 에이전트 결정
        required_agents = self.determine_agents(intent, state)
        
        # 3. 에이전트 실행 계획 생성
        execution_plan = self.create_execution_plan(required_agents, state)
        
        # 4. 우선순위/의존성 기반 순서 결정
        state['pending_tasks'] = execution_plan
        
        return state
    
    def classify_intent(self, message: str) -> str:
        """의도 분류"""
        intents = {
            "plan_new_trip": "새로운 여행 계획",
            "find_restaurant": "맛집 찾기",
            "find_accommodation": "숙소 찾기",
            "optimize_route": "경로 최적화",
            "modify_itinerary": "일정 수정",
            "get_weather": "날씨 확인",
            "get_transportation": "교통편 확인",
            "check_crowd": "혼잡도 확인",
            "find_events": "이벤트 찾기",
            "navigate": "실시간 네비게이션"
        }
        
        # GPT-4로 분류
        prompt = f"""
        Classify the user's intent:
        Message: {message}
        
        Available intents:
        {json.dumps(intents, indent=2, ensure_ascii=False)}
        
        Output the intent key only.
        """
        
        response = self.llm.invoke(prompt)
        return response.content.strip()
    
    def determine_agents(self, intent: str, state: TravelOSState) -> List[str]:
        """의도에 따라 필요한 에이전트 결정"""
        
        agent_map = {
            "plan_new_trip": [
                "itinerary_planner",
                "restaurant_finder",
                "accommodation_finder",
                "transportation_optimizer",
                "weather_monitor",
                "budget_manager"
            ],
            "find_restaurant": [
                "restaurant_finder",
                "crowd_analytics",  # 혼잡도도 함께
                "route_optimizer"   # 현재 위치에서 경로
            ],
            "modify_itinerary": [
                "itinerary_planner",
                "route_optimizer",
                "budget_manager"
            ],
            "navigate": [
                "gps_navigator",
                "crowd_analytics",
                "weather_monitor"
            ]
        }
        
        return agent_map.get(intent, [])
    
    def create_execution_plan(self, agents: List[str], state: TravelOSState) -> List[Dict]:
        """실행 계획 생성 (의존성 고려)"""
        
        # 의존성 그래프
        dependencies = {
            "itinerary_planner": [],  # 독립적
            "restaurant_finder": ["itinerary_planner"],  # 일정 먼저
            "accommodation_finder": ["itinerary_planner"],
            "route_optimizer": ["restaurant_finder", "accommodation_finder"],
            "budget_manager": ["itinerary_planner", "restaurant_finder", "accommodation_finder"]
        }
        
        # 위상 정렬로 순서 결정
        plan = self.topological_sort(agents, dependencies)
        
        return plan
```

### 3.2 Itinerary Planner (일정 계획)

```python
class ItineraryPlannerAgent:
    """
    여행 일정을 짜는 전문 에이전트
    RAG + LLM 기반
    """
    
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4", temperature=0.7)
        self.vector_store = self.setup_vector_store()
        self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 10})
    
    async def execute(self, state: TravelOSState) -> TravelOSState:
        """일정 생성"""
        
        # 1. RAG: 유사한 여행 일정 검색
        query = f"{state['destination']} {state['dates']} 여행 일정"
        similar_trips = await self.retriever.aget_relevant_documents(query)
        
        # 2. 사용자 선호도 반영
        user_prefs = state['user_preferences']
        
        # 3. 날씨 정보 고려
        weather = state.get('weather', {})
        
        # 4. LLM으로 일정 생성
        prompt = f"""
        Create a detailed travel itinerary:
        
        Destination: {state['destination']}
        Dates: {state['dates']['start']} to {state['dates']['end']}
        Budget: {state['budget']} KRW
        Number of people: {state['num_people']}
        
        User preferences:
        - Food: {user_prefs.get('food_preferences', [])}
        - Activities: {user_prefs.get('activities', [])}
        - Pace: {user_prefs.get('pace', 'moderate')}
        
        Similar trips reference:
        {self.format_similar_trips(similar_trips)}
        
        Weather forecast:
        {weather}
        
        Generate a day-by-day itinerary with:
        - Morning, Afternoon, Evening activities
        - Estimated time and cost for each
        - Travel time between locations
        - Alternatives for bad weather
        
        Format as structured JSON.
        """
        
        response = await self.llm.ainvoke(prompt)
        itinerary = json.loads(response.content)
        
        # 5. 상태 업데이트
        state['itinerary'] = itinerary
        state['completed_tasks'].append('itinerary_planning')
        
        return state
    
    def setup_vector_store(self):
        """벡터 스토어 설정 (여행 지식 DB)"""
        from langchain.vectorstores import Pinecone
        from langchain.embeddings import OpenAIEmbeddings
        
        embeddings = OpenAIEmbeddings()
        
        # Pinecone에 저장된 여행 정보 로드
        vector_store = Pinecone.from_existing_index(
            index_name="travel-knowledge",
            embedding=embeddings
        )
        
        return vector_store
```

### 3.3 Restaurant Finder (맛집 추천)

```python
class RestaurantFinderAgent:
    """
    맛집 추천 + 리뷰 분석 + 개인화
    """
    
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4")
        self.vector_store = self.setup_restaurant_db()
        self.review_analyzer = ReviewAnalyzer()
    
    async def execute(self, state: TravelOSState) -> TravelOSState:
        """맛집 검색 및 추천"""
        
        # 1. 일정에서 식사 시간/위치 추출
        meal_times = self.extract_meal_times(state['itinerary'])
        
        restaurants = []
        
        for meal in meal_times:
            # 2. 위치 기반 검색
            nearby = await self.search_nearby_restaurants(
                location=meal['location'],
                cuisine=state['user_preferences'].get('food_preferences'),
                budget=self.calculate_meal_budget(state['budget'])
            )
            
            # 3. RAG: 리뷰 기반 필터링
            for restaurant in nearby:
                # 벡터DB에서 리뷰 검색
                reviews = await self.vector_store.similarity_search(
                    f"{restaurant['name']} 리뷰"
                )
                
                # 리뷰 감성 분석
                sentiment = self.review_analyzer.analyze(reviews)
                
                restaurant['review_score'] = sentiment['score']
                restaurant['highlights'] = sentiment['highlights']
            
            # 4. 재순위화 (개인화 + 리뷰 + 위치)
            ranked = self.personalized_ranking(
                nearby,
                user_prefs=state['user_preferences']
            )
            
            restaurants.extend(ranked[:3])  # 상위 3개
        
        state['restaurants'] = restaurants
        state['completed_tasks'].append('restaurant_finding')
        
        return state
    
    async def search_nearby_restaurants(self, location, cuisine, budget):
        """실제 API 호출"""
        # Google Places API / Kakao Local API
        results = await google_places_api.search(
            location=location,
            type='restaurant',
            keyword=cuisine,
            radius=1000
        )
        
        # 예산 필터링
        filtered = [r for r in results if r['price_level'] <= budget]
        
        return filtered
    
    def personalized_ranking(self, restaurants, user_prefs):
        """개인화된 순위"""
        
        for r in restaurants:
            score = 0
            
            # 리뷰 점수
            score += r['review_score'] * 0.4
            
            # 사용자 선호 음식 매칭
            cuisine_match = self.match_cuisine(r, user_prefs['food_preferences'])
            score += cuisine_match * 0.3
            
            # 거리 점수 (가까울수록 높음)
            distance_score = 1 / (r['distance'] + 1)
            score += distance_score * 0.2
            
            # 가격 적절성
            price_score = self.price_appropriateness(r['price_level'], user_prefs['budget_tier'])
            score += price_score * 0.1
            
            r['final_score'] = score
        
        return sorted(restaurants, key=lambda x: x['final_score'], reverse=True)
```

### 3.4 Route Optimizer (경로 최적화)

```python
class RouteOptimizerAgent:
    """
    최단 경로 + GPS 기반 실시간 최적화
    TSP (Traveling Salesman Problem) 알고리즘 사용
    """
    
    def __init__(self):
        self.maps_api = GoogleMapsAPI()
        self.tsp_solver = ORToolsTSP()
    
    async def execute(self, state: TravelOSState) -> TravelOSState:
        """경로 최적화"""
        
        # 1. 일정에서 모든 POI 추출
        pois = self.extract_pois(state['itinerary'])
        
        # 2. 거리 행렬 생성
        distance_matrix = await self.get_distance_matrix(pois)
        
        # 3. TSP 문제 풀기
        optimized_order = self.tsp_solver.solve(distance_matrix)
        
        # 4. 각 구간별 상세 경로
        routes = []
        for i in range(len(optimized_order) - 1):
            start = pois[optimized_order[i]]
            end = pois[optimized_order[i + 1]]
            
            route = await self.maps_api.get_directions(
                origin=start,
                destination=end,
                mode='transit',  # transit, driving, walking
                departure_time='now',
                alternatives=True  # 대안 경로도
            )
            
            routes.append({
                'from': start,
                'to': end,
                'primary_route': route[0],
                'alternatives': route[1:],
                'estimated_time': route[0]['duration'],
                'distance': route[0]['distance']
            })
        
        # 5. 실시간 교통 정보 반영
        for route in routes:
            traffic = await self.get_real_time_traffic(route['primary_route'])
            route['real_time_duration'] = traffic['duration_in_traffic']
            route['traffic_level'] = traffic['traffic_level']
        
        state['routes'] = routes
        state['completed_tasks'].append('route_optimization')
        
        return state
    
    async def get_distance_matrix(self, pois):
        """모든 POI 간 거리 행렬"""
        n = len(pois)
        matrix = [[0] * n for _ in range(n)]
        
        for i in range(n):
            for j in range(i + 1, n):
                distance = await self.maps_api.get_distance(pois[i], pois[j])
                matrix[i][j] = distance
                matrix[j][i] = distance
        
        return matrix
```

### 3.5 GPS Navigator (실시간 네비게이션)

```python
class GPSNavigatorAgent:
    """
    실시간 GPS 기반 네비게이션
    사용자 위치 추적 + 동적 경로 재계산
    """
    
    def __init__(self):
        self.maps_api = GoogleMapsAPI()
        self.location_tracker = LocationTracker()
    
    async def execute(self, state: TravelOSState) -> TravelOSState:
        """실시간 네비게이션"""
        
        # 1. 현재 위치
        current_location = state['user_location']
        
        # 2. 목적지
        destination = state['itinerary']['current_destination']
        
        # 3. 실시간 경로 계산
        route = await self.maps_api.get_directions(
            origin=current_location,
            destination=destination,
            mode='walking',  # 또는 'transit', 'driving'
            departure_time='now'
        )
        
        # 4. 단계별 안내
        steps = route['legs'][0]['steps']
        
        navigation_guide = {
            'current_location': current_location,
            'destination': destination,
            'total_distance': route['legs'][0]['distance']['value'],
            'total_duration': route['legs'][0]['duration']['value'],
            'steps': [
                {
                    'instruction': step['html_instructions'],
                    'distance': step['distance']['text'],
                    'duration': step['duration']['text'],
                    'maneuver': step.get('maneuver', 'straight')
                }
                for step in steps
            ],
            'eta': self.calculate_eta(route)
        }
        
        # 5. 주변 정보 (맛집, 화장실, 편의점 등)
        nearby_amenities = await self.find_nearby_amenities(current_location)
        navigation_guide['nearby'] = nearby_amenities
        
        state['gps_navigation'] = navigation_guide
        
        return state
    
    async def track_and_update(self, state: TravelOSState):
        """위치 추적 및 경로 재계산 (백그라운드)"""
        
        while not state.get('navigation_complete'):
            # 1초마다 위치 업데이트
            await asyncio.sleep(1)
            
            new_location = await self.location_tracker.get_current_location()
            
            # 경로 이탈 감지
            if self.is_off_route(new_location, state['gps_navigation']):
                # 경로 재계산
                print("⚠️ 경로 이탈 감지! 재계산 중...")
                await self.execute(state)
```

### 3.6 Weather Monitor (날씨 모니터링)

```python
class WeatherMonitorAgent:
    """
    날씨 예보 + 실시간 모니터링 + 일정 조정 제안
    """
    
    def __init__(self):
        self.weather_api = OpenWeatherMapAPI()
    
    async def execute(self, state: TravelOSState) -> TravelOSState:
        """날씨 확인 및 영향 분석"""
        
        # 1. 여행지 날씨 예보
        destination = state['destination']
        dates = state['dates']
        
        forecast = await self.weather_api.get_forecast(
            location=destination,
            start_date=dates['start'],
            end_date=dates['end']
        )
        
        # 2. 일정별 날씨 매칭
        itinerary = state['itinerary']
        
        for day in itinerary['days']:
            date = day['date']
            weather_for_day = forecast[date]
            
            # 3. 날씨 영향 분석
            impact = self.analyze_weather_impact(day['activities'], weather_for_day)
            
            day['weather'] = weather_for_day
            day['weather_impact'] = impact
            
            # 4. 대안 제안 (비/눈 예보 시)
            if impact['severity'] == 'high':
                alternatives = await self.suggest_alternatives(
                    day['activities'],
                    weather_for_day
                )
                day['alternative_activities'] = alternatives
        
        state['weather'] = forecast
        state['completed_tasks'].append('weather_monitoring')
        
        return state
    
    def analyze_weather_impact(self, activities, weather):
        """날씨가 활동에 미치는 영향 분석"""
        
        impact = {'severity': 'low', 'warnings': []}
        
        # 야외 활동 체크
        for activity in activities:
            if activity['type'] == 'outdoor':
                if weather['rain'] > 10:  # mm
                    impact['severity'] = 'high'
                    impact['warnings'].append(f"{activity['name']: 비 예보 ({weather['rain']}mm)")
                
                if weather['temperature'] > 35 or weather['temperature'] < 0:
                    impact['severity'] = 'medium'
                    impact['warnings'].append(f"{activity['name']}: 극한 기온 ({weather['temperature']}°C)")
        
        return impact
```

### 3.7 Crowd Analytics (혼잡도 분석)

```python
class CrowdAnalyticsAgent:
    """
    실시간 혼잡도 분석 + 예측
    Google Popular Times + 공공데이터 활용
    """
    
    def __init__(self):
        self.google_places = GooglePlacesAPI()
        self.ml_model = CrowdPredictionModel()
    
    async def execute(self, state: TravelOSState) -> TravelOSState:
        """혼잡도 분석"""
        
        pois = self.extract_pois(state['itinerary'])
        
        crowd_info = {}
        
        for poi in pois:
            # 1. Google Popular Times
            popular_times = await self.google_places.get_popular_times(poi['place_id'])
            
            # 2. 실시간 혼잡도 (있으면)
            live_crowd = popular_times.get('live', None)
            
            # 3. 예측 혼잡도 (ML 모델)
            predicted_crowd = self.ml_model.predict(
                place_id=poi['place_id'],
                datetime=poi['visit_time'],
                day_of_week=poi['day_of_week'],
                weather=state['weather'].get(poi['date'], {})
            )
            
            crowd_info[poi['name']] = {
                'current': live_crowd,
                'predicted': predicted_crowd,
                'historical': popular_times['week'],
                'best_time_to_visit': self.find_best_time(popular_times),
                'recommendation': self.generate_recommendation(predicted_crowd)
            }
        
        state['crowd_info'] = crowd_info
        state['completed_tasks'].append('crowd_analytics')
        
        return state
    
    def generate_recommendation(self, crowd_level):
        """혼잡도 기반 추천"""
        if crowd_level < 30:
            return "여유로운 시간이에요! 천천히 둘러보세요."
        elif crowd_level < 60:
            return "적당한 혼잡도예요."
        else:
            return "⚠️ 매우 혼잡할 것으로 예상됩니다. 시간 조정을 고려하세요."
```

---

## 4. 데이터 레이어

### 4.1 Vector Database 구조

```python
# Pinecone Vector DB 스키마

# 1. User Preferences Vector
user_prefs_vectors = {
    "user_id": "u12345",
    "vector": [0.1, 0.5, ...],  # 768 dim
    "metadata": {
        "food_preferences": ["Italian", "Korean BBQ"],
        "activity_level": "moderate",
        "budget_tier": "medium",
        "travel_style": "cultural"
    }
}

# 2. Restaurant Reviews Vector
restaurant_vectors = {
    "restaurant_id": "r67890",
    "vector": [0.3, 0.2, ...],
    "metadata": {
        "name": "부산 밀면",
        "cuisine": "Korean",
        "price_level": 2,
        "rating": 4.5,
        "review_summary": "맛있고 가성비 좋음"
    }
}

# 3. Trip History Vector
trip_vectors = {
    "trip_id": "t11111",
    "vector": [0.7, 0.1, ...],
    "metadata": {
        "destination": "부산",
        "duration_days": 3,
        "satisfaction_score": 4.8,
        "itinerary": {...}
    }
}
```

### 4.2 PostgreSQL Schema

```sql
-- 사용자
CREATE TABLE users (
    user_id VARCHAR PRIMARY KEY,
    email VARCHAR,
    created_at TIMESTAMP,
    last_active TIMESTAMP
);

-- 사용자 상세 프로필 (오늘 업데이트됨!)
CREATE TABLE personas (
    user_id VARCHAR PRIMARY KEY REFERENCES users(user_id),
    persona_like_food TEXT,   -- 선호 음식
    persona_hate_food TEXT,   -- 기피 음식
    persona_theme VARCHAR,    -- 여행 테마 (힐링, 액티비티 등)
    persona_like_region VARCHAR, -- 선호 지역
    persona_avoid_region VARCHAR, -- 기피 지역
    persona_transportation VARCHAR, -- 이동 수단
    persona_travel_budget INT,  -- 1박 예산
    persona_accommodation_type VARCHAR, -- 숙소 유형
    mbti_result VARCHAR,      -- ESTJ 등
    matched_character VARCHAR, -- cat, dog, otter
    updated_at TIMESTAMP
);

-- 여행 일정
CREATE TABLE itineraries (
    itinerary_id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(user_id),
    destination VARCHAR,
    start_date DATE,
    end_date DATE,
    status VARCHAR, -- planning, confirmed, completed
    content JSONB  -- 전체 일정 JSON
);
```

---

## 5. 워크플로우 예시 (사용자 시나리오)

1. **사용자**: "이번 주말에 부산 2박 3일 여행 가고 싶어. 예산은 30만원이고 맛있는 거 많이 먹고 싶어."
2. **Orchestrator**: 의도 파악 → `plan_new_trip`
3. **Itinerary Planner**: 부산 2박 3일 기본 일정 생성 (광안리, 해운대, 남포동 등)
4. **Restaurant Finder**: 식사 시간마다 맛집 검색 (밀면, 돼지국밥, 횟집) + 사용자 선호 반영
5. **Accommodation Finder**: 예산 범위 내 숙소 검색 (광안리 근처 호텔)
6. **Route Optimizer**: 동선 최적화 (해운대 → 광안리 이동 경로)
7. **Budget Manager**: 총 예산 계산 및 검증 (30만원 초과 여부 확인)
8. **Final Response**: 완성된 일정표 제시

---

## 6. 확장 로드맵

- **Phase 9**: 개인화된 일정 생성 (현재 진행 중)
- **Phase 10**: 대시보드 연동
- **Phase 11**: RAG 기반 지식 검색
- **Phase 12**: 실시간 GPS 네비게이션 모드
- **Phase 13**: 음성 인터페이스 (STT/TTS) 추가
