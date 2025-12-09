"""Dessert/Cafe Tools - 4개 핵심 기능"""
from langchain.tools import tool
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# ========================================
# Tool 1: TOP 5 카페 통합 리포트
# ========================================
@tool
def recommend_top_5_desserts_tool(region: str, keyword: str = "카페", persona_data: Optional[dict] = None) -> str:
    """
    주변 카페/디저트 맛집을 검색하고, 평점과 리뷰를 분석해 
    가장 좋은 'TOP 5' 곳의 상세 리포트를 보여줍니다.
    """
    logger.info(f"🍰 TOP 5 카페 검색: {region}")
    
    try:
        from ..dessert_agent import search_desserts_integrated, generate_korean_ux_report
        from schemas.data_models import UserPersona
        
        persona = UserPersona(**persona_data) if persona_data else None
        
        # 1. 검색
        search_result = search_desserts_integrated(region, keyword, num_results=5, persona=persona)
        
        if not search_result.success:
            return f"검색 실패: {search_result.error}"
        
        # 2. 상위 5개 리포트 생성
        cafes = search_result.data[:5]
        reports = []
        
        for i, cafe in enumerate(cafes, 1):
            reports.append(f"{i}. {cafe['name']} (⭐{cafe['rating']}, 리뷰 {cafe['review_count']}개)")
            reports.append(f"   주소: {cafe['address']}")
            reports.append(f"   [지도]({cafe['google_maps_url']})\n")
        
        return "\n".join(reports)
        
    except Exception as e:
        return f"오류: {e}"


# ========================================
# Tool 2: 카페 리스트 간단 검색
# ========================================
@tool
def search_cafe_list_tool(region: str, keyword: str = "카페", num_results: int = 5) -> str:
    """
    상세 분석 없이 카페 리스트만 빠르게 검색합니다.
    """
    logger.info(f"🍰 카페 리스트 검색: {region} - {keyword}")
    
    try:
        from ..dessert_agent import search_desserts_integrated
        
        result = search_desserts_integrated(region, keyword, num_results=min(num_results, 10))
        
        if not result.success:
            return f"검색 실패: {result.error}"
        
        cafes_text = []
        for i, place in enumerate(result.data, 1):
            cafes_text.append(
                f"{i}. {place['name']} - ⭐{place['rating']} (리뷰 {place['review_count']}개)\n"
                f"   주소: {place['address']}"
            )
        
        return "\n\n".join(cafes_text)
        
    except Exception as e:
        return f"오류: {e}"


# ========================================
# Tool 3: 특정 카페 상세 분석
# ========================================
@tool
def analyze_cafe_detail_tool(place_id: str, persona_data: Optional[dict] = None) -> str:
    """
    특정 카페의 place_id를 입력하면 해당 카페만 상세 분석합니다.
    """
    logger.info(f"🍰 카페 상세 분석: {place_id}")
    
    try:
        from ..dessert_agent import generate_korean_ux_report
        from schemas.data_models import UserPersona
        
        persona = UserPersona(**persona_data) if persona_data else None
        result = generate_korean_ux_report(place_id, persona)
        
        if not result.success:
            return f"분석 실패: {result.error}"
        
        return result.data[0].get('formatted_report', '리포트 생성 실패')
        
    except Exception as e:
        return f"오류: {e}"


# ========================================
# Tool 4: 지역별 카페 가격 분석
# ========================================
@tool
def analyze_cafe_price_tool(region: str, menu_type: str = "커피") -> str:
    """
    특정 지역의 카페 메뉴 가격대를 분석합니다.
    """
    logger.info(f"🍰 가격 분석: {region} - {menu_type}")
    
    try:
        from ..dessert_agent import get_cafe_price_analysis
        
        result = get_cafe_price_analysis(region, menu_type)
        
        if not result.success:
            return f"분석 실패: {result.error}"
        
        return result.data[0].get('price_report', '가격 정보 없음')
        
    except Exception as e:
        return f"오류: {e}"
