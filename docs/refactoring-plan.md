# 리팩토링 계획

2026-08-27 기준 코드베이스 정적 조사 결과를 우선순위로 정리한 백로그다. 각 항목은 파일 경로와 라인 근거를 포함한다. 완료된 항목은 체크하고 커밋 해시를 기록한다.

## P0 — 보안

- [x] **관리자 계정 기본 비밀번호 제거** — `application.yml`의 비밀번호·관리자 이메일 목록 기본값을 제거하고, `ADMIN_PASSWORD` 미설정 시 관리자 계정 생성을 건너뛰도록 변경했다. `.env.example`에 항목을 문서화하고 단위 테스트 3건을 추가했다 (`58cfb95`). **후속 조치 필요**: 기존 기본값 문자열은 git 이력에 남아 있으므로, 운영 환경이 이 값을 사용 중이었다면 배포 환경에서 비밀번호를 교체해야 한다.
- [x] **CookieUtils의 Java 역직렬화 제거** — Spring Security 허용 목록 기반 Jackson JSON 직렬화로 교체하고, `Set-Cookie` 수동 조립을 `ResponseCookie` 빌더로, `Secure` 플래그를 설정(`app.cookie.secure`, 기본 true)으로 전환했다. 역직렬화 실패에 WARN 로깅을 추가하고 왕복·변조·쿠키 속성 테스트 4건을 작성했다 (`3e1163f`). 기존 Java 직렬화 형식의 쿠키는 null로 무해하게 무시되어 플로우가 재시작된다.

## P1 — 동작 결함

- [x] **apiClient 게스트 폴백에 타임아웃 미적용** — 폴백 fetch가 이미 타임아웃이 해제된 컨트롤러의 signal을 재사용하던 것을 전용 AbortController로 교체하고 테스트를 추가했다 (`e31257e`).
- [x] **토큰 만료 시간 하드코딩 중복** — 조사 결과 3일은 "로그인 유지" 클라이언트 세션 정책으로 의도된 값이며 백엔드 14일보다 짧아 갱신 동작에는 문제가 없었다. 다만 AuthContext와 apiClient 두 곳에 중복 정의되어 있어 `STAY_LOGGED_IN_DURATION_MS` 단일 상수로 추출했다 (`e31257e`).
- [x] **BusinessException 체계를 벗어난 예외 정리** — PRO 멤버십 검사(403 B002 신설), 포인트 부족(400 S001), 유저 없음(404 U001)을 `BusinessException`으로 전환하고 테스트를 추가했다 (`9fd1dd9`). `AdminSettingsService`의 "System settings not initialized"는 서버 불변식 위반이라 500이 올바르므로 유지하기로 결정했다.
- [x] **OpenSearch 인덱스명 이중 정의** — `ToiletIndexingService.INDEX_NAME`을 단일 출처로 삼고 검색 서비스가 참조하도록 변경했다 (`90ba44b`).

## P2 — 테스트 공백

위험도 순으로 신설한다. 1차분 4건은 완료 (`4e2634a`), 나머지 서비스(NotificationService, ToiletIndexingService, ReportService 등 19개)는 리팩토링 시 함께 작성한다.

- [x] **PaymentService** — Toss 승인 성공·거절, 플랜 판정(orderId·금액), 포인트 적립, 예외 래핑 5건 (`4e2634a`).
- [x] **UserDeletionService** — FK 의존 순서(InOrder 검증), 리뷰 통계 재계산, AI 요약 초기화 3건 (`4e2634a`).
- [x] **AdminManagementService** — 자기 역할 변경·자기 삭제 금지, 미존재 사용자, 정상 위임 5건 (`4e2634a`).
- [x] **PublicDataSyncTest 재작성** — 무의미한 `@Disabled` 통합 테스트를 삭제하고, 외부 API 호출만 스텁한 단위 테스트로 교체했다. 삽입·변경·동일·빈 응답 집계와 좌표 검증, WKT 정규화를 검증한다 (`4e2634a`).

## P3 — 구조 개선

