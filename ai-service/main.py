from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import analysis, report, review
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Python AI Service for Poop Analysis & Reports",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(analysis.router, prefix=f"{settings.API_V1_STR}/analysis", tags=["analysis"])
app.include_router(report.router, prefix=f"{settings.API_V1_STR}/report", tags=["report"])
app.include_router(review.router, prefix=f"{settings.API_V1_STR}/review", tags=["review"])

@app.get("/")
async def root():
    return {"message": "Welcome to DayPoo AI Service API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
