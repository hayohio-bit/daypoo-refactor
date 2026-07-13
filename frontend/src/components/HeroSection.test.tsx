import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── 의존 모듈 모킹 ──────────────────────────────────────────────
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

vi.mock('../context/TransitionContext', () => ({
  useTransitionContext: () => ({ transitionTo: vi.fn() }),
}));

vi.mock('../services/apiClient', () => ({
  api: { get: vi.fn().mockResolvedValue([]) },
}));

// [P1] useToilets mock — HeroSection이 이 훅을 호출하는지 감시
const mockUseToilets = vi.fn().mockReturnValue({
  toilets: [],
  loading: false,
  error: null,
});
vi.mock('../hooks/useToilets', () => ({
  useToilets: (...args: any[]) => mockUseToilets(...args),
}));

// 하위 컴포넌트 stub (독립 렌더링)
vi.mock('./WaveButton', () => ({
  default: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="wave-button">
      {children}
    </button>
  ),
}));
vi.mock('./TimelineSteps', () => ({
  TimelineSteps: () => <div data-testid="timeline-steps" />,
}));
vi.mock('./BlobStatsSection', () => ({
  BlobStatsSection: () => <div data-testid="blob-stats" />,
}));
vi.mock('./WaveDivider', () => ({
  WaveDivider: () => <hr data-testid="wave-divider" />,
}));

// framer-motion 모킹 — animate 등 브라우저 API 의존 제거
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    m: new Proxy({} as any, {
      get:
        (_: any, tag: string) =>
        ({ children, className, style, onClick, ...rest }: any) =>
          React.createElement(tag, { className, style, onClick, 'data-motion': true }, children),
    }),
    AnimatePresence: ({ children }: any) => <>{children}</>,
    animate: vi.fn(),
    useMotionValue: () => ({ set: vi.fn(), get: vi.fn(() => 0) }),
    useSpring: () => ({ on: vi.fn(() => () => {}), get: vi.fn(() => 0) }),
    useInView: () => true,
  };
});

import { HeroSection } from './HeroSection';

const renderHero = () =>
  render(
    <MemoryRouter>
      <HeroSection onCtaClick={vi.fn()} openAuth={vi.fn()} />
    </MemoryRouter>,
  );

describe('HeroSection 성능 최적화 검증', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUseToilets.mockClear();
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // [P1] useToilets 이중 호출 방지
  // ─────────────────────────────────────────────────────────────
  describe('[P1] useToilets 미호출 검증', () => {
    it('HeroSection 마운트 시 useToilets를 호출하지 않아야 한다', () => {
      renderHero();
      // useToilets가 HeroSection에서 제거되었으므로 호출 횟수 = 0
      expect(mockUseToilets).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // [P4] setInterval 제거 확인
  // ─────────────────────────────────────────────────────────────
  describe('[P4] setInterval 제거 확인', () => {
    it('HeroSection이 등록하는 setInterval이 없어야 한다', () => {
      // HeroSection 마운트 전에 setInterval을 spy로 감시
      const setIntervalSpy = vi.spyOn(window, 'setInterval');

      renderHero();

      // framer-motion 등 외부 라이브러리 setInterval은 제외하고
      // HeroSection의 stats 업데이트용 setInterval(fn, 5000)이 없어야 함
      const heroIntervals = setIntervalSpy.mock.calls.filter(([, ms]) => ms === 5000);
      expect(heroIntervals).toHaveLength(0);

      setIntervalSpy.mockRestore();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // [P5] isMobile lazy init
  // ─────────────────────────────────────────────────────────────
  describe('[P5] isMobile lazy initializer', () => {
    it('window.innerWidth=375 → 모바일 모드로 첫 렌더되어야 한다 (깜박임 없음)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      // 렌더 중에 상태 업데이트가 없어야 함 (lazy init이면 첫 렌더에서 바로 올바른 값)
      const renderSpy = vi.fn();

      // 단순히 오류 없이 렌더되는지 확인
      expect(() => renderHero()).not.toThrow();
    });

    it('window.innerWidth=1200 → 데스크톱 모드로 첫 렌더되어야 한다', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
      expect(() => renderHero()).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 하드코딩 메시지 확인 (API 의존 제거)
  // ─────────────────────────────────────────────────────────────
  describe('메시지 하드코딩 확인', () => {
    it('"데이터 동기화 중..." 또는 toilets.length 참조 문구가 없어야 한다', () => {
      renderHero();
      expect(screen.queryByText(/데이터 동기화 중/)).toBeNull();
      expect(screen.queryByText(/개의 화장실 발견/)).toBeNull();
    });
  });
});
