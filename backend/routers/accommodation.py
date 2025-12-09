from fastapi import APIRouter, HTTPException
from typing import Optional
from schemas.data_models import AgentResponse
from agents.accommodation.accommodation_agent import agent as accommodation_agent
from pydantic import BaseModel

router = APIRouter(
    prefix="/agents/accommodation",
    tags=["accommodation_agent"],
    responses={404: {"description": "Not found"}},
)

# 요청 스키마
class AccommodationSearchRequest(BaseModel):
    region: str
    preference: Optional[str] = None
    num_results: int = 10
    min_rating: Optional[float] = None
    price_level: Optional[int] = None
    sort_by: str = "rating"

class ReviewSummaryRequest(BaseModel):
    place_id: str
    user_id: Optional[str] = None

class PriceComparisonRequest(BaseModel):
    place_name: str
    check_in: str  # YYYY-MM-DD
    check_out: str  # YYYY-MM-DD
    num_guests: int = 2
    location: str = "서울"

class RecommendationRequest(BaseModel):
    region: str
    user_preference: str
    num_results: int = 3

@router.post("/search")
async def search_accommodation_endpoint(request: AccommodationSearchRequest):
    """숙소 검색"""
    try:
        result = accommodation_agent.search(
            region=request.region,
            preference=request.preference,
            num_results=request.num_results,
            min_rating=request.min_rating,
            price_level=request.price_level,
            sort_by=request.sort_by
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reviews")
async def summarize_reviews_endpoint(request: ReviewSummaryRequest):
    """리뷰 AI 요약"""
    try:
        result = accommodation_agent.get_reviews(
            place_id=request.place_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/prices")
async def compare_prices_endpoint(request: PriceComparisonRequest):
    """가격 비교 (병렬 처리)"""
    try:
        result = accommodation_agent.compare_prices(
            place_name=request.place_name,
            check_in=request.check_in,
            check_out=request.check_out,
            num_guests=request.num_guests,
            location=request.location
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommend")
async def recommend_accommodation_endpoint(request: RecommendationRequest):
    """AI 맞춤 추천"""
    try:
        result = accommodation_agent.recommend(
            region=request.region,
            user_preference=request.user_preference,
            num_results=request.num_results
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
