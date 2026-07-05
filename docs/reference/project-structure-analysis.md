# 프로젝트 전체 구조 분석

> 작성일: 2026-04-03
> 목적: 방문 인증 / 배변 건강 기록 분리 구조 설계를 위한 현황 파악

---

## 1. 디렉토리 구조

```
src/
├── App.tsx                    # 라우터 루트
├── pages/                     # 페이지 단위 컴포넌트
│   ├── MapPage.tsx            # 핵심 페이지 (방문 인증 전체 흐름 관리)
│   ├── MyPage.tsx             # 마이페이지 (건강 리포트 포함)
│   ├── MainPage.tsx           # 랜딩
│   └── RankingPage.tsx        # 랭킹
├── components/
│   ├── map/                   # 지도 관련 컴포넌트
│   │   ├── VisitModal.tsx     # ★ 핵심: 방문인증 + 건강기록 통합
│   │   ├── ToiletPopup.tsx    # 화장실 팝업 (방문 버튼 진입점)
│   │   ├── MapView.tsx        # 네이버 지도
│   │   └── ToiletSearchBar.tsx
│   └── Navbar.tsx             # 상단 네비 (지도/랭킹/FAQ)
├── hooks/
│   └── useGeoTracking.ts      # ★ 위치 추적 + 자동 체크인
├── types/
│   ├── toilet.ts              # VisitRecord, BRISTOL_TYPES 등 타입 정의
│   └── api.ts                 # PooRecordResponse (API 응답 타입)
└── services/
    └── apiClient.ts           # API 클라이언트
```

---

## 2. 현재 방문 인증 전체 흐름

```
[지도] 화장실 선택
    └→ ToiletPopup: "방문 인증" 버튼 클릭
         └→ MapPage.handleVisitRequest()
              ├→ POST /records/check-in (위치 좌표 필수)
              └→ VisitModal 열림 (toilet + checkInTime 전달)
                   ├─ Step 0: AI 카메라 촬영 (선택)
                   ├─ Step 1: Bristol Scale (1~7)
                   ├─ Step 2: 색상 선택
                   ├─ Step 3: 컨디션/음식 태그
                   └→ MapPage.handleVisitComplete()
                        └→ POST /records (toiletId + 위치 좌표 + 건강데이터)
```

---

## 3. 핵심 데이터 모델

| 타입 | 파일 | 주요 필드 | 문제점 |
|------|------|-----------|--------|
| `VisitRecord` | `types/toilet.ts` | `toiletId` **(필수)**, bristolType, color, tags | toiletId가 항상 필요 |
| `PooRecordResponse` | `types/api.ts` | `toiletId` **(필수)**, bristolScale, color, tags | 동일 |
| `CheckInResponse` | `types/api.ts` | remainedSeconds, status | 위치 기반 전용 |

### VisitRecord (types/toilet.ts)
```ts
export interface VisitRecord {
  toiletId: string;       // 필수 — 분리 시 optional로 변경 필요
  bristolType: number;
  color: PoopColor;
  conditionTags: ConditionTag[];
  foodTags: FoodTag[];
  createdAt: string;
}
```

### PooRecordResponse (types/api.ts)
```ts
export interface PooRecordResponse {
  id: number;
  toiletId: number;       // 필수 — 분리 시 optional로 변경 필요
  bristolScale: number;
  color: string;
  conditionTags: string[];
  dietTags: string[];
  createdAt: string;
  pointsAwarded?: number;
}
```

---

## 4. 방문 인증 vs 건강 기록 결합 지점

```
┌─────────────────────────────────────────────┐
│              VisitModal (현재)               │
│                                             │
│  [방문 인증 책임]        [건강 기록 책임]    │
│  ─────────────────      ─────────────────  │
│  • checkInTime 타이머   • Bristol Scale      │
│  • 60초 체류 검증       • 색상 선택          │
│  • 위치 기반 완료       • 컨디션 태그        │
│  • toilet.name 헤더     • 음식 태그          │
│                         • AI 카메라 분석     │
│                                             │
│        ← 이 두 가지가 하나의 컴포넌트에 ─→  │
│              강하게 결합되어 있음            │
└─────────────────────────────────────────────┘
```

