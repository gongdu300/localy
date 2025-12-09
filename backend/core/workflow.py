"""
LangGraph Workflow - Phase 5: Advanced Architecture (Shell Integration)
"""
import os
import asyncio
from typing import Dict, Any, List
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv(override=True)
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

from langgraph.graph import StateGraph, END
from schemas.state import TeamAgentState
from langchain_openai import ChatOpenAI
import json

# --- Agents Import (Shells & Real) ---
# Planning
from agents.planning.supervisor_agent import SupervisorAgent # (Legacy, but kept for reference)
from agents.planning.itinerary_agent import create_itinerary

# Info Group
from agents.info.budget_agent import track_budget_advanced
from agents.info.crowd_agent import get_crowd_info
from agents.info.weather_agent import get_weather_forecast
from agents.info.gps_agent import get_gps_info
from agents.info.region_agent import recommend_regions

# Search Group
from agents.search.restaurant_agent import search_restaurants
from agents.accommodation.accommodation_agent import agent as accommodation_agent
from agents.persona.persona_agent import agent as persona_agent
from agents.accommodation.accommodation_tools import _compare_prices_parallel
from agents.search.dessert_agent import search_cafes
from agents.search.landmark_agent import search_landmarks
# [New] Minwoo's Agents
from agents.shopping.shopping_agent import shopping_agent_node
from agents.shopping.shopping_tools import search_shopping_tool
from agents.gallery.gallery_agent import photo_gallery_agent_node
from agents.gallery.gallery_tools import photo_gallery_tool

# Common Group
from agents.common.review_agent import summarize_reviews
from agents.common.photo_agent import get_photos
from core.qwen_client import QwenStyleService

# --- Nodes Implementation ---

def load_profile_node(state: TeamAgentState):
    """사용자 프로필 로드 (Persona Agent)"""
    print("👤 [Profile] 사용자 정보 로드 중...")
    
    # 임시 사용자 ID (추후 웹소켓 메타데이터에서 추출)
    user_id = state.get("user_id", "test1")
    
    try:
        # 페르소나 에이전트로 조회
        result = persona_agent.get(user_id)
        
        if result.get("success") and result.get("data"):
            persona = result["data"][0]
            print(f"✅ 페르소나 로드 완료: {persona.get('age_group')} / {persona.get('travel_style')}")
            
            # 사용자 선호도를 State에 반영
            # 1. 캐릭터 (없으면 기본값)
            # 2. 예산 수준 (저/중/고 -> 금액 변환은 budget_agent가 처리하지만 가이드라인 제공)
            
            # 관심사나 스타일을 컨텍스트에 저장
            return {
                "context": {"persona": persona},
                # "preferred_character": "otter" # 이 부분은 DB에 캐릭터 설정이 있다면 연동, 없으면 유지
            }
        else:
            print("⚠️ 페르소나 없음 (신규 유저?)")
            return {"context": {}}
            
    except Exception as e:
        print(f"⚠️ 프로필 로드 실패: {e}")
        return {"context": {}}


