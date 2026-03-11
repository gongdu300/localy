from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import os

router = APIRouter(prefix="/api/search", tags=["search"])

class LandmarkImageRequest(BaseModel):
    destination: str

class LandmarkImageResponse(BaseModel):
    image_url: str

@router.post("/landmark-image", response_model=LandmarkImageResponse)
async def search_landmark_image(request: LandmarkImageRequest):
    """
    여행지명으로 랜드마크 이미지를 검색하여 URL을 반환합니다.
    Unsplash API를 사용합니다.
    """
    try:
        # Unsplash Access Key (환경변수에서 가져오기)
        access_key = os.getenv("UNSPLASH_ACCESS_KEY", "IOWPEai9OlSZqO6Oq-FMyp48C_DnMU159_k75kJRxaQ")
        
        # Unsplash API 호출 - 다단계 검색 전략
        async with httpx.AsyncClient() as client:
            search_queries = [
                f"{request.destination} South Korea cityscape",  # 1차: 구체적 지역 + 도시 풍경
                f"{request.destination} Korea",  # 2차: 지역명 + 한국
                "South Korea travel cityscape",  # 3차: 한국 여행 일반
                "Korea city landscape"  # 4차: 한국 도시 풍경
            ]
            
            for query in search_queries:
                try:
                    response = await client.get(
                        "https://api.unsplash.com/search/photos",
                        params={
                            "query": query,
                            "per_page": 1,
                            "orientation": "landscape"
                        },
                        headers={"Authorization": f"Client-ID {access_key}"}
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("results") and len(data["results"]) > 0:
                            image_url = data["results"][0]["urls"]["regular"]
                            print(f"✅ Found image with query: {query}")
                            return LandmarkImageResponse(image_url=image_url)
                except Exception as e:
                    print(f"Error with query '{query}': {e}")
                    continue
            
            # 모든 검색 실패 시 빈 문자열 반환
            print(f"❌ No images found for destination: {request.destination}")
            return LandmarkImageResponse(image_url="")
            
    except Exception as e:
        print(f"Error searching landmark image: {e}")
        # 에러 발생 시 빈 문자열 반환 (gradient 사용하도록)
        return LandmarkImageResponse(image_url="")
