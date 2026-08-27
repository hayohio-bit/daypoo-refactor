# 리팩토링 계획

2026-08-27 기준 코드베이스 정적 조사 결과를 우선순위로 정리한 백로그다. 각 항목은 파일 경로와 라인 근거를 포함한다. 완료된 항목은 체크하고 커밋 해시를 기록한다.

## P0 — 보안

- [ ] **관리자 계정 기본 비밀번호 제거** — `backend/src/main/resources/application.yml:102`의 `${ADMIN_PASSWORD:p00dle****}` 기본값이 소스에 커밋되어 있고, `DataInitializer`가 이 값으로 ROLE_ADMIN 계정을 자동 생성한다. 환경 변수 누락 시 알려진 비밀번호의 관리자 계정이 만들어지므로, 기본값을 제거하고 미설정 시 계정 생성을 건너뛰거나 기동을 실패시켜야 한다. 개인 이메일 기본값(`application.yml:103`)도 함께 제거한다.
- [ ] **CookieUtils의 Java 역직렬화 제거** — `backend/.../security/CookieUtils.java:47-62`가 클라이언트가 제어하는 쿠키 값을 `SerializationUtils.deserialize`(Spring 6.1부터 deprecated)로 Java 역직렬화한다. 역직렬화 가젯 공격 표면이므로 Jackson 기반 JSON 직렬화로 교체하고, `Set-Cookie` 문자열 수동 조립(`:18-27`)은 `ResponseCookie` 빌더로 바꾼다. 예외를 삼키고 null을 반환하는 부분(`:59-61`)에 로깅을 추가한다.

## P1 — 동작 결함

- [ ] **apiClient 게스트 폴백에 타임아웃 미적용** — `frontend/src/services/apiClient.ts:99-104`의 재시도 fetch가 이미 `clearTimeout`(`:73`)된 컨트롤러의 signal을 재사용해서, 폴백 요청은 타임아웃 없이 무한정 대기할 수 있다. 새 AbortController로 교체한다.
- [ ] **토큰 만료 시간 하드코딩 불일치** — `apiClient.ts:220`의 `THREE_DAYS_MS`(3일)가 백엔드 리프레시 토큰 유효기간 `refresh-token-validity-in-seconds: 1209600`(14일, `application.yml:52`)과 다르다. 서버 응답의 만료 정보를 쓰거나 상수를 일치시킨다.
- [ ] **BusinessException 체계를 벗어난 예외 정리** — 다음 위치들이 `RuntimeException`/`IllegalStateException`/`IllegalArgumentException`을 직접 던져서 전역 예외 처리기의 캐치올(500 C004)로 떨어진다. 실제로는 4xx로 응답해야 하는 경우다.
  - `controller/ReportController.java:45,56,68` — PRO 멤버십 검사(403이어야 함)
  - `service/AdminService.java:129`, `service/AdminManagementService.java:546` — 테스트 데이터 생성 시 유저 없음
  - `event/PooRecordEventListener.java:30` — 유저 없음
  - `global/config/AdminSettingsService` 계열의 `IllegalStateException` 사용처
- [ ] **OpenSearch 인덱스명 이중 정의** — `INDEX_NAME = "toilets_v2"`가 `ToiletSearchService.java:22`와 `ToiletIndexingService.java:27`에 각각 하드코딩되어 있어 한쪽만 바꾸면 검색이 조용히 깨진다. 공통 상수나 설정으로 단일화한다.

## P2 — 테스트 공백

서비스 25개 중 테스트가 있는 것은 AuthService, PooRecordService 2개뿐이다. 위험도 순으로 신설한다.

- [ ] **PaymentService** — 결제 금액 계산과 Toss 연동 로직. 금전 오류 위험이 가장 크다.
- [ ] **UserDeletionService** — Repository 13개를 주입받아 연쇄 삭제를 수행한다. 삭제 누락·순서 오류를 테스트로 고정한다.
- [ ] **AdminManagementService** — 권한 변경, 자기 자신 변경 금지 등 보안성 규칙 검증.
- [ ] **PublicDataSyncTest 재작성** — 현재 `@Disabled` + 실 API 호출 + 항상 참인 단언(`isGreaterThanOrEqualTo(0)`)으로 실질 커버리지가 0이다. WebClient를 모킹한 단위 테스트로 교체한다.

## P3 — 구조 개선

- [ ] **AdminManagementService 분할** — 587줄, 유저/화장실/문의/아이템/칭호 5개 도메인 혼재, Repository 9개 주입. 도메인별 서비스로 나누고, `AdminService`(185줄)와의 역할 중복(테스트 데이터 생성이 양쪽에 존재: `AdminService.java:122`, `AdminManagementService.java:533`)을 해소한다.
- [ ] **사용자 조회 중복 제거** — `findByEmail(...).orElseThrow(USER_NOT_FOUND)` 패턴이 AuthService에만 8회, 전역 36곳이다. 이미 존재하는 `UserService.getByEmail()`로 통일한다.
- [ ] **프론트엔드 도메인 서비스 모듈 추출** — 서비스 계층이 `apiClient.ts` + `reviewService.ts` 2개뿐이고, 10개 이상의 페이지가 `api.get/post`를 직접 호출한다. 도메인별(toilet, admin, auth 등) 서비스 모듈로 추출한다. `apiClient.request()`(110줄 단일 함수)도 헤더 구성/리프레시/폴백/에러 매핑으로 분리한다.
- [ ] **프론트엔드 토큰 조회 공용화** — `localStorage.getItem('accessToken') || sessionStorage...` 패턴이 5개 파일에 복붙되어 있다. `apiClient.ts`의 `getToken()`을 export해 재사용한다.
- [ ] **죽은 추상화 정리** — `hooks/useAsyncState.ts` + `components/common/AsyncStateView.tsx`는 어느 페이지도 쓰지 않고, admin 뷰 4곳이 loading 상태를 수동 관리한다. 채택하거나 삭제한다. `utils/geoUtils.ts`(deprecated 위임 껍데기 9줄)는 호출부 정리 후 삭제한다.
- [ ] **대형 파일 분해** — 프론트 928줄 `SupportPage.tsx`(FAQ 데이터를 별도 모듈로), 731줄 `admin/DashboardView.tsx`, 711줄 `mypage/ReportTab.tsx` 등. 백엔드 552줄 `ReportService`(집계와 캐시 관리 분리).
- [ ] **정책값 설정 외부화** — 체크인 허용 반경(`LocationVerificationService.java:19`), 보상 정책(`PooRecordService.java:52-54`), Toss URL(`PaymentService.java:55`), 동기화 튜닝값(`PublicDataSyncService.java:45-46`) 등을 `@ConfigurationProperties`로 이동한다.
- [ ] **공통 에러 UX** — 프론트 catch/alert 블록이 파일별로 산재한다(StoreView 18회, SettingsTab 15회, MapPage 14회). 공통 에러 토스트/바운더리를 도입한다.

## 완료

- [x] 존재하지 않는 경로·잘못된 메서드·파라미터 오류가 500으로 응답하던 문제 수정 — 전용 핸들러 4종과 단위 테스트 추가 (`3341f9f`)
- [x] Vite dev 프록시 대상 `BACKEND_URL` 환경 변수화 (`819f276`)
