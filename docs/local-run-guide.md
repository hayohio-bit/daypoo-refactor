# 로컬 실행 및 화면 가이드

로컬에서 DayPoo를 기동해 실제 화면을 확인하는 절차와, 각 화면에서 무엇을 볼 수 있는지 정리한 문서다.
아래 스크린샷은 모두 2026-08-27 기준으로 로컬 환경에서 직접 촬영했다.

## 1. 실행 절차

실행 순서는 DB → 백엔드 → 프론트엔드다. 루트 `.env` 하나를 세 곳(docker-compose, 백엔드, 프론트엔드)이 공유한다.

```bash
# 1. 인프라 (PostgreSQL + PostGIS, Redis)
docker compose up -d

# 2. 백엔드 (:8080)
cd backend && ./gradlew bootRun

# 3. 프론트엔드 (:5173)
cd frontend && npm run dev
```

기동이 끝나면 다음 두 곳에서 상태를 확인한다.

- 헬스체크: `http://localhost:8080/actuator/health` — `db`, `redis` 가 모두 `UP` 이어야 한다.
- Swagger UI: `http://localhost:8080/api/docs`

### 실행 전 확인할 것

| 항목 | 확인 방법 | 어긋났을 때 나타나는 증상 |
|---|---|---|
| 5432 포트를 Docker 컨테이너가 점유하는지 | `netstat -ano \| findstr :5432` 로 확인한 PID의 프로세스가 `wslrelay` 인지 (WSL2 Docker 사용 시) | 백엔드 부팅이 Flyway 단계에서 `password authentication failed` 로 실패한다 |
| Vite 프록시 대상이 8080 인지 | `BACKEND_URL` 환경 변수가 설정되어 있지 않은 상태로 `npm run dev` 실행 | 지도에 마커가 하나도 표시되지 않고, `/api/v1/toilets` 요청이 401 또는 503 을 반환한다 |
| 프론트엔드가 5173 포트를 확보했는지 | 콘솔에 출력된 Local 주소 | 카카오맵 SDK가 등록 도메인 밖이라고 판단해 지도가 빈 화면이 된다 |

세 항목 모두 실제로 겪은 문제에서 뽑았다. 특히 첫 번째 항목은 Windows에 네이티브 PostgreSQL이 따로 설치되어 있을 때 발생한다. 네이티브 인스턴스가 5432를 먼저 점유하면 백엔드는 Docker 컨테이너가 아니라 그 인스턴스에 접속하고, 해당 인스턴스에는 `.env` 에 적힌 계정이 없으므로 인증에 실패한다. 이때는 네이티브 인스턴스를 내린 뒤 컨테이너를 다시 시작해 포트 포워딩을 재설정해야 한다.

```bash
# 네이티브 PostgreSQL 종료 (설치 경로와 데이터 디렉터리는 환경에 따라 다르다)
pg_ctl -D <데이터 디렉터리> -m fast stop

# 컨테이너를 재시작해 5432 포워딩을 다시 건다 (restart 로는 복구되지 않는 경우가 있다)
docker stop daypoo_postgres && docker start daypoo_postgres
```

### 로컬에서 동작하지 않는 기능

- **화장실 텍스트 검색** (지도 상단 검색창): OpenSearch(`localhost:9200`)에 의존하는데, 로컬 `docker-compose.yml` 에는 OpenSearch 서비스가 없다. 검색을 실행하면 백엔드가 `ToiletSearchService` 에서 연결 실패를 기록하고 빈 배열을 반환하므로, 화면에는 결과가 표시되지 않는다. 지도 마커 조회(`GET /api/v1/toilets`)는 PostGIS 공간 쿼리를 쓰므로 OpenSearch 없이도 정상 동작한다.

## 2. 화면별 사용 방법

### 2.1 메인 (`/main`)

![메인 화면 상단](./screenshots/01-main-hero.jpg)

서비스 진입점이다. `가까운 화장실 찾기` 는 지도 화면으로, `기록하러 가기` 는 배변 기록 화면으로 이동한다. 우측 하단의 `급똥` 버튼은 어느 화면에서나 지도로 바로 이동하는 단축 버튼이다.

아래로 스크롤하면 기능 소개 섹션이 이어진다.

![메인 화면 기능 소개](./screenshots/02-main-howitworks.jpg)

### 2.2 급똥 지도 (`/map`)

![지도 화면](./screenshots/03-map.jpg)

브라우저 위치 권한을 허용하면 현재 위치를 중심으로 지도가 열리고, 반경 내 화장실이 마커로 표시된다. 지도를 이동하거나 축척을 바꾸면 그 영역을 기준으로 `GET /api/v1/toilets?latitude=..&longitude=..&radius=..` 를 다시 호출한다. 상단 필터로 `전체 / 즐겨찾기 / 내 기록` 을 전환할 수 있다.

마커를 클릭하면 상세 패널이 열린다.

![화장실 상세 패널](./screenshots/06-toilet-detail.jpg)

패널에는 이름, 주소, 현위치로부터의 거리, 남녀 구분 여부, 최근 후기가 표시된다. `방문 인증하기` 는 인증 범위(현위치에서 150m 이내)에 들어와 있을 때만 동작하며, 로그인이 필요하다.

### 2.3 로그인·회원가입

![로그인 모달](./screenshots/04-login-modal.jpg)

로그인은 별도 페이지가 아니라 모달로 열린다. 헤더의 `로그인` 을 누르거나, 로그인이 필요한 화면(마이페이지 등)에 접근하면 자동으로 뜬다. 카카오·구글 소셜 로그인과 이메일 로그인을 지원한다.

소셜 로그인을 로컬에서 쓰려면 `.env` 에 각 제공자의 클라이언트 ID와 시크릿이 있어야 한다. 값이 없으면 인증 실패 후 `?error=` 파라미터를 달고 돌아오며, 화면에 설정 누락 안내가 표시된다.

### 2.4 고객 지원 (`/support`)

![고객 지원 화면](./screenshots/05-support.jpg)

자주 묻는 질문, 1:1 문의하기, 나의 문의 내역으로 구성된다. 좌측 `CATEGORIES` 에서 `배변 패턴/AI분석`, `이용방법`, `계정/보안` 으로 질문을 걸러 볼 수 있다. 1:1 문의 작성과 문의 내역 조회는 로그인이 필요하다.

### 2.5 API 문서 (`http://localhost:8080/api/docs`)

![Swagger UI](./screenshots/07-swagger.jpg)

백엔드 기동 후 Swagger UI에서 전체 엔드포인트를 확인하고 직접 호출해 볼 수 있다. OpenAPI JSON은 `/api/v3/api-docs` 에 있다.

## 3. 이 문서에 포함하지 않은 화면

다음 화면은 로그인한 계정이 필요해 촬영하지 않았다. 계정을 만든 뒤 같은 방식으로 추가하면 된다.

- 마이페이지 (`/mypage`) — 배변 기록 달력, AI 분석 리포트, 획득 칭호
- 관리자 (`/admin`) — 유저 관리, 문의 관리, 시스템 설정. `ADMIN` 역할을 가진 계정만 접근할 수 있고, 그 외 계정은 `/main` 으로 리다이렉트된다