### 결합의 구체적 위치 (VisitModal.tsx)

- `props.checkInTime` — 방문 인증 타이머 직접 수신
- `props.toilet` — 화장실 정보 필수 수신
- `handleNext()` — 체류 시간 검증 (`canComplete`) 후에만 건강 데이터 제출 가능
- `onComplete()` — 항상 `toiletId` 포함하여 호출

### 결합의 구체적 위치 (MapPage.tsx)

- `handleVisitComplete()` — `latitude`, `longitude` 항상 포함 (위치 없으면 early return)
- `POST /records` 페이로드 — `toiletId` + 위치 좌표가 필수

---

## 5. 라우팅 구조

```
/              SplashPage
/main          MainPage (랜딩)
/map           MapPage  ← 건강 기록의 유일한 진입점
/ranking       RankingPage
/mypage        MyPage (건강 리포트 조회만 가능, 기록 불가)
/premium       PremiumPage
/support       SupportPage
/admin         AdminPage (관리자 전용)
```

---

## 6. Navbar 구성

```
[Day.Poo 로고] | [지도] [랭킹] [FAQ] | [마이페이지] [로그아웃] [알림벨]
```

- **"배변 기록하기" 글로벌 버튼 없음**
- 건강 기록 진입점이 `/map` → 화장실 선택 → 방문 인증 흐름 뿐

---

## 7. useGeoTracking 훅 동작

```
navigator.geolocation.watchPosition()
    └→ 실시간 위치 감지
         └→ 화장실 반경 150m 이내 진입 시
              └→ POST /records/check-in 자동 호출 (Fast Check-in)
                   └→ onAutoCheckIn(remainedSeconds) 콜백
                        └→ MapPage: checkInTime 상태 업데이트
```

- 쿨다운: 같은 화장실에 2분(120,000ms) 이내 재체크인 방지
- 로그인 상태일 때만 동작

---

## 8. 분리 구조 적용 시 변경이 필요한 지점

| 영역 | 현재 | 분리 후 필요한 변경 |
|------|------|------------------|
| `VisitRecord` 타입 | `toiletId` 필수 | `toiletId?: string` optional로 변경 |
| `PooRecordResponse` | `toiletId` 필수 | `toiletId?: number` optional로 변경 |
| `VisitModal` | 방문인증 + 건강기록 통합 | 건강기록 로직 분리 → `HealthLogModal` 신설 |
| `MapPage` | `handleVisitComplete`에 위치 좌표 필수 | 위치 없는 경우 처리 추가 |
| `Navbar` / 라우팅 | 기록 진입점 없음 | 글로벌 "기록하기" 버튼 또는 새 페이지 추가 |
| 백엔드 API | `POST /records`에 toiletId + 위치 필수 추정 | toiletId, 위치 optional 처리 필요 |

---

## 9. 분리 목표 구조 (개념도)

```
방문 인증 축                          건강 기록 축
────────────────────                  ────────────────────
[지도] → 화장실 선택                   [Navbar "기록하기"] 또는
    → 위치 인증 (150m)                 [MyPage "기록 추가"]
    → 60초 체류 확인                       ↓
    → 방문 완료 (EXP/포인트)          HealthLogModal
    → (선택) 건강 기록 연동 ──────→   • Bristol Scale
                                      • 색상 선택
                                      • 컨디션/음식 태그
                                      • (선택) toiletId 첨부
```

### 분리 후 데이터 모델

```
VisitRecord  = 화장실 ID + 위치 인증 + 체류 시간
HealthRecord = Bristol + 색상 + 태그 + toiletId? (optional)
```
