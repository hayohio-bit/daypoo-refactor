# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

DayPoo — 전국 화장실 위치 검색·배변 기록 분석 서비스. 팀 프로젝트를 개인 포트폴리오용으로 포크해 리팩토링 중인 저장소다(원본: jhyeon9185/daypoo).

모노레포 구성: `backend/`(Spring Boot 3.4, Java 21), `frontend/`(React 19 + Vite + TypeScript), `terraform/`(AWS 인프라 IaC — 운영 배포는 `.github/workflows/deploy-oci.yml`의 Oracle Cloud 경로를 쓴다), `twa/`(Play Store TWA 패키징).

## 로컬 개발 실행

실행 순서: DB → 백엔드 → 프론트엔드. 루트 `.env` 하나를 세 곳(docker-compose, 백엔드, 프론트엔드)이 공유한다.

```bash
docker compose up -d                 # PostgreSQL(PostGIS) 15432, Redis 16379
cd backend && ./gradlew bootRun      # :18080 (SERVER_PORT 환경 변수로 변경 가능)
cd frontend && npm run dev           # :5173 (strictPort — 점유되어 있으면 실행 실패)
```

- 백엔드는 `spring.config.import: optional:file:../.env`로 루트 `.env`를 읽는다. DB 미기동 시 Flyway 때문에 부팅이 실패한다.
- Vite는 `envDir: '../'`로 루트 `.env`의 `VITE_*` 변수를 읽는다. `index.html`의 `%VITE_KAKAO_MAP_KEY%`가 카카오맵 SDK 키로 치환된다.
- **로컬 포트는 다른 프로젝트와 겹치지 않도록 고정되어 있다**: 프론트엔드 5173, 백엔드 18080(`build.gradle` 의 `bootRun` 이 `SERVER_PORT` 주입), PostgreSQL 15432, Redis 16379(`docker-compose.yml` 기본값과 루트 환경 변수 파일의 `DB_PORT`·`REDIS_PORT`). 자세한 근거는 `docs/local-run-guide.md`.
- **카카오맵은 `http://localhost:5173` 출처에서만 로드된다** (카카오 개발자 콘솔 등록 도메인). 그래서 프론트엔드만 포트를 바꿀 수 없고, `vite.config.ts` 에 `strictPort: true` 를 두어 5173 을 확보하지 못하면 즉시 실패하게 했다.
- 백엔드 포트를 옮긴 경우 `BACKEND_URL=http://localhost:8081 npm run dev`로 Vite 프록시 대상을 바꿀 수 있다.
- Windows에서 Docker Desktop 없이 WSL2 내부 Docker Engine으로 compose를 실행할 수 있다. 이때 WSL VM이 유휴 종료되면 컨테이너도 함께 내려간다.

## 빌드·테스트·린트

백엔드 (`backend/`):

```bash
./gradlew build                      # CI와 동일한 전체 빌드(테스트 포함)
./gradlew test                       # 테스트만
./gradlew test --tests "com.daypoo.api.service.AuthServiceTest"          # 단일 클래스
./gradlew test --tests "com.daypoo.api.service.AuthServiceTest.메서드명" # 단일 메서드
./gradlew spotlessApply              # google-java-format 포맷팅 (커밋 훅에서도 실행됨)
```

프론트엔드 (`frontend/`):

```bash
npm run test                         # vitest (watch)
npx vitest run src/hooks/useToilets.test.ts   # 단일 파일
npm run test:coverage                # 커버리지 (vite.config.ts에 임계치 정의)
npm run lint                         # biome lint
npm run check                        # biome lint+format 자동 수정
npm run build                        # tsc 없이 vite build
```

커밋 규칙: commitlint(conventional commits)가 husky 훅으로 강제된다(`feat:`, `fix:`, `chore:` 등). lint-staged가 프론트엔드에 prettier, 백엔드에 spotless를 적용한다.

## 아키텍처

요청 흐름: React SPA → Vite dev proxy(`/api`, `/oauth2` 등) → Spring Boot REST API(`/api/v1/**`) → PostgreSQL(PostGIS 공간 쿼리) / Redis(캐시·랭킹·GeoIndex).

백엔드 (`backend/src/main/java/com/daypoo/api/`) — 단일 모듈, 레이어드 구조:

- `controller/` → `service/` → `repository/`(Spring Data JPA + QueryDSL). DTO 변환은 `mapper/`(MapStruct).
- `security/`: JWT(`JwtProvider`, `JwtAuthenticationFilter`) + OAuth2(카카오·구글). 인증 없이 허용되는 경로 목록은 `SecurityConfig`의 permitAll 체인에 있다 — 새 공개 엔드포인트를 추가하면 여기도 수정해야 한다.
- `global/`: 예외 처리(`GlobalExceptionHandler` — 에러 코드 `C001` 형식의 공통 응답), AOP, 필터(MDC 로깅), 설정.
- `service/PublicDataSyncService`: 기동 시 공공데이터포털 화장실 API를 가상 스레드로 병렬 동기화해 bulk insert한다.
- `simulation/`: 부하 시뮬레이션 봇(별도 `simulation` 프로파일, 기본 비활성).
- DB 스키마는 Flyway 마이그레이션(`src/main/resources/db/migration/V*.sql`)이 소유한다. JPA `ddl-auto: none`이므로 스키마 변경은 반드시 새 V파일로 추가한다.

프론트엔드 (`frontend/src/`): `pages/`(라우트) · `components/` · `hooks/`(서버 상태 접근, 예: `useToilets`) · `services/`(API 클라이언트) · `context/`. PWA(vite-plugin-pwa)로 빌드되며 카카오맵 SDK는 `index.html`에서 `autoload=false`로 로드 후 `window.kakao.maps.load()` 콜백을 쓴다.

설정 파일: `application.yml`(공통) + `application-prod.yml`(운영). 시크릿은 전부 루트 `.env`에서 환경 변수로 주입된다.

## API 문서

백엔드 기동 후 Swagger UI: `http://localhost:18080/api/docs` (OpenAPI JSON: `/api/v3/api-docs`). 헬스체크: `/actuator/health`.

## 진행 중인 작업

리팩토링 백로그의 단일 출처는 `docs/refactoring-plan.md`다. 우선순위(P0~P3)와 각 항목의 파일:라인 근거, 완료 항목의 커밋 해시가 기록되어 있다. 백로그 항목을 완료하면 그 문서의 체크박스와 커밋 해시를 갱신한다. 문서 전체 색인은 `docs/README.md`.