def analyze_intent_node(state: TeamAgentState):
    """사용자 의도 분석 (LLM 기반)"""
    print("🧠 [Analyze Intent] 사용자 의도 분석 중... (Powered by LLM)")
    
    user_msg = state.get("user_input", "") or state.get("messages", [])[-1]["content"]
    detected_language = state.get("detected_language", "ko")
    
    try:
        # GPT-4o-mini로 의도 및 목적지 추출
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        
        prompt = f"""Analyze the user input and extract the following information in JSON format:
        1. intent_type: 
           - "travel_plan": ONLY if user wants a full route/schedule/itinerary (e.g. "짜줘", "일정", "코스", "계획")
           - "restaurant_search": if user just wants food/restaurant recommendations (e.g. "맛집", "식당", "카페")
           - "accommodation_search": if user just wants hotel/motel recommendations (e.g. "숙소", "호텔", "모텔")
           - "spot_search": if user just wants tourist spots (e.g. "가볼만한곳", "관광지")
           - "shopping_search": if user wants to find shops (e.g. "편의점", "마트", "다이소", "쇼핑", "살 곳")
           - "photo_search": if user wants photos of the region (e.g. "사진 보여줘", "풍경", "이미지")
           - "chat": general conversation or greeting
        2. destination: specific region name (e.g., '서울 신림동' if '신림' is mentioned, '제주' if '제주도', default to '강릉' if unclear)
        3. start_date: 'YYYY-MM-DD' (default to '2025-05-01')
        4. end_date: 'YYYY-MM-DD' (default to '2025-05-02')

        User Input: "{user_msg}"
        
        Respond ONLY with JSON."""
        
        response = llm.invoke(prompt)
        content = response.content.replace("```json", "").replace("```", "").strip()
        result = json.loads(content)
        
        intent_type = result.get("intent_type", "chat")
        destination = result.get("destination", "강릉")
        dates = [result.get("start_date", "2025-05-01"), result.get("end_date", "2025-05-02")]
        
        print(f"👉분석 결과: {intent_type}, 목적지: {destination}")
        
        # [Refinement] Search intents are also "travel" for routing purposes, but handled differently in nodes
        is_travel = "plan" in intent_type or "search" in intent_type
        
        if is_travel:
            parsed_intent = {
                "type": "new_plan",
                "destination": destination,
                "dates": dates
            }
            return {
                "intent_type": "travel", # Router uses this to go to Parallel Search
                "search_mode": intent_type, # Specific mode for downstream nodes
                "parsed_intent": parsed_intent,
                "destination": destination,
                "start_date": dates[0],
                "end_date": dates[1],
                "detected_language": detected_language,
                "user_input": user_msg # Important for shopping tool
            }
        else:
            return {
                "intent_type": "chat",
                "detected_language": detected_language
            }
            
    except Exception as e:
        print(f"⚠️ [Intent] LLM 분석 실패 ({e}), 기본값 사용")
        # Fallback to default
        if "모텔" in user_msg or "추천" in user_msg or "서울" in user_msg:
             return {
                "intent_type": "travel",
                "parsed_intent": {"type": "new_plan", "destination": "서울", "dates": ["2025-05-01", "2025-05-02"]},
                "destination": "서울",
                "start_date": "2025-05-01",
                "end_date": "2025-05-02",
                "detected_language": detected_language,
                "user_input": user_msg
            }
        return {"intent_type": "chat", "detected_language": detected_language}

async def parallel_search_node(state: TeamAgentState):
    """[Parallel] 의도에 따른 에이전트 선별 실행"""
    region = state.get("destination", "강릉")
    search_mode = state.get("search_mode", "travel_plan") 
    user_input = state.get("user_input", "") or state.get("messages", [])[-1]["content"] # For shopping

    print(f"🎯 Search Mode: {search_mode} -> 에이전트 선별 중...")

    tasks = []
    task_keys = []
    active_agent_names = []
    
    # helper for clean logging
    def add_task(key, name, coro):
        tasks.append(coro)
        task_keys.append(key)
        active_agent_names.append(name)

    # 1. Weather & GPS (Strictly Conditional)
    # Only run for full plan or if explicitly weather related (future)
    if "plan" in search_mode: 
        add_task("weather", "Weather", asyncio.to_thread(get_weather_forecast, region, state.get("start_date"), state.get("end_date")))
        add_task("gps", "GPS", asyncio.to_thread(get_gps_info, region))

    # 2. Restaurants (Only if requested or planing)
    if "plan" in search_mode or "restaurant" in search_mode:
        add_task("restaurants", "Restaurants", asyncio.to_thread(search_restaurants, region))
        add_task("desserts", "Desserts", asyncio.to_thread(search_cafes, region))
        
    # 3. Accommodations (Only if requested or planning)
    if "plan" in search_mode or "accommodation" in search_mode:
        add_task("accommodations", "Accommodations", asyncio.to_thread(accommodation_agent.search, region))
        
    # 4. Landmarks (Only if requested or planning)
    if "plan" in search_mode or "spot" in search_mode:
        add_task("landmarks", "Landmarks", asyncio.to_thread(search_landmarks, region))

    # 5. Shopping (Only if requested)
    # Note: 'plan' usually doesn't need specific shopping unless requested, but let's keep it optional
    if "shopping" in search_mode: 
        add_task("shopping", "Shopping", asyncio.to_thread(search_shopping_tool.invoke, {"region": region, "user_input": user_input}))

    # 6. Photo Gallery (Only if requested)
    if "photo" in search_mode or "gallery" in search_mode:
         add_task("gallery", "Gallery", asyncio.to_thread(photo_gallery_tool.invoke, {"region": region}))

    print(f"🚀 [Selected Agents] {', '.join(active_agent_names)} ({len(tasks)}개) 실행 시작...")

    results = await asyncio.gather(*tasks)
    
    # 결과 매핑
    response_data = {
        "restaurants": [],
        "accommodations": [],
        "desserts": [],
        "landmarks": [],
        "shopping": [], 
        "gallery": {}, 
        "weather_info": {},
        "gps_data": {},
        "messages": [{"role": "system", "content": "정보 수집 완료"}]
    }
    
    for i, key in enumerate(task_keys):
        res = results[i]
        if key == "accommodations":
            acc_data = res['data'] if isinstance(res, dict) else res.data
            response_data["accommodations"] = acc_data
        elif key == "weather":
            response_data["weather_info"] = res.data[0] if res.data else {}
        elif key == "gps":
            response_data["gps_data"] = res.data[0] if res.data else {}
        elif key == "shopping":
             response_data["shopping"] = res # Tool returns list directly
        elif key == "gallery":
             response_data["gallery"] = res # Tool returns dict
        else:
            response_data[key] = res.data
            
    return response_data

