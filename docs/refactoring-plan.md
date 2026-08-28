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
- [x] **프론트엔드 도메인 서비스 모듈 추출** — 화면·컨텍스트 17개 파일이 `api.get/post` 를 직접 호출하던 51곳을 도메인별 서비스 모듈로 옮겼다 (`62aaabe`). 신설 모듈은 authService·toiletService·favoriteService·recordService·notificationService·supportService·reportService·adminService 이고, 기존 `reviewService` 와 같은 명명 함수 형태를 따른다. 서비스가 화면 모듈에 의존하지 않도록 `SystemLog` 타입을 `SystemView.tsx` 에서 `types/admin.ts` 로 옮겼다. `apiClient.request()`(114줄)는 `buildHeaders`·`send`(AbortController 타임아웃)·`handleUnauthorized`(리프레시·게스트 폴백)·`toResponseError`/`toTransportError` 로 분리했다 (`77e818b`).
- [x] **프론트엔드 토큰 조회 공용화** — `apiClient.ts`에서 `getAccessToken()`·`removeTokens()`를 export하고, MapPage(2곳)·SupportPage·NotificationSubscriber·useGeoTracking의 복붙 조회와 AuthContext의 중복 만료 검사·토큰 정리 로직을 교체했다 (`7cc7cbb`). 이로써 모든 호출부가 '로그인 유지' 만료 검사를 일관되게 거친다.
- [x] **죽은 추상화 정리** — `useAsyncState`·`AsyncStateView`는 소비자가 0곳이라 채택 대신 삭제를 선택했다. `geoUtils.ts`는 유일한 호출부(useGeoTracking)를 `calculateDistance` 직접 호출로 바꾼 뒤 삭제했다 (`3cba2c8`). admin 뷰의 loading 수동 관리는 공통 에러 UX 항목에서 다룬다.
- [x] **대형 파일 분해** — 프론트 3개 파일과 백엔드 1개 파일을 책임 단위로 분리했다 (`d91b0b3`·`effa3f8`·`425f134`·`1f8b591`). 착수 시점 실측은 백로그에 적혀 있던 값(928·731·711·552)보다 작았는데, 수익화 제거로 세 파일이 이미 줄어든 뒤였다. `SupportPage.tsx` 923→310줄: 검색·FAQ 항목·문의 등록·문의 내역·문의 수정 컴포넌트와 타입·FAQ 폴백 데이터·애니메이션 베리언츠를 `pages/support/` 로 옮기고, 두 폼에 중복돼 있던 문의 유형 목록을 상수 하나로 통일했다. `admin/DashboardView.tsx` 592→287줄: 통계 위젯·차트 툴팁·하단 로그 섹션을 `pages/admin/dashboard/` 로 옮기고 파생 지표 계산은 `useDashboardMetrics` 훅으로 뺐다. `mypage/ReportTab.tsx` 446→95줄: 오늘 가이드·기간 리포트·30일 트렌드를 `pages/mypage/report/` 로 옮기고 조회와 캐싱은 `useHealthReport` 훅으로 뺐다. `ReportService.java` 484→184줄: 통계 계산(`ReportStatisticsCalculator`)·Redis 캐시(`ReportCacheStore`)·스냅샷 영속화(`ReportSnapshotStore`)를 분리하고 서비스에는 흐름 조율만 남겼다. 중복돼 있던 브리스톨 건강 범위 판정과 태그 분해를 각각 단일 메서드로 통일했으며, 테스트가 없던 통계 계산에 단위 테스트 13건을 추가했다. 네 파일 모두 동작 변경은 없다.
- [x] **정책값 설정 외부화** — 체크인 허용 반경, 기록 보상 경험치, 공공데이터 동기화 튜닝값을 `@ConfigurationProperties`로 옮겼다 (`d006472`). `CheckInProperties`(`app.check-in`)는 `LocationVerificationService`의 상수와 `PooRecordService`에 중복돼 있던 `150.0` 리터럴 두 곳을 대체하고, `RewardProperties`(`app.reward`)는 기록 1건당 경험치를, `PublicDataProperties`(`public-data`)는 서비스 키·URL·배치 크기·최대 동시 요청 수를 담는다. 각 값은 환경 변수로 재정의할 수 있다. 백로그에 적혀 있던 Toss URL은 수익화 제거(`0d00895`)로 `PaymentService`가 삭제되면서 함께 사라져 대상이 아니다. 테스트가 없던 `LocationVerificationService`의 반경 판정에 단위 테스트 4건을 추가했다.
- [x] **동작하지 않는 촬영 UI 제거** — AI 모듈 제거 후 남아 있던 촬영 경로를 전부 삭제했다 (`0327ecc`). `VisitModal.tsx` 에서 카메라 상태·`startCamera`/`stopCamera`/`captureImage`·촬영 UI 블록·사진 미촬영 확인 모달·이미지 검증 실패(`R007`) 분기를 제거하고, 인증 전 화면을 체류 시간 안내로 교체했다. `MapPage.tsx` 의 페이로드 조합과 `types/api.ts` 의 `imageBase64` 필드 및 AI 관련 주석, 백엔드 `PooRecordCreateRequest.imageBase64` 와 고아 DTO `AiAnalysisRequest`·`PooAnalysisRequest`, `openapi.yaml` 의 필드 정의, README 의 WebRTC 표기도 함께 정리했다. 백엔드 필드 제거는 Jackson 미지 필드 정책을 확인한 뒤 진행했다: `application.yml` 에 `FAIL_ON_UNKNOWN_PROPERTIES` 설정이 없어 Spring Boot 기본값(비활성)이 적용되므로, 캐시된 구버전 클라이언트가 `imageBase64` 를 보내도 무시되고 400이 발생하지 않는다.
- [x] **공통 에러 UX** — 화면 10곳에 흩어져 있던 `window.alert` 38회를 알림 토스트로 교체했다 (`9ccaf50`). `alert` 는 사용자가 확인을 누를 때까지 렌더링을 멈추고 서비스 화면과 이질적으로 보인다. 이미 알림용으로 쓰이던 `NotificationContext.showToast` 위에 `useFeedback` 훅(`notifyError`·`notifySuccess`·`notifyInfo`)을 얹고, 잡힌 예외에서 표시 문구를 뽑는 `getErrorMessage` 유틸과 단위 테스트를 추가했다. OAuth 실패 처리는 훅이 `NotificationProvider` 하위에서만 동작하므로 `App` 본문에서 `OAuthErrorNotifier` 컴포넌트로 분리했다. 관리자 문의 목록 조회는 기존에 5xx 응답에서만 실패를 알리고 그 밖의 실패는 조용히 넘어갔는데, 이제 모든 실패를 알린다. 에러 바운더리는 `App` 최상단에 이미 적용돼 있어 그대로 두었다.
- [x] **제거된 엔드포인트를 호출하는 admin 화면 정리** — `061d822`가 shop·title 백엔드 모듈을 제거해 고아가 된 화면 5종을 사용자 결정에 따라 삭제했다 (`16094c4`). StoreView·AddItemView·EditItemView는 import하는 곳이 없어 도달 불가능한 죽은 파일이었고, TitleManagementView·AddTitleView는 AdminPage의 칭호 탭에 마운트되어 있었으나 삭제된 `/admin/titles` 호출로 항상 404가 나던 화면이었다. 칭호 탭 배선, 대시보드의 아이템 등록 퀵 액션, AdminTab의 사어 항목, 미참조 아이템·칭호 타입 8종도 함께 정리했다.
- [x] **RestTemplateBuilder deprecated API 교체** — `setConnectTimeout`/`setReadTimeout`을 Spring Boot 3.4의 `connectTimeout`/`readTimeout`으로 교체해 removal 경고를 제거했다 (`1b1a85b`).
- [x] **수익화 기능 제거 (MVP 범위 결정)** — 사용자 결정(2026-08-28 "결제 제거, 적립 삭제, 수익화 미포함")에 따라 Toss 결제·구독 스택과 포인트 경제를 전부 제거했다 (`0d00895`). 기록 보상은 경험치만 남기고, PRO/PREMIUM 게이트·포인트 차감이 걸려 있던 리포트는 전면 공개로 전환했다(마스킹 제거, 캐시 v19). 관리자 통계에서 매출·플랜 분포를 제거하고 주간 트렌드는 일별 신규 가입자로 재정의했다. **스키마는 무변경**: payments·subscriptions 테이블과 users.points 컬럼은 남기고, 회원 삭제 시 잔여 행은 JDBC로 정리한다. 선행으로 AI 모듈 제거 후 404가 나던 관리자 "AI 요약 일괄 생성" 버튼도 정리했다 (`aa083c5`).
- [x] **수익화 잔재 콘텐츠·배포 설정 정리** — 사용자 확인 후 코드 밖 잔재를 정리했다 (`7d09846`). `InquiryType.PAYMENT_ITEM`을 삭제하고 기존 DB 행은 V33 마이그레이션으로 OTHERS에 이관했다. FAQ는 결제·환불 안내를 삭제하고 '결제/아바타' 카테고리의 나머지 항목을 '이용방법'으로 이동했다(DB 데이터는 V33, 프론트는 SupportPage FALLBACK·카테고리 목록). 문의 테스트 데이터 생성기의 결제·포인트·아이템 문구도 교체했다. 배포 쪽은 `deploy-oci.yml`·`docker-compose.prod.yml`·`frontend/Dockerfile`·`docs/infrastructure/*`·README에서 TOSS_SECRET_KEY·VITE_TOSS_CLIENT_KEY·OPENAI_API_KEY 참조를 제거했다. terraform 시뮬레이션 봇 Lambda의 OPENAI_API_KEY는 리뷰 문구 생성용 별도 인프라(키 없이도 동작)라 유지했다.

## 완료

- [x] 존재하지 않는 경로·잘못된 메서드·파라미터 오류가 500으로 응답하던 문제 수정 — 전용 핸들러 4종과 단위 테스트 추가 (`3341f9f`)
- [x] Vite dev 프록시 대상 `BACKEND_URL` 환경 변수화 (`819f276`)
