"""여행지 사진 갤러리용 LangChain Tool 모듈"""

import os
from typing import Dict, List, Any

import requests
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

load_dotenv()

# LLM (사진 설명 멘트용)
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)

# Tavily API 키
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

def _web_search_images(place_name: str, max_results: int = 10) -> List[str]:
    """
    Tavily API를 사용하여 장소 이미지 검색
    """
    if not TAVILY_API_KEY:
        print("❌ TAVILY_API_KEY가 설정되지 않았습니다.")
        return []

    try:
        url = "https://api.tavily.com/search"

        payload = {
            "api_key": TAVILY_API_KEY,
            "query": f"{place_name} 풍경 사진",
            "search_depth": "basic",
            "include_images": True,
            "max_results": 5,
        }

        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()

        images = data.get("images", [])

        # 중복 제거 및 HTTPS만 허용
        image_urls: List[str] = []
        seen = set()

        for img_url in images[:max_results]:
            if img_url.startswith("https://") and img_url not in seen:
                image_urls.append(img_url)
                seen.add(img_url)

        print(f"✅ {place_name}: {len(image_urls)}개 이미지 발견")
        return image_urls

    except requests.exceptions.Timeout:
        print(f"⏱️ Tavily API 타임아웃: {place_name}")
        return []
    except requests.exceptions.RequestException as e:
        print(f"❌ Tavily API 오류: {e}")
        return []

def _build_photo_gallery(region: str) -> Dict[str, object]:
    """
    지역명을 기반으로 갤러리 생성
    """
    print(f"[Photo Gallery Tool] '{region}' 지역 사진 검색 시작")

    # 1. LLM에게 대표 관광지 최대 5개 요청
    landmark_prompt = f"""
너는 한국 여행 가이드다.

'{region}' 지역에서 한국인과 관광객이 많이 찾는 대표 관광지 이름을 최대 5개 골라라.

출력 형식:
각 줄에 관광지 이름만 한 줄씩 출력해라.
번호, 불릿, 설명, 따옴표, 기타 텍스트는 절대 쓰지 마라.

예시:
경포대
경포해변
오죽헌
"""

    try:
        lm_resp = llm.invoke(landmark_prompt)
        raw_lines = lm_resp.content.strip().splitlines()

        landmarks: List[str] = []
        for line in raw_lines:
            name = (
                line.strip()
                .lstrip("-•*·")
                .lstrip("0123456789. ")
                .strip()
            )
            if name:
                landmarks.append(name)

        # 중복 제거 + 최대 5개
        seen = set()
        unique_landmarks = []
        for name in landmarks:
            if name not in seen:
                unique_landmarks.append(name)
                seen.add(name)
        landmarks = unique_landmarks[:5]

    except Exception as e:
        print(f"❌ 관광지 LLM 추출 실패: {e}")
        return {
            "gallery_results": {},
            "final_response": f"'{region}' 지역의 대표 관광지를 불러오는 데 실패했습니다.",
        }

    if not landmarks:
        return {
            "gallery_results": {},
            "final_response": f"'{region}' 지역의 대표 관광지를 찾지 못했습니다.",
        }

    # 2. 각 관광지별 이미지 검색 (관광지당 최대 5장)
    all_images: Dict[str, List[str]] = {}

    for landmark in landmarks:
        query_name = f"{region} {landmark}"  # 지역 + 관광지로 검색 정확도↑
        images = _web_search_images(query_name, max_results=5)
        if images:
            all_images[landmark] = images

    if not all_images:
        return {
            "gallery_results": {},
            "final_response": f"'{region}' 지역의 관광지 사진을 찾지 못했습니다. 🔍",
        }

    # 3. GPT로 요약 멘트 생성
    places_list = ", ".join(all_images.keys())
    total_images = sum(len(imgs) for imgs in all_images.values())

    summary_prompt = f"""
'{region}' 지역의 대표 관광지 {places_list}에 대한 사진 {total_images}장을 찾았다.

사용자에게 이 지역을 소개하는 한국어 문장 2~3문장을 작성해라.
각 관광지의 분위기나 특징을 간단히 언급해라.
너 자신을 설명하지 말고, 바로 설명만 써라.
"""

    try:
        response = llm.invoke(summary_prompt)
        recommendation = response.content
    except Exception as e:
        print(f"GPT 응답 생성 실패: {e}")
        recommendation = f"{region} 지역의 대표 관광지 {places_list} 사진 {total_images}장을 찾았습니다! 📸"

    print(f"[Photo Gallery Tool] 검색 완료: {len(all_images)}개 관광지")

    return {
        "gallery_results": all_images,
        "final_response": recommendation,
    }

@tool
def photo_gallery_tool(region: str) -> Dict[str, object]:
    """
    지역명을 입력으로 받아,
    1) LLM으로 해당 지역 대표 관광지 최대 5개를 뽑고
    2) 각 관광지별로 Tavily를 통해 사진 최대 5개씩 찾는 사진 갤러리 툴.
    """
    return _build_photo_gallery(region)
