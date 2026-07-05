import loguru
from fastapi import APIRouter, HTTPException

from app.schemas.analysis import ReviewSummaryRequest, ReviewSummaryResponse
from app.services.review_service import review_service

logger = loguru.logger
router = APIRouter()


@router.post("/summarize", response_model=ReviewSummaryResponse)
async def summarize_reviews(request: ReviewSummaryRequest):
    """화장실 리뷰를 AI로 한 줄 요약합니다."""
    try:
        result = await review_service.summarize(request)
        return result
    except Exception as e:
        logger.error(f"Failed to summarize reviews for toilet {request.toiletId}: {e}")
        raise HTTPException(status_code=500, detail="AI 리뷰 요약 생성 실패")
