# 리팩토링 계획

2026-08-27 기준 코드베이스 정적 조사 결과를 우선순위로 정리한 백로그다. 각 항목은 파일 경로와 라인 근거를 포함한다. 완료된 항목은 체크하고 커밋 해시를 기록한다.

## P0 — 보안

- [ ] **관리자 계정 기본 비밀번호 제거** — `backend/src/main/resources/application.yml:102`의 `${ADMIN_PASSWORD:p00dle****}` 기본값이 소스에 커밋되어 있고, `DataInitializer`가 이 값으로 ROLE_ADMIN 계정을 자동 생성한다. 환경 변수 누락 시 알려진 비밀번호의 관리자 계정이 만들어지므로, 기본값을 제거하고 미설정 시 계정 생성을 건너뛰거나 기동을 실패시켜야 한다. 개인 이메일 기본값(`application.yml:103`)도 함께 제거한다.
- [ ] **CookieUtils의 Java 역직렬화 제거** — `backend/.../security/CookieUtils.java:47-62`가 클라이언트가 제어하는 쿠키 값을 `SerializationUtils.deserialize`(Spring 6.1부터 deprecated)로 Java 역직렬화한다. 역직렬화 가젯 공격 표면이므로 Jackson 기반 JSON 직렬화로 교체하고, `Set-Cookie` 문자열 수동 조립(`:18-27`)은 `ResponseCookie` 빌더로 바꾼다. 예외를 삼키고 null을 반환하는 부분(`:59-61`)에 로깅을 추가한다.

## P1 — 동작 결함

- [x] **apiClient 게스트 폴백에 타임아웃 미적용** — 폴백 fetch가 이미 타임아웃이 해제된 컨트롤러의 signal을 재사용하던 것을 전용 AbortController로 교체하고 테스트를 추가했다 (`e31257e`).
- [x] **토큰 만료 시간 하드코딩 중복** — 조사 결과 3일은 "로그인 유지" 클라이언트 세션 정책으로 의도된 값이며 백엔드 14일보다 짧아 갱신 동작에는 문제가 없었다. 다만 AuthContext와 apiClient 두 곳에 중복 정의되어 있어 `STAY_LOGGED_IN_DURATION_MS` 단일 상수로 추출했다 (`e31257e`).
- [x] **BusinessException 체계를 벗어난 예외 정리** — PRO 멤버십 검사(403 B002 신설), 포인트 부족(400 S001), 유저 없음(404 U001)을 `BusinessException`으로 전환하고 테스트를 추가했다 (`9fd1dd9`). `AdminSettingsService`의 "System settings not initialized"는 서버 불변식 위반이라 500이 올바르므로 유지하기로 결정했다.
- [x] **OpenSearch 인덱스명 이중 정의** — `ToiletIndexingService.INDEX_NAME`을 단일 출처로 삼고 검색 서비스가 참조하도록 변경했다 (`90ba44b`).

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