def create_itinerary_node(state: TeamAgentState):
    """수집된 정보로 일정 생성"""
    print("🗓️ [Itinerary] 일정 생성 중...")
    
    # 지금은 Shell 데이터가 들어오지만, Itinerary Agent의 로직을 그대로 사용
    # 단, Itinerary Agent가 받아들이는 포맷으로 변환 필요할 수 있음
    
    # [Fix] 실제 검색된 결과 사용 (Hardcoded Demo 제거)
    places = []
    
    # 검색된 장소들 통합 (키가 문자열 리스트로 들어올 수도, 객체 리스트로 들어올 수도 있음)
    # create_itinerary 함수는 dict 리스트를 기대함
    
    # helper to ensure list of dicts
    def ensure_list_of_dicts(data):
        if not data: return []
        # Pydantic 모델인 경우 dict로 변환
        if hasattr(data[0], 'model_dump'):
            return [d.model_dump() for d in data]
        if hasattr(data[0], 'dict'):
            return [d.dict() for d in data]
        if isinstance(data, list):
            return [d for d in data if isinstance(d, dict)]
        return []

    l_list = ensure_list_of_dicts(state.get("landmarks"))
    r_list = ensure_list_of_dicts(state.get("restaurants"))
    d_list = ensure_list_of_dicts(state.get("desserts"))
    a_list = ensure_list_of_dicts(state.get("accommodations"))
    s_list = ensure_list_of_dicts(state.get("shopping")) # New
    
    print(f"🕵️ [Debug] Landmarks: {len(l_list)}, Restaurants: {len(r_list)}, Desserts: {len(d_list)}")
    if s_list: print(f"Sample Shopping: {len(s_list)} items")

    places.extend(a_list)
    
    if not places:
        print("⚠️ 검색된 장소가 없습니다. (검색 에이전트 실패?)")
    
    # [New Logic] 단순 검색(맛집, 숙소)인 경우 일정을 짜지 않고 리스트만 반환
    search_mode = state.get("search_mode", "travel_plan")
    print(f"🗓️ Mode: {search_mode}")
    
    if "search" in search_mode:
        # 필터링
        target_places = []
        is_gallery = False

        if "restaurant" in search_mode:
            target_places = r_list + d_list
            print("🍔 맛집 리스트만 추출")
        elif "accommodation" in search_mode:
            target_places = a_list
            print("🏨 숙소 리스트만 추출")
        elif "spot" in search_mode:
            target_places = l_list
            print("📸 관광지 리스트만 추출")
        elif "shopping" in search_mode:
            target_places = s_list
            print("🛍️ 쇼핑 장소 리스트만 추출")
        elif "photo" in search_mode or "gallery" in search_mode:
            is_gallery = True
            print("📸 사진 갤러리 모드")
        else:
            target_places = places # Fallback
        
        # 갤러리 특별 처리
        if is_gallery:
             gallery_data = state.get("gallery", {})
             if not gallery_data:
                 gallery_data = {"gallery_results": {}, "final_response": "사진을 찾지 못했습니다."}
             
             return {
                 "daily_plans": {"gallery_mode": True, "data": gallery_data},
                 "messages": [{"role": "assistant", "content": gallery_data.get("final_response", "")}]
             }

            
        # 단순 리스트로 변환 (Top 5~10)
        items = []
        for p in target_places[:10]:
            items.append({
                "place_name": p.get("name"),
                "category": p.get("category", "place"),
                "notes": f"⭐ {p.get('rating', 0)} ({p.get('review_count', 0)})",
                "time": "추천", # 시간 대신 추천 태그
                "place_id": p.get("place_id"),
                "google_maps_url": p.get("google_maps_url", "") or p.get("map_url", "")
            })
            
        result_data = {
            "1": {
                "day_number": 1, 
                "date": state.get("start_date"),
                "items": items,
                "is_simple_list": True # Flag
            }
        }
        
        return {
            "daily_plans": result_data,
            "messages": [{"role": "system", "content": f"{len(items)}개의 추천 장소를 찾았습니다."}]
        }

    # 기존 일정 생성 로직 (travel_plan)
    result = create_itinerary(1, state.get("start_date", "2025-05-01"), places)
    
    return {
        "daily_plans": {1: result.data[0]} if result.success else {},
        "messages": [{"role": "assistant", "content": result.message}]
    }

