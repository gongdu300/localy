"""Shopping Agent Tools
Combines functionality from shopping_search_tool.py and shopping_recommend_tool.py
"""
import os
from typing import List, Dict, Any, Optional

from dotenv import load_dotenv
import googlemaps
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

load_dotenv()

# API Clients
GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
gmaps = googlemaps.Client(key=GOOGLE_API_KEY) if GOOGLE_API_KEY else None

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.7,
)

# --- Constants ---

LARGE_MART_KEYWORDS = [
    "이마트", "홈플러스", "롯데마트", "메가마트", "빅마켓",
    "하나로마트", "농협", "코스트코", "emart", "homeplus",
]

CONVENIENCE_STORE_CHAINS = [
    "GS25", "CU", "세븐일레븐", "7-ELEVEN", "이마트24", "씨유", "미니스톱",
]

# --- Helper Functions (Category Logic) ---

def is_convenience_store_search(user_input: str) -> bool:
    convenience_keywords = ["편의점", "cvs", "씨유", "GS25", "세븐일레븐", "cu"]
    return any(keyword in user_input for keyword in convenience_keywords)

def is_pharmacy_search(user_input: str) -> bool:
    pharmacy_keywords = ["약국", "pharmacy", "약방", "드럭스토어"]
    return any(keyword in user_input for keyword in pharmacy_keywords)

def is_large_mart_search(user_input: str) -> bool:
    large_mart_keywords = ["대형마트", "마트", "슈퍼마켓", "supermarket"]
    return any(keyword in user_input for keyword in large_mart_keywords)

def get_category_from_input(user_input: str) -> str:
    categories = {
        "편의점": ["편의점", "cvs", "씨유", "GS25", "세븐일레븐", "cu"],
        "대형마트": ["대형마트", "마트", "이마트", "홈플러스", "롯데마트"],
        "팝업스토어": ["팝업", "팝업스토어", "popup"],
        "다이소": ["다이소", "daiso"],
        "약국": ["약국", "pharmacy"],
        "재래시장": ["재래시장", "시장", "전통시장"],
    }
    text = user_input.lower()
    for category, keywords in categories.items():
        for keyword in keywords:
            if keyword in text:
                return category
    return ""

def get_implied_category_from_product(user_input: str) -> Optional[str]:
    text = user_input.lower()
    
    large_mart_keywords = [
        "고기", "삼겹살", "목살", "소고기", "돼지고기",
        "장보기", "장 보러", "장 보러 갈", "정육", "정육점",
    ]
    for kw in large_mart_keywords:
        if kw in text: return "대형마트"

    daiso_keywords = [
        "와인오프너", "와인 오프너", "병따개", "병 따개",
        "와인 따개", "오프너", "주방용품", "생활용품",
    ]
    for kw in daiso_keywords:
        if kw in text: return "다이소"

    pharmacy_keywords = [
        "감기약", "두통약", "해열제", "종합감기약", "기침약",
        "감기 약", "두통 약", "약 필요", "약 사러", "약 파는",
    ]
    for kw in pharmacy_keywords:
        if kw in text: return "약국"

    convenience_keywords = [
        "콘돔", "피임도구", "피임 도구", "피임기구", "피임 기구",
        "야간 간식", "야식 사러", "컵라면 사러",
    ]
    for kw in convenience_keywords:
        if kw in text: return "편의점"

    return None

def has_category_keyword(user_input: str) -> bool:
    if get_category_from_input(user_input) != "":
        return True
    if get_implied_category_from_product(user_input) is not None:
        return True
    return False

def get_category_hint(user_input: str) -> str:
    explicit = get_category_from_input(user_input)
    implied = get_implied_category_from_product(user_input)

    if is_pharmacy_search(user_input) or explicit == "약국" or implied == "약국":
        return "약국"
    if is_convenience_store_search(user_input) or explicit == "편의점" or implied == "편의점":
        return "편의점"
    if is_large_mart_search(user_input) or explicit == "대형마트" or implied == "대형마트":
        return "대형마트"

    if explicit: return explicit
    if implied: return implied
    return "쇼핑 장소"

# --- Filter Functions ---

