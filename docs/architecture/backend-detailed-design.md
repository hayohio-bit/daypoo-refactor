# ⚙️ DayPoo Backend Detailed Architecture Design (v1.5)

이 문서는 DayPoo 프로젝트 백엔드의 기술적 구조, 데이터 흐름, 보안 체계 및 구현 규칙을 상세히 정의하며, **2026-04-02** 기준 현재 구현된 코드를 바탕으로 작성되었습니다.

---

## 1. 기술 스택 (Tech Stack)

| 항목           | 기술/버전                                      |
| -------------- | -------------------------------------------- |
| **Framework**  | Spring Boot 3.4.3 / Java 21                  |
| **Build Tool** | Gradle 8.x                                   |
| **Database**   | PostgreSQL 16 / PostGIS (Spatial Data)      |
| **Caching**    | Redis (JWT, Ranking, RateLimit)             |
| **ORM/Query**  | Spring Data JPA / QueryDSL 5.0 (Jakarta)    |
| **Docs**       | SpringDoc OpenAPI 2.8.5 (Swagger)           |
| **Utility**    | MapStruct 1.5.5 / Lombok / JJWT 0.12.5       |

---

## 2. 프로젝트 구조 (Package Structure)

Layered Architecture를 기반으로 기능별 도메인이 분리된 `com.daypoo.api` 패키지 구조를 가집니다.

```text
com.daypoo.api
├── controller           # API 엔드포인트 (Auth, Toilet, Record, Admin 등)
├── service              # 비즈니스 로직 및 외부 연동 (AI, API)
├── repository           # 데이터 액세스 (JPA Repository, QueryDSL Custom)
├── entity               # JPA 도메인 모델 (BaseTimeEntity 상속)
├── dto                  # Request/Response DTO (Validation 포함)
├── security             # JWT, OAuth2 (Google/Kakao), SecurityConfig
├── component            # 비즈니스 로직에 종속되지 않은 공통 컴포넌트
├── event                # 비동기 이벤트 핸들링 (Spring Event)
├── simulation           # 대규모 데이터 시뮬레이션 및 부하 테스트 로직
├── mapper               # Entity <-> DTO 변환 (MapStruct)
├── global               # 전역 설정 (Config, Exception, Filter, AOP)
└── util                 # 정적 유틸리티 클래스
```

---

## 3. 보안 아키텍처 (Security & Auth)

### 3.1 인증 흐름 (Authentication Flow)
- **OAuth2 Login**: Google/Kakao 소셜 인증 후 `OAuth2SuccessHandler`에서 JWT 발급.
- **JWT Auth**: `JwtAuthenticationFilter`가 모든 요청의 `Authorization` 헤더를 검증.
- **Maintenance Mode**: `MaintenanceModeFilter`를 통해 점검 시 특정 API(Admin 제외)를 일괄 차단 가능.

### 3.2 인가 체계 (Authorization)
- **Role Hierarchy**: `ROLE_USER`, `ROLE_ADMIN` 권한 체계 적용.
- **Admin Security**: `/api/v1/admin/**` 경로는 `ADMIN` 권한을 가진 사용자만 접근 가능하도록 `SecurityConfig`에서 보호.

---

## 4. 핵심 비즈니스 도메인 (Core Domains)

### 4.1 화장실 및 위치 인증 (`Toilet` / `Record`)
- **Spatial Search**: PostGIS `ST_DWithin`을 활용하여 근처 화장실 검색.
- **Check-in Logic**: 사용자 좌표와 화장실 간 거리(50m 이내)를 검증하여 방문 인증 수행.

### 4.2 AI 배변 분석 (`AI Service`)
- **Async Processing**: 배변 기록 생성 시 비동기적으로 AI 서비스와 통신하여 분석 결과 업데이트.
- **Correlation ID**: 모든 요청에 고유 ID(`X-Correlation-Id`)를 부여하여 마이크로서비스 간 로그 추적성 확보.

### 4.3 게이미피케이션 (`Ranking` / `Shop` / `Subscription`)
- **Ranking**: Redis Sorted Set을 이용한 실시간 글로벌 및 지역 랭킹 시스템.
- **Subscription**: 사용자의 구독 상태(FREE/PREMIUM)에 따른 AI 분석 리포트 범위 차등 제공.

---

## 5. 데이터 전략 (Data Strategy)

### 5.1 데이터 정합성 및 마이그레이션
- **Flyway**: `V1__init.sql`부터 현재 버전까지 데이터베이스 스키마 형상 관리 수행.
- **Soft Delete**: `deleted_at` 필드를 활용한 데이터 삭제 처리 (Audit 시스템 기반).

### 5.2 캐시 전략
- **Redis Cache**: 화장실 상세 정보 등 빈번하게 조회되는 읽기 전용 데이터 캐싱.
- **Rate Limit**: `@RateLimit` AOP를 통해 특정 API(인증, 메일 전송 등)에 대한 과도한 요청 차단.

---
> **최종 수정**: 2026-04-02 (v1.5)