async def augment_itinerary_node(state: TeamAgentState):
    """일정에 예산 및 혼잡도 정보 추가"""
    print("💰 [Augment] 예산 및 혼잡도 계산 중...")
    
    daily_plans = state.get("daily_plans", {})
    if not daily_plans:
        return {}
    
    try:
        # 전체 로직에 10초 타임아웃 적용
        async def _augment_logic():
            start_date = state.get("start_date", "2025-05-01")
            region = state.get("destination", "강릉")
            
            # 1. 예산 계산을 위한 데이터 수집
            day1_plan = daily_plans.get(1, [])
            search_mode = state.get("search_mode", "travel_plan") # [Moved]
            
            # [Optimization] Skip Crowd/Budget for simple searches
            if "plan" not in search_mode:
                print(f"⏩ [Augment] 단순 검색('{search_mode}')이므로 혼잡도/예산 계산 생략")
                return {
                    "daily_plans": daily_plans,
                    "budget_info": {}
                }

            # 2. 혼잡도 정보 추가 (비동기 병렬 처리)
            async def fetch_crowd(place):
                if not isinstance(place, dict): return place
                place_id = place.get('place_id')
                if place_id:
                    # crowd_agent는 동기 함수이므로 to_thread
                    crowd_res = await asyncio.to_thread(get_crowd_info, place_id)
                    if crowd_res.success and crowd_res.data:
                        place['crowd_info'] = crowd_res.data[0]
                return place
            
            # 모든 장소에 대해 혼잡도 조회
            if isinstance(day1_plan, list):
                enriched_plan = await asyncio.gather(*(fetch_crowd(p) for p in day1_plan))
                daily_plans[1] = list(enriched_plan)
                
            # 3. 예산 계산 및 실시간 숙소 가격 반영
            total_budget = state.get("budget", 500000)
            
            # [Added] 실시간 숙소 가격 조회
            manual_accommodation_cost = None
            
            # 검색된 숙소가 있는 경우
            accommodations = state.get("accommodations", [])
            if accommodations and isinstance(accommodations, list) and len(accommodations) > 0:
                top_hotel = accommodations[0]
                hotel_name = top_hotel.get("name")
                
                if hotel_name:
                    print(f"💰 [Budget] '{hotel_name}' 실시간 가격 조회 중...")
                    try:
                        # 오늘부터 2박 3일, 성인 2명 기준 (예시)
                        price_list = await _compare_prices_parallel(
                            place_name=hotel_name,
                            check_in="2025-05-01",  # 실제로는 일정에서 날짜 추출 필요
                            check_out="2025-05-03",
                            num_guests=2,
                            nights=2
                        )
                        
                        if price_list:
                            # 최저가 찾기
                            lowest_price = min(price_list, key=lambda x: x['price'])
                            manual_accommodation_cost = lowest_price['price']
                            print(f"✅ [Budget] 최저가 발견: {manual_accommodation_cost:,}원 ({lowest_price['platform']})")
                    except Exception as e:
                        print(f"⚠️ [Budget] 가격 조회 실패: {e}")

            budget_res = await asyncio.to_thread(
                track_budget_advanced,
                total_budget=total_budget,
                region=region,
                days=2,
                num_people=2,
                manual_accommodation_cost=manual_accommodation_cost
            )
            
            budget_info = budget_res.data[0] if (budget_res and budget_res.success and budget_res.data) else {}
            
            return {
                "daily_plans": daily_plans,
                "budget_info": budget_info
            }

        return await asyncio.wait_for(_augment_logic(), timeout=10.0)

    except asyncio.TimeoutError:
        print("⚠️ [Augment] 타임아웃: 예산/혼잡도 계산 건너뜀")
        return {"daily_plans": daily_plans} # 원본 계획 반환
    except Exception as e:
        print(f"⚠️ [Augment] 오류 발생: {e}")
        return {"daily_plans": daily_plans}

