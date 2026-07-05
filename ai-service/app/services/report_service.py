import json
from datetime import datetime

import loguru
from openai import OpenAI

from app.core.config import settings
from app.schemas.analysis import (
    HealthReportMonthlyRequest,
    HealthReportRequest,
    HealthReportResponse,
)

logger = loguru.logger


class ReportService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate_health_report(
        self, request: HealthReportRequest
    ) -> HealthReportResponse:
        """
        누적된 배변 데이터를 바탕으로 AI 건강 리포트 생성 (DAILY/WEEKLY)
        """
        logger.info(
            f"Generating health report for user {request.userId} ({request.reportType})..."
        )

        # 기록 데이터를 텍스트로 변환하여 프롬프트 구성
        records_summary = "\n".join(
            [
                f"- Data: {r.createdAt}, Bristol Scale: {r.bristolScale}, Color: {r.color}, Tags: {r.conditionTags or ''}/{r.dietTags or ''}"
                for r in request.records
            ]
        )

        if request.reportType == "DAILY":
            focus_instruction = """
            분석 초점 (오늘의 상태):
            - 오늘의 배변 기록을 통해 현재 장 컨디션과 특징을 명확히 파악
            - 내일 당장 실천 가능한 1~2가지 구체적 개선 행동 제안
            - summary: "오늘 장 상태는..." 으로 시작하여 현재 시제로 서술하세요.
            - insights: "오늘은 ~했습니다" 형식으로 3~4개를 리스트로 작성하세요.
            """
        else:
            focus_instruction = """
            분석 초점 (7일 스냅샷):
            - 지난 7일간 지배적인 배변 패턴과 이상 징후 명확히 파악
            - 오늘 당장 실천 가능한 1~2가지 구체적 개선 행동 제안
            - summary: "이번 주 장 상태는..." 으로 시작하여 현재 시제로 서술하세요.
            - insights: "이번 주에 ~했습니다" 형식으로 3~4개를 리스트로 작성하세요.
            """

        # 등급별 차별화 지침
        if request.isPremium:
            if request.reportType == "DAILY":
                premium_instruction = """
                - [PREMIUM 전용 (내일 한정)]: 'premiumSolution'의 첫 줄을 반드시 "### 🩺 내일의 핀포인트 식사"로 시작하세요.
                - **[표 레이아웃 지침]:** 오직 내일 하루의 아침/점심/저녁 식단을 단일 표(Table)로 작성하세요. (열: 끼니, 추천 메뉴, 영양학적 핵심 근거)
                - **[중요 - 표 깨짐 방지]:** 표의 칸 안에서는 절대로 '불렛포인트(-)', '파이프(|)', 또는 '줄바꿈'을 사용하지 마세요. 메뉴가 여러 개라면 쉼표(,)로 구분하여 한 줄로 나열하세요.
                - '영양학적 핵심 근거'는 반드시 10단어 내외의 한 문장으로 아주 짧게 기술하세요.
                """
            else:
                premium_instruction = """
                - [PREMIUM 전용 (주간 트렌드)]: 'premiumSolution'의 첫 줄을 반드시 "### 📊 향후 7일간의 체계적인 전략 스케줄"로 시작하세요. ('전략' 키워드가 반드시 포함되어야 합니다.)
                - 지난 기간의 데이터를 종합하여 **향후 7일간의 전체적인 식단 스케줄**과 금지 식품 리스트를 표(Table)와 상세 설명으로 작성하세요.
                """
        else:
            premium_instruction = """
            - [PRO 전용 (식단 추천 금지)]: 'solution' 필드에는 운동, 수면 등 일반적인 생활 습관 개선안만 포함하고, 구체적인 식재료나 식단 추천은 절대로 포함하지 마십시오. 'premiumSolution' 필드는 비워두세요.
            """

        # 데이터 부족 시나리오 (신규 유저) 대응
        is_new_user = len(request.records) < 5
        data_shortage_instruction = ""
        if is_new_user:
            if request.reportType == "DAILY":
                data_shortage_instruction = """
                - [신규 사용자 대응]: 기록이 아직 많지 않지만, 오늘 남겨주신 소중한 한 건의 데이터를 바탕으로 내일 당장 실천할 수 있는 가장 중요한 팁을 정교하게 제안하세요. (오늘 하루에 집중하세요)
                """
            else:
                data_shortage_instruction = """
                - [신규 사용자 대응]: 데이터가 충분하지 않으므로, 지금까지의 기록을 축하하고 앞으로의 7일간 관찰 포인트 위주로 서술하세요. (주간/월간 관점 유지)
                """

        prompt = f"""
        당신은 소화기 건강 전문 AI 분석가입니다. 사용자의 최근 배변 기록을 분석하여 전문적인 건강 리포트를 작성해주세요.

        [중요: 실천 가능한 한국 식생활 가이드라인]
        - **대한민국 가정이나 마트(이마트, 컬리 등)에서 흔히 접할 수 있는 식재료를 기반으로 메뉴를 제안하세요.**
        - 한식(K-Food)을 기본(약 70%)으로 하되, 샌드위치, 샐러드, 파스타와 같은 서구식/글로벌 메뉴(약 30%)도 한국인의 입맛에 친숙하고 재료 수급이 쉬운 것이라면 포함할 수 있습니다.
        - 구하기 힘든 고가의 슈퍼푸드보다는 두부, 나물, 제철 채소, 달걀, 닭가슴살 등 접근성이 좋은 재료를 활용하여 현실적이고 풍성하게 구성하세요.

        [분석 데이터 - 리포트 타입: {request.reportType}, 플랜: {"PREMIUM" if request.isPremium else "PRO"}]
        {records_summary}

        {focus_instruction}
        {premium_instruction}
        {data_shortage_instruction}

        분석 시 다음 사항을 고려하세요:
        1. 배변 형태(Bristol Scale)의 변화 추이
        2. 식단 태그와 배변 결과 사이의 상관관계
        3. 전반적인 건강 점수 (0-100점)

        응답은 반드시 유효한 JSON 형태여야 하며, 다음 필드를 포함해야 합니다:
        - reportType: "{request.reportType}"
        - healthScore: 분석된 건강 점수 (정수)
        - summary: 현재 상태에 대한 2~3문장의 요약 (한국어)
        - solution: 건강 개선을 위한 일반적인 생활 가이드 (한국어)
        - premiumSolution: [PREMIUM 전용] 정밀 영양 분석 및 상세 식단표 (마크다운 포함 가능, 한국어)
        - insights: 데이터에서 발견된 주요 통계 및 인사이트 리스트 (한국어)
        - analyzedAt: "{datetime.now().isoformat()}"
        """

        try:
            response = self.client.beta.chat.completions.parse(
                model=settings.MODEL_NAME,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional medical health analyst who provides data-driven gastrointestinal health reports.",
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format=HealthReportResponse,
            )

            result = response.choices[0].message.parsed
            logger.info("Health report generation complete.")
            return result

        except Exception as e:
            logger.error(f"Error during health report generation: {str(e)}")
            raise e

    async def generate_monthly_report(
        self, request: HealthReportMonthlyRequest
    ) -> HealthReportResponse:
        """
        4주 요약 데이터를 바탕으로 MONTHLY 건강 리포트 생성
        """
        logger.info(f"Generating MONTHLY health report for user {request.userId}...")

        # 4주 요약 데이터를 텍스트로 변환 (압축된 전송)
        summaries_text = "\n".join(
            [
                f"- {s.weekNumber}주차: {s.recordCount}건, Bristol 평균 {s.avgBristolScale}, "
                f"건강배변 {s.healthyRatio}%, 주요 식단: {s.topDietTags}, 주요 컨디션: {s.topConditionTags}"
                for s in request.weeklySummaries
            ]
        )

        # 등급별 차별화 지침
        if request.isPremium:
            premium_instruction = """
            - [PREMIUM 전용]: 'premiumSolution'의 첫 줄을 반드시 "### 📅 월간 정밀 트렌드 진단"으로 시작하세요. ('정밀', '진단' 키워드가 반드시 포함되어야 합니다.)
            - **'주차별 상세 분석' 파트는 반드시 마크다운 표(Table) 형식을 활용하세요.** (열: 주차, 변화 추이/상태 요약, 주요 지표(BS/건강%), 식단 피드백)
            - **'장기 맞춤 영양 솔루션' 파트 또한 가독성을 위해 마크다운 표(Table)를 활용하여 목표와 실천 방안을 제시하세요.** (열: 목표 분야, 실천 방안, 기대 효과)
            - 제목(#), 강조(**), 표(|) 등 마크다운의 모든 기능을 풍성하게 활용하여 '전문 건강 검진 결과지' 느낌을 주어야 합니다. 한식(K-Food) 권장 사항도 잊지 마세요.
            """
        else:
            premium_instruction = """
            - [PRO 전용 (식단 추천 금지)]: 'solution' 필드에는 장기적인 생활 습관 가이드만 포함하고, 특정 식단이나 음식 추천은 절대로 포함하지 마십시오. 'premiumSolution' 필드는 비워두세요.
            """

        total_records = sum(s.recordCount for s in request.weeklySummaries)
        data_shortage_instruction = ""
        if total_records < 10:
            data_shortage_instruction = """
            - [신규 사용자 대응]: 가입 초기라 한 달치 데이터가 부족하므로, 현재까지의 기록을 기반으로 한 달간의 시작을 응원하고 '앞으로 한 달간 앱 기록을 통해 얻을 수 있는 가치'를 강조하세요.
            """

        prompt = f"""
        당신은 소화기 건강 전문 AI 분석가입니다. 사용자의 지난 한 달간의 주차별 요약 데이터를 분석하여 전문적인 트렌드 리포트를 작성해주세요.

        [중요: 실천 가능한 한국 식생활 가이드라인]
        - **장기적인 건강 관리를 위해 대한민국 가구에서 매우 친숙하고 마트(이마트, 컬리 등)에서 구하기 쉬운 식재료를 사용하세요.**
        - 한식(K-Food)을 기본으로 하되, 샌드위치, 샐러드, 파스타와 같이 한국인의 일상에 완전히 자리 잡은 서구식/글로벌 메뉴도 적절히 혼합하여 질리지 않는 건강 식단을 구성하세요.

        [분석 데이터 - 4주차 요약, 플랜: {"PREMIUM" if request.isPremium else "PRO"}]
        {summaries_text}

        분석 초점 (30일 트렌드):
        - 주차별 변화를 비교하여 개선/악화 방향성 제시
        - 식단 태그와 배변 결과의 반복 상관관계 발견
        - 다음 달을 위한 지속 가능한 장기 목표 2~3가지
        {premium_instruction}
        {data_shortage_instruction}
        - summary: "지난 한 달간 트렌드를 보면..." 으로 시작하여 거시적인 관점에서 서술하세요.
        - insights: "~하는 경향이 있습니다" 패턴 서술 형식으로 4~5개를 리스트로 작성하세요.

        응답은 반드시 유효한 JSON 형태여야 하며, 다음 필드를 포함해야 합니다:
        - reportType: "MONTHLY"
        - healthScore: 한 달간의 평균적인 건강 상태를 반영한 점수 (정수)
        - summary: 한 달 트렌드에 대한 요약 (한국어)
        - solution: 장기적인 건강 개선을 위한 일반 생활 가이드 (한국어)
        - premiumSolution: [PREMIUM 전용] 월간 트렌드 정밀 분석 및 장기 맞춤 영양 계획 (마크다운 포함 가능, 한국어)
        - insights: 데이터에서 발견된 주요 트렌드 및 상관관계 리스트 (한국어)
        - analyzedAt: "{datetime.now().isoformat()}"
        """

        try:
            response = self.client.beta.chat.completions.parse(
                model=settings.MODEL_NAME,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional medical health analyst who provides data-driven long-term gastrointestinal health reports.",
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format=HealthReportResponse,
            )

            result = response.choices[0].message.parsed
            logger.info("Monthly health report generation complete.")
            return result

        except Exception as e:
            logger.error(f"Error during monthly health report generation: {str(e)}")
            raise e


report_service = ReportService()
