from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.analysis import PoopAnalysisResult
from app.services.vision_service import vision_service

router = APIRouter()


@router.post("/analyze", response_model=PoopAnalysisResult)
async def analyze_poop(image_file: UploadFile = File(...)):
    """
    배변 분석 API: 이미지를 직접(Multipart) 받아 AI 분석 결과를 반환합니다.
    (In-memory Byte Array 기반 처리)
    """
    try:
        # 파일 내용을 메모리(bytes)로 직접 읽음 (물리 저장 없음)
        contents = await image_file.read()

        # Byte Array를 서비스 레이어로 직접 전달
        result = await vision_service.analyze_poop_image(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
