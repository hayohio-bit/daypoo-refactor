# 💩 DayPoo 상세 설계서 (v4.5)

## 1. 프로젝트 개요

- **서비스명:** DayPoo (당신의 '흔적'이 건강이 됩니다)
- **핵심 가치:** 화장실 탐색(급똥 대응) + 방문 인증(기록) + AI 건강 분석 + 게이미피케이션(상점/랭킹).
- **기본 설계 원칙:**
  - **데이터 프라이버시:** AI 분석 시 이미지 데이터를 전송하되, **서버 DB에는 저장하지 않고 분석 결과만 활용**합니다. (이미지 비저장 원칙)
  - **마커 시스템:** 미방문(회색) / 방문완료(컬러) 2단계 시스템으로 유저의 정복감을 고취합니다.
  - **DB 통합:** PostgreSQL(PostGIS)과 Redis를 활용하여 위치 기반 검색 및 실시간 데이터 처리를 극대화합니다.

---

## 2. 기술 스택 (Updated)

- **Backend:** Spring Boot 3.4.3 (Java 21) + Spring Data JPA + QueryDSL 5.0
- **Database:**
  - **PostgreSQL 16 + PostGIS:** 공간 인덱싱을 통한 GPS 거리 계산 및 위치 기반 로직.
  - **Redis:** 실시간 랭킹(Sorted Set), JWT Refresh Token 관리, API Rate Limiting.
- **AI Service:** Python FastAPI (이미지 기반 배변 상태 분석 및 건강 리포트 생성).
- **Auth:** Spring Security + JWT + OAuth2 (Google, Kakao) 및 소셜 가입 닉네임 설정 단계 포함.

---

## 3. 데이터 모델링 (Core ERD)

### 3.1 회원 및 게이미피케이션 (User & Shop)

- **User:** `id`, `email`, `nickname`, `title_id(FK)`, `level`, `exp`, `point`, `avatar_id(FK)`.
- **Title (칭호):** `id`, `name`, `requirement_type`, `requirement_value`.
- **Item (상점 아이템):** `id`, `name`, `category` (아바타/마커스킨), `price`, `image_url`.
- **Subscription:** 유저별 구독 정보 (FREE/PREMIUM) 및 만료일 관리.

### 3.2 화장실 및 인증 (Toilet & Record)

- **Toilet:** `id`, `name`, `address`, `location(Geography)`, `operating_hours`, `is_unisex`, `mng_no`(공공데이터 고유번호).
- **PooRecord (배변 기록):**
  - `bristol_scale` (1~7), `color`, `condition_tags`, `diet_tags`, `region_name`, `warning_tags`.
  - **이미지 비저장:** DTO에서는 AI 분석을 위해 `imageBase64`를 받지만, Entity에는 이미지 필드가 존재하지 않음.
- **VisitLog (방문 로그):**
  - `arrival_at`, `completed_at`, `dwell_seconds` (체류 시간), `distance_meters` (검증된 실제 거리).
  - `event_type` (CHECK_IN, COMPLETE, ABANDON 등).

---

## 4. 핵심 기능 로직 설계

### 4.1 급똥 버튼 알고리즘 (Emergency Search)

- **Logic:** PostGIS `ST_DWithin`을 사용하여 현재 위치 500m~1km 반경 내 화장실 검색.
- **Sorting:** 거리 순 정렬을 기본으로 하되, 현재 시간(운영 시간) 가중치를 적용하여 최적의 TOP 3 추천.

### 4.2 방문 인증 및 보상 (Verification & Reward)

- **Fast Check-in:** 화장실 근처(50m) 도착 시 '체크인' 가능. 서버에서 입장 후 경과 시간을 계산하여 1분 이상의 유효 체류 시 기록 작성을 허용.
- **GPS 검증:** 기록 저장 시점의 좌표와 화장실 좌표 간의 물리적 거리 재검증.
- **Reward:** 경험치(EXP) 및 포인트(Point) 지급. Redis 글로벌 카운터 및 랭킹 즉시 업데이트.

### 4.3 AI 분석 및 건강 리포트

- **Real-time Analysis:** 배변 기록 생성 시 전송된 이미지를 AI가 분석하여 브리스톨 척도 및 이상 징후 감지.
- **Health Report:** 누적된 데이터를 기반으로 주간/월간 단위의 통계와 AI 코멘트 생성.

---

## 5. 관리자 시스템 (Admin Console)

- **User/Toilet Admin:** 사용자 상태 제어(정지/포인트), 화장실 정보 관리 및 공공데이터 동기화(`sync`).
- **Support:** 1:1 문의(Inquiry) 처리 및 FAQ 관리.
- **Monitoring:** AI 서비스 연동 상태 및 전체 시스템 로그(SystemLog) 모니터링.

---

## 6. 인프라 및 운영 환경

- **IaC:** Terraform을 통한 AWS 인프라(RDS, S3, CloudFront 등) 코드형 관리.
- **Container:** Docker-compose를 이용한 로컬 개발 및 스테이징 환경 동기화.
- **Storage:** S3 (상점 아이템 및 프로필 이미지 저장), CloudFront 배포 최적화.

---

> **최종 수정**: 2026-04-02 (v4.5)
