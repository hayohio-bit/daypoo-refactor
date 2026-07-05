import loguru
from openai import OpenAI

from app.core.config import settings
from app.schemas.analysis import ReviewSummaryRequest, ReviewSummaryResponse

logger = loguru.logger


class ReviewService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    async def summarize(self, request: ReviewSummaryRequest) -> ReviewSummaryResponse:
        """최근 리뷰들을 바탕으로 화장실 한 줄 요약 생성"""
        logger.info(f"Generating review summary for toilet {request.toiletId} ({request.toiletName})")

        reviews_text = "\n".join(f"- {r}" for r in request.reviews if r)
        if not reviews_text.strip():
            return ReviewSummaryResponse(summary="리뷰 내용이 없습니다.")

        prompt = f"""다음은 '{request.toiletName}' 화장실에 대한 최근 리뷰들입니다:

{reviews_text}

위 리뷰들을 종합하여 이 화장실의 특징을 한 줄(30자 이내)로 요약해주세요.
청결도, 편의시설, 접근성 등 핵심 특징을 간결하게 표현해주세요.
요약만 출력하세요. 따옴표나 부가 설명 없이 요약 문장만 작성하세요."""

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "당신은 화장실 리뷰를 간결하게 요약하는 전문가입니다."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=100,
            temperature=0.3,
        )

        summary = response.choices[0].message.content.strip()
        logger.info(f"Review summary for toilet {request.toiletId}: {summary}")
        return ReviewSummaryResponse(summary=summary)


review_service = ReviewService()
