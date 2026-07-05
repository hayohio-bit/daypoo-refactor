import json

import loguru
from fastapi import APIRouter, HTTPException

from app.schemas.analysis import (
    HealthReportMonthlyRequest,
    HealthReportRequest,
    HealthReportResponse,
)
from app.services.report_service import report_service

logger = loguru.logger
router = APIRouter()


@router.post("/generate", response_model=HealthReportResponse)
async def generate_report(request: HealthReportRequest):
    """
    AI 건강 리포트 생성 API: 유저 ID와 데이터 리스트를 받아 분석 후 결과를 요약합니다.
    (백엔드에서 캐시링 및 최신성 검사를 수행하므로 여기서는 캐시를 사용하지 않습니다.)
    """
    try:
        # AI 호출 및 보고서 생성 (DAILY/WEEKLY)
        report = await report_service.generate_health_report(request)
        return report

    except Exception as e:
        logger.error(f"Failed to generate health report in endpoint: {str(e)}")
        raise HTTPException(
            status_code=500, detail="건강 리포트 생성 중 오류가 발생했습니다."
        )


@router.post("/generate/monthly", response_model=HealthReportResponse)
async def generate_monthly_report(request: HealthReportMonthlyRequest):
    """
    AI MONTHLY 건강 리포트 생성 API: 주차별 요약 데이터를 받아 분석 후 결과를 요약합니다.
    (백엔드에서 캐시링 및 최신성 검사를 수행하므로 여기서는 캐시를 사용하지 않습니다.)
    """
    try:
        # AI 호출 및 월간 보고서 생성
        report = await report_service.generate_monthly_report(request)
        return report

    except Exception as e:
        logger.error(f"Failed to generate monthly health report in endpoint: {str(e)}")
        raise HTTPException(
            status_code=500, detail="MONTHLY 건강 리포트 생성 중 오류가 발생했습니다."
        )
