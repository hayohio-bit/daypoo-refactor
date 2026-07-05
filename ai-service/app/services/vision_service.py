import base64
import json
from openai import OpenAI
from app.core.config import settings
from app.schemas.analysis import PoopAnalysisResult
import loguru

logger = loguru.logger

class VisionService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    async def analyze_poop_image(self, image_bytes: bytes) -> PoopAnalysisResult:
        """
        AI Vision 파이프라인: 이미지를 분석하여 브리스톨 척도 및 건강 지표 추출
        (In-memory Byte Array 기반 처리)
        """
        logger.info("Starting AI Vision analysis for poop image...")
        
        # OpenAI API는 base64를 요구하므로 필요한 시점에만 인코딩 (물리 저장 없음)
        base64_image = base64.b64encode(image_bytes).decode("utf-8")

        prompt = """
        You are a professional medical assistant specialized in digestive health.

        ### STEP 1: IMAGE VALIDATION
        First, determine if the provided image contains a human stool.
        - If the image is NOT a stool (e.g., food, landscape, person, object, or blank/noisy), set:
            is_poop: false
            bristol_scale: null
            color: null
            shape_description: null
            health_score: null
            ai_comment: "똥 사진이 아닌 것 같아요! 변기 안의 변을 촬영해주세요."
            warning_tags: []
        - If it IS a stool image, set is_poop: true and proceed to STEP 2.

        ### STEP 2: STOOL ANALYSIS (only when is_poop is true)
        Analyze the image and extract the following in JSON format:
        1. is_poop: true
        2. bristol_scale: Integer from 1 to 7 based on the Bristol Stool Chart.
        3. color: The dominant color (e.g., Brown, Yellow, Green, Black, Red-ish).
        4. shape_description: A brief clinical description of the shape.
        5. health_score: An overall health score from 0 to 100.
        6. ai_comment: A friendly but professional comment for the user in Korean.
        7. warning_tags: A list of any concerning signs (e.g., 'Blood', 'Mucus', 'Very hard'). If none, return an empty list.

        Output must be valid JSON only.
        """

        try:
            response = self.client.beta.chat.completions.parse(
                model=settings.MODEL_NAME,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
                            },
                        ],
                    }
                ],
                response_format=PoopAnalysisResult,
                max_tokens=1000,
            )

            result = response.choices[0].message.parsed
            logger.info(f"Analysis complete: Bristol Scale {result.bristol_scale}")
            return result

        except Exception as e:
            logger.error(f"Error during AI Vision analysis: {str(e)}")
            raise e

vision_service = VisionService()