def filter_convenience_stores(places: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    filtered = []
    for place in places:
        name = place["name"]
        if not any(keyword in name for keyword in LARGE_MART_KEYWORDS):
            filtered.append(place)
    return filtered

def filter_large_marts(places: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    filtered = []
    for place in places:
        name = place["name"]
        if not any(keyword in name for keyword in CONVENIENCE_STORE_CHAINS):
            filtered.append(place)
    return filtered

def filter_by_brand(places: List[Dict[str, Any]], brand_keyword: str) -> List[Dict[str, Any]]:
    filtered = []
    for place in places:
        if brand_keyword in place["name"]:
            filtered.append(place)
    return filtered

# --- Search Implementation ---

def search_shopping_places(
    region: str,
    num_results: int = 5,
    is_convenience: bool = False,
    is_pharmacy: bool = False,
    is_large_mart: bool = False,
    keyword: Optional[str] = None,
) -> List[Dict[str, Any]]:
    if not gmaps: return []

    try:
        geocode_result = gmaps.geocode(f"{region}, 대한민국", language="ko")
        if not geocode_result: return []

        coords = geocode_result[0]["geometry"]["location"]
        
        target_coords = {"lat": coords["lat"], "lng": coords["lng"]}
        return _execute_places_search(target_coords, num_results, is_convenience, is_pharmacy, is_large_mart, keyword)
        
    except Exception as e:
        print(f"❌ 검색 실패: {e}")
        return []

def search_shopping_places_by_coords(
    lat: float,
    lng: float,
    num_results: int = 5,
    is_convenience: bool = False,
    is_pharmacy: bool = False,
    is_large_mart: bool = False,
    keyword: Optional[str] = None,
) -> List[Dict[str, Any]]:
    target_coords = {"lat": lat, "lng": lng}
    return _execute_places_search(target_coords, num_results, is_convenience, is_pharmacy, is_large_mart, keyword)

def _execute_places_search(
    coords: Dict[str, float],
    num_results: int,
    is_convenience: bool,
    is_pharmacy: bool,
    is_large_mart: bool,
    keyword: Optional[str]
) -> List[Dict[str, Any]]:
    if not gmaps: return []

    if is_pharmacy:
        search_types = ["pharmacy"]
    elif is_large_mart:
        search_types = ["supermarket", "department_store"]
    elif is_convenience:
        search_types = ["convenience_store"]
    else:
        search_types = ["shopping_mall", "supermarket", "convenience_store", "department_store"]

    all_places: List[Dict[str, Any]] = []

    for place_type in search_types:
        params: Dict[str, Any] = {
            "location": (coords["lat"], coords["lng"]),
            "radius": 3000,
            "type": place_type,
            "language": "ko",
        }
        if keyword:
            params["keyword"] = keyword

        results = gmaps.places_nearby(**params)

        for place in results.get("results", []):
            loc = place["geometry"]["location"]
            map_url = f"https://www.google.com/maps/search/?api=1&query={loc['lat']},{loc['lng']}&query_place_id={place['place_id']}"
            
            place_info = {
                "place_id": place["place_id"],
                "name": place["name"],
                "rating": place.get("rating", 0),
                "review_count": place.get("user_ratings_total", 0),
                "address": place.get("vicinity", ""),
                "types": place.get("types", []),
                "lat": loc["lat"],
                "lng": loc["lng"],
                "map_url": map_url,
            }
            all_places.append(place_info)

    if is_convenience: all_places = filter_convenience_stores(all_places)
    if is_large_mart: all_places = filter_large_marts(all_places)
    if keyword: all_places = filter_by_brand(all_places, keyword)

    sorted_places = sorted(all_places, key=lambda x: x["rating"], reverse=True)
    
    seen_names = set()
    unique_places = []
    for place in sorted_places:
        if place["name"] not in seen_names:
            unique_places.append(place)
            seen_names.add(place["name"])

    return unique_places[:num_results]

# --- Tool Definitions ---

@tool
def search_shopping_tool(region: str, user_input: str) -> List[Dict[str, Any]]:
    """
    [서치용 툴 - 고수준 함수]
    사용자 입력에서 카테고리를 파악하여 쇼핑 장소를 검색합니다.
    """
    is_convenience = is_convenience_store_search(user_input)
    is_pharmacy = is_pharmacy_search(user_input)
    is_large_mart = is_large_mart_search(user_input)

    category = get_category_from_input(user_input)
    implied_category = get_implied_category_from_product(user_input)
    
    if not category and implied_category:
        category = implied_category

    if category == "편의점" and not is_convenience: is_convenience = True
    if category == "대형마트" and not is_large_mart: is_large_mart = True
    if category == "약국" and not is_pharmacy: is_pharmacy = True

    keyword = None
    brand_like_categories = ["다이소", "이마트", "홈플러스", "롯데마트", "코스트코"]
    if category in brand_like_categories:
        keyword = category

    return search_shopping_places(
        region=region,
        num_results=15,
        is_convenience=is_convenience,
        is_pharmacy=is_pharmacy,
        is_large_mart=is_large_mart,
        keyword=keyword,
    )

@tool
def search_shopping_by_coords(lat: float, lng: float, user_input: str) -> List[Dict[str, Any]]:
    """
    [현재 위치용 고수준 검색 함수]
    """
    is_convenience = is_convenience_store_search(user_input)
    is_pharmacy = is_pharmacy_search(user_input)
    is_large_mart = is_large_mart_search(user_input)

    category = get_category_from_input(user_input)
    implied_category = get_implied_category_from_product(user_input)
    
    if not category and implied_category:
        category = implied_category

    if category == "편의점" and not is_convenience: is_convenience = True
    if category == "대형마트" and not is_large_mart: is_large_mart = True
    if category == "약국" and not is_pharmacy: is_pharmacy = True

    keyword = None
    brand_like_categories = ["다이소", "이마트", "홈플러스", "롯데마트", "코스트코"]
    if category in brand_like_categories:
        keyword = category

    return search_shopping_places_by_coords(
        lat=lat,
        lng=lng,
        num_results=15,
        is_convenience=is_convenience,
        is_pharmacy=is_pharmacy,
        is_large_mart=is_large_mart,
        keyword=keyword,
    )

@tool
def recommend_shopping_tool(region: str, user_input: str, shopping_places: List[Dict[str, Any]]) -> str:
    """
    [추천용 툴]
    검색 결과 중 평점 높은 곳을 선별하여 추천 멘트를 작성합니다.
    """
    if not shopping_places:
        return f"{region}에서 해당 조건에 맞는 쇼핑 장소를 찾지 못했습니다. 😢"

    sorted_places = sorted(
        shopping_places,
        key=lambda s: (
            float(s.get("rating", 0) or 0),
            int(s.get("review_count", 0) or 0),
        ),
        reverse=True,
    )
    top_places = sorted_places[:5]

    shopping_list_text = "\n".join(
        [
            f"- {s['name']} (평점 {s['rating']}⭐, 리뷰 {s['review_count']}개)"
            f" - 지도: {s.get('map_url', 'URL 없음')}"
            for s in top_places
        ]
    )

    category_hint = get_category_hint(user_input)

    prompt = f"""
당신은 한국의 지역 상권을 잘 아는 쇼핑 추천 전문가입니다.

지역: {region}
카테고리(힌트): {category_hint}
사용자 입력: {user_input}

아래는 Google Places API로 조회한 상위 5개 후보 장소 목록입니다:
{shopping_list_text}

요구사항:
- 한국어로 3~5문장 정도의 자연스럽고 친절한 추천 멘트를 작성하세요.
- 여러 후보 중 2~4곳 정도를 골라 각 가게의 특징(위치, 품목 다양성, 가격대, 체인/동네 가게 느낌 등)을 짧게 언급하세요.
- 사용자가 어떤 상황에서 이용하기 좋은지 맥락을 짚어주세요.
"""
    try:
        response = llm.invoke(prompt)
        return response.content
    except Exception as e:
        print(f"[Shopping Recommend] LLM 호출 실패: {e}")
        return f"{region} {category_hint} 추천 장소입니다.\n{shopping_list_text}"
