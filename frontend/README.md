# DayPoo Frontend 💩

DayPoo 서비스의 사용자 경험을 책임지는 현대적인 웹 프론트엔드 어플리케이션입니다. React 19와 Vite 7을 기반으로 구축되었으며, 최신 웹 기술 스택을 활용하여 빠르고 매끄러운 인터페이스를 제공합니다.

## 🚀 주요 기술 스택

### Core
- **Framework:** React 19 (TypeScript)
- **Build Tool:** Vite 7
- **Routing:** React Router DOM 7

### UI & Styling
- **Styling:** Tailwind CSS 4 & PostCSS 8
- **Animations:** Framer Motion 12
- **Icons:** Lucide React
- **Charts:** Recharts 3.8 (데이터 시각화)
- **Components:** Swiper (슬라이더), React Markdown (콘텐츠 렌더링)

### Features & Integrations
- **Payments:** Toss Payments SDK (토스페이먼츠 결제 연동)
- **Avatars:** Dicebear (다이내믹 아바타 생성)
- **Code Quality:** ESLint 9, Prettier, TypeScript

## 🛠️ 시작하기

### 사전 준비
- Node.js (최신 LTS 권장)
- npm 또는 yarn

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 로컬 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview
```

## 📂 프로젝트 구조

```text
src/
├── assets/      # 이미지, 폰트 등 정적 리소스
├── components/  # 재사용 가능한 UI 컴포넌트
├── context/     # 전역 상태 관리를 위한 React Context
├── hooks/       # 커스텀 React Hooks
├── pages/       # 라우트별 페이지 컴포넌트
├── services/    # API 호출 및 외부 SDK 연동 (Toss 등)
├── types/       # TypeScript 타입 정의
└── utils/       # 공통 유틸리티 함수
```

## 💎 주요 기능

- **실시간 데이터 시각화:** Recharts를 이용한 건강/활동 데이터 차트 제공
- **안전한 결제 시스템:** 토스페이먼츠 SDK를 통한 구독 및 결제 프로세스
- **인터랙티브 UI:** Framer Motion을 활용한 부드러운 전환 효과 및 애니메이션
- **개인화 서비스:** Dicebear API를 이용한 사용자별 맞춤형 아바타 시스템

## 🤝 코드 컨벤션

- **Linting:** `npm run lint` 명령어로 코드 스타일 및 오류를 점검합니다.
- **Formatting:** Prettier를 사용하여 일관된 코드 포맷을 유지합니다.
- **Strict Typing:** 모든 컴포넌트와 유틸리티에 엄격한 TypeScript 타입을 적용합니다.
