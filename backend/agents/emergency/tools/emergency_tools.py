"""Emergency Tools - 3개 핵심 기능 (Google Places만 사용)"""
from langchain.tools import tool
import logging

logger = logging.getLogger(__name__)

# ========================================
# Tool 1: 통합 긴급정보
# ========================================
@tool
def get_emergency_info_tool(region: str) -> str:
    """
    지역 이름을 입력받아 긴급 시설(병원, 약국) 정보를 제공합니다.
    (재난/날씨 API 키 없음으로 일부 기능 제한)
    """
    logger.info(f"🚨 긴급정보 조회: {region}")
    
    try:
        from ..emergency_agent import find_emergency_services
        
        result = find_emergency_services(region)
        
        if not result.success:
            return f"조회 실패: {result.error}"
        
        # 결과 포맷팅
        data = result.data[0]
        output = []
        
        output.append(f"📍 {region} 긴급 시설 정보\n")
        
        # 병원
        if data.get('hospitals'):
            output.append("🏥 병원:")
            for h in data['hospitals'][:3]:
                output.append(f"  - {h['name']}")
                output.append(f"    주소: {h.get('address', '정보없음')}")
        
        # 약국
        if data.get('pharmacies'):
            output.append("\n💊 약국:")
            for p in data['pharmacies'][:3]:
                output.append(f"  - {p['name']}")
                output.append(f"    주소: {p.get('address', '정보없음')}")
        
        return "\n".join(output)
        
    except Exception as e:
        return f"오류: {e}"


# ========================================
# Tool 2: 응급 상황 대응
# ========================================
@tool
def handle_emergency_situation_tool(situation_type: str, current_location: str) -> str:
    """
    응급 상황(부상, 사고 등) 시 가장 가까운 시설(병원/경찰서/소방서)과 이동 경로를 안내합니다.
    situation_type: injury(부상), fire(화재), crime(범죄) 등
    """
    logger.info(f"🚨 응급 상황: {situation_type} at {current_location}")
    
    try:
        import googlemaps
        import os
        
        gmaps = googlemaps.Client(key=os.getenv("GOOGLE_PLACES_API_KEY"))
        
        # 위치 검색
        geocode = gmaps.geocode(f"{current_location}, 대한민국", language="ko")
        if not geocode:
            return "위치를 찾을 수 없습니다. 정확한 지역명을 입력하세요."
        
        coords = geocode[0]['geometry']['location']
        origin = (coords['lat'], coords['lng'])
        
        # 상황별 타겟
        if situation_type in ["injury", "health", "medical"]:
            target_type = "hospital"
            target_name = "응급실/병원"
            emergency_call = "119"
            priority = "🚨 119 구급차 요청!"
        elif situation_type in ["fire", "burn"]:
            target_type = "fire_station"
            target_name = "소방서"
            emergency_call = "119"
            priority = "🔥 119 신고 후 대피!"
        elif situation_type in ["crime", "theft", "assault"]:
            target_type = "police"
            target_name = "경찰서"
            emergency_call = "112"
            priority = "🚔 112 신고!"
        else:
            target_type = "hospital"
            target_name = "병원"
            emergency_call = "119/112"
            priority = "🚨 긴급 전화 이용!"
        
        # 시설 검색
        results = gmaps.places_nearby(location=origin, radius=5000, type=target_type, language="ko")
        
        if not results['results']:
            return f"{priority}\n반경 5km 내 {target_name} 없음. {emergency_call}로 즉시 연락하세요!"
        
        # 가장 가까운 시설
        nearest = results['results'][0]
        name = nearest['name']
        address = nearest.get('vicinity', '정보없음')
        
        # 경로 계산
        dest = (nearest['geometry']['location']['lat'], nearest['geometry']['location']['lng'])
        directions = gmaps.directions(origin, dest, mode="driving", language="ko")
        
        if directions:
            leg = directions[0]['legs'][0]
            distance = leg['distance']['text']
            duration = leg['duration']['text']
        else:
            distance = "?"
            duration = "?"
        
        output = [
            priority,
            f"\n📞 긴급 전화: {emergency_call}",
            f"\n🏥 가장 가까운 {target_name}: {name}",
            f"📍 주소: {address}",
            f"🚗 차량: {distance} (약 {duration})",
            f"\n[길 안내 시작](https://www.google.com/maps/dir/?api=1&destination={name}&destination_place_id={nearest['place_id']}&travelmode=driving)"
        ]
        
        return "\n".join(output)
        
    except Exception as e:
        return f"오류: {e}\n응급 상황이므로 119/112로 즉시 신고하세요!"


# ========================================
# Tool 3: 여행 위험도 평가 (간단 버전)
# ========================================
@tool
def assess_travel_safety_tool(destination: str) -> str:
    """
    목적지의 기본적인 안전 정보를 평가합니다.
    (날씨/재난 API 없으므로 시설 접근성만 평가)
    """
    logger.info(f"🚨 여행 안전 평가: {destination}")
    
    try:
        from ..emergency_agent import find_emergency_services
        
        result = find_emergency_services(destination)
        
        if not result.success:
            return f"평가 실패: {result.error}"
        
        data = result.data[0]
        
        hospital_count = len(data.get('hospitals', []))
        pharmacy_count = len(data.get('pharmacies', []))
        
        total_facilities = hospital_count + pharmacy_count
        
        if total_facilities >= 10:
            safety_level = "✅ 안전 (긴급 시설 충분)"
        elif total_facilities >= 5:
            safety_level = "⚠️ 보통 (긴급 시설 보통)"
        else:
            safety_level = "🚨 주의 (긴급 시설 부족)"
        
        return f"{destination} 안전도: {safety_level}\n병원 {hospital_count}개, 약국 {pharmacy_count}개"
        
    except Exception as e:
        return f"오류: {e}"
