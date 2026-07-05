from typing import List, Optional

from pydantic import BaseModel, Field


class PoopAnalysisRequest(BaseModel):
    image_url: str = Field(..., description="Base64 encoded image or public URL")


class PoopAnalysisResult(BaseModel):
    is_poop: bool = Field(..., description="Whether the image contains a stool")
    bristol_scale: Optional[int] = Field(None, ge=1, le=7, description="Bristol stool scale (1-7), null if is_poop=false")
    color: Optional[str] = Field(None, description="Dominant color of the stool, null if is_poop=false")
    shape_description: Optional[str] = Field(None, description="Detailed description of the shape, null if is_poop=false")
    health_score: Optional[int] = Field(
        None, ge=0, le=100, description="Overall health score for this sample, null if is_poop=false"
    )
    ai_comment: str = Field(..., description="Brief AI feedback for the user")
    warning_tags: List[str] = Field(
        default_factory=list,
        description="Health warning tags if any (e.g., 'Blood detected', 'Dehydration')",
    )


class PooRecordData(BaseModel):
    bristolScale: int
    color: str
    conditionTags: Optional[str] = None
    dietTags: Optional[str] = None
    createdAt: str


class HealthReportRequest(BaseModel):
    userId: str
    reportType: str
    records: List[PooRecordData]
    isPremium: bool = False


class HealthReportResponse(BaseModel):
    reportType: str
    healthScore: int
    summary: str
    solution: str
    premiumSolution: Optional[str] = None
    insights: List[str]
    analyzedAt: str


class WeeklySummaryData(BaseModel):
    weekNumber: int  # 1~4
    recordCount: int
    avgBristolScale: float
    healthyRatio: int  # %
    topDietTags: str  # 예: "현미밥,닭가슴살,야채"
    topConditionTags: str  # 예: "정상,피로"


class HealthReportMonthlyRequest(BaseModel):
    userId: str
    reportType: str  # "MONTHLY"
    weeklySummaries: List[WeeklySummaryData]
    isPremium: bool = False


class ReviewSummaryRequest(BaseModel):
    toiletId: int
    toiletName: str
    reviews: List[str]


class ReviewSummaryResponse(BaseModel):
    summary: str