- [x] **AdminManagementService 분할** — `AdminUserService`·`AdminToiletService`·`AdminInquiryService`로 분할하고 컨트롤러를 재배선했다. 문의 테스트 데이터 생성 중복은 `AdminInquiryService`로 단일화했다(`AdminService.generateTestData`가 위임 — 생성 문의 3건 중 1건이 답변 완료 상태가 되는 동작 변화 있음). 아이템·칭호 관리 섹션은 `061d822`(shop·title 모듈 제거)가 컨트롤러를 지운 뒤 호출부가 없는 죽은 코드였으므로 DTO 6종·에러 코드 5종·전용 리포지토리 쿼리와 함께 삭제했다 (`cd3b1ce`).
- [x] **사용자 조회 중복 제거** — 착수 시 재조사 결과 실제 패턴은 main 소스 기준 10곳이었다(최초 조사의 36곳은 과대 집계). AuthService 6곳·FavoriteService 2곳·ToiletReviewService 1곳·PooRecordEventListener 1곳을 `UserService.getByEmail()`로 통일하고 UserServiceTest를 신설했다 (`58c0035`). 제외: `AuthService.login`(실패 시 디버그 로그가 있는 조회), `AdminManagementService:539`(테스트 데이터용 이중 이메일 조회 — 서비스 분할 항목에서 처리), `OAuth2SuccessHandler`·`DataInitializer`(예외를 던지지 않는 Optional 분기).
- [ ] **프론트엔드 도메인 서비스 모듈 추출** — 서비스 계층이 `apiClient.ts` + `reviewService.ts` 2개뿐이고, 10개 이상의 페이지가 `api.get/post`를 직접 호출한다. 도메인별(toilet, admin, auth 등) 서비스 모듈로 추출한다. `apiClient.request()`(110줄 단일 함수)도 헤더 구성/리프레시/폴백/에러 매핑으로 분리한다.
- [x] **프론트엔드 토큰 조회 공용화** — `apiClient.ts`에서 `getAccessToken()`·`removeTokens()`를 export하고, MapPage(2곳)·SupportPage·NotificationSubscriber·useGeoTracking의 복붙 조회와 AuthContext의 중복 만료 검사·토큰 정리 로직을 교체했다 (`7cc7cbb`). 이로써 모든 호출부가 '로그인 유지' 만료 검사를 일관되게 거친다.
- [x] **죽은 추상화 정리** — `useAsyncState`·`AsyncStateView`는 소비자가 0곳이라 채택 대신 삭제를 선택했다. `geoUtils.ts`는 유일한 호출부(useGeoTracking)를 `calculateDistance` 직접 호출로 바꾼 뒤 삭제했다 (`3cba2c8`). admin 뷰의 loading 수동 관리는 공통 에러 UX 항목에서 다룬다.
- [ ] **대형 파일 분해** — 프론트 928줄 `SupportPage.tsx`(FAQ 데이터를 별도 모듈로), 731줄 `admin/DashboardView.tsx`, 711줄 `mypage/ReportTab.tsx` 등. 백엔드 552줄 `ReportService`(집계와 캐시 관리 분리).
- [ ] **정책값 설정 외부화** — 체크인 허용 반경(`LocationVerificationService.java:19`), 보상 정책(`PooRecordService.java:52-54`), Toss URL(`PaymentService.java:55`), 동기화 튜닝값(`PublicDataSyncService.java:45-46`) 등을 `@ConfigurationProperties`로 이동한다.
- [ ] **공통 에러 UX** — 프론트 catch/alert 블록이 파일별로 산재한다(StoreView 18회, SettingsTab 15회, MapPage 14회). 공통 에러 토스트/바운더리를 도입한다.
- [ ] **제거된 엔드포인트를 호출하는 admin 화면 정리** — `061d822`가 shop·title 백엔드 모듈을 제거했지만 프론트엔드 `admin/StoreView.tsx`·`AddItemView.tsx`·`EditItemView.tsx`·`TitleManagementView.tsx`·`AddTitleView.tsx`는 여전히 `/admin/shop/items`·`/admin/titles`를 호출해 404가 난다. 화면을 함께 제거하거나 엔드포인트를 복원해야 한다 (2026-08-27 AdminManagementService 분할 작업 중 발견).
- [x] **RestTemplateBuilder deprecated API 교체** — `setConnectTimeout`/`setReadTimeout`을 Spring Boot 3.4의 `connectTimeout`/`readTimeout`으로 교체해 removal 경고를 제거했다 (`1b1a85b`).

## 완료

- [x] 존재하지 않는 경로·잘못된 메서드·파라미터 오류가 500으로 응답하던 문제 수정 — 전용 핸들러 4종과 단위 테스트 추가 (`3341f9f`)
- [x] Vite dev 프록시 대상 `BACKEND_URL` 환경 변수화 (`819f276`)