def qwen_transform_node(state: TeamAgentState):
    """Qwen 페르소나 적용 (영어는 GPT-4 사용)"""
    print("🎭 [Qwen] 캐릭터 말투 변환 중...")
    
    # 감지된 언어 확인
    detected_language = state.get("detected_language", "ko")
    character = state.get("preferred_character", "cat")
    
    if detected_language == "en":
        # 영어는 GPT-4 사용
        import openai
        import os
        import json
        
        core_output = {
            "plan": state.get("daily_plans"),
            "weather": state.get("weather_info"),
            "budget": state.get("budget_info") # 예산 추가
        }
        
        character_traits = {
            "cat": "Kkachil Cat - sharp, ends with 'nyaa'",
            "dog": "Sundong Dog - friendly, ends with 'woof'",
            "otter": "Eongddong Otter - quirky, ends with 'dal'"
        }
        
        trait = character_traits.get(character, "friendly guide")
        
        try:
            openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            
            prompt = f"""You are {trait}. Here's travel itinerary data. Explain it enthusiastically and naturally in English.
            
            Data: {json.dumps(core_output, ensure_ascii=False)}
            
            Keep it fun, use emojis, and maintain your character!"""
            
            response = openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": f"You are {trait}. Be enthusiastic about travel!"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            result_text = response.choices[0].message.content
            
        except Exception as e:
            print(f"⚠️ GPT-4 failed: {e}")
            result_text = "Here's your travel plan, dal! Check it out! 🦦"
        
        return {
            "messages": [{"role": "assistant", "content": f"[{character}]: {result_text}"}]
        }
    
    else:
        # 한국어는 기존 Qwen 사용
        qwen = QwenStyleService()
        
        core_output = {
            "plan": state.get("daily_plans"),
            "weather": state.get("weather_info"),
            "budget": state.get("budget_info"), # 예산 추가
            "shopping": state.get("shopping"), # [New]
            "gallery": state.get("gallery")    # [New]
        }
        
        result = qwen.apply_character_style(character, core_output, detected_language)
        
        return {
            "messages": [{"role": "assistant", "content": f"[{character}]: {result['text']}"}]
        }

def general_chat_node(state: TeamAgentState):
    """일상 대화 처리"""
    print("💬 [General Chat] 캐릭터 대화 생성 중...")
    
    qwen = QwenStyleService()
    character = state.get("preferred_character", "cat")
    user_input = state.get("user_input", "") or state.get("messages", [])[-1]["content"]
    
    # 감지된 언어에 맞춰 응답
    detected_language = state.get("detected_language", "ko")
    
    response_text = qwen.apply_general_chat(character, user_input, detected_language)
    
    return {
        "messages": [{"role": "assistant", "content": f"[{character}]: {response_text}"}]
    }

# --- Graph Definition ---

def route_intent(state: TeamAgentState):
    """의도에 따른 라우팅"""
    if state.get("intent_type") == "travel":
        return "parallel_search"
    else:
        return "general_chat_node"

def create_travel_graph():
    workflow = StateGraph(TeamAgentState)
    
    # Nodes
    workflow.add_node("load_profile", load_profile_node) # [New] Entry
    workflow.add_node("analyze_intent", analyze_intent_node)
    workflow.add_node("parallel_search", parallel_search_node)
    workflow.add_node("create_itinerary", create_itinerary_node)
    workflow.add_node("augment_itinerary", augment_itinerary_node)
    workflow.add_node("qwen_transform", qwen_transform_node)
    workflow.add_node("general_chat_node", general_chat_node)
    
    # Edges
    workflow.set_entry_point("load_profile") # [Changed]
    workflow.add_edge("load_profile", "analyze_intent") # [New Edge]
    
    # Conditional Edge
    workflow.add_conditional_edges(
        "analyze_intent",
        route_intent,
        {
            "parallel_search": "parallel_search",
            "general_chat_node": "general_chat_node"
        }
    )
    
    workflow.add_edge("parallel_search", "create_itinerary")
    workflow.add_edge("create_itinerary", "augment_itinerary") # [Updated]
    workflow.add_edge("augment_itinerary", "qwen_transform") # [Updated]
    workflow.add_edge("qwen_transform", END)
    workflow.add_edge("general_chat_node", END)
    
    return workflow.compile()
