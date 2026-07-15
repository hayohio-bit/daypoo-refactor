/**
 * App.tsx 구조 검증 테스트
 *
 * - [P2] 각 페이지 모듈이 named export로 올바르게 정의되어 있는지 확인
 *        (dynamic import 가능 여부 = 모듈 구조 검증)
 * - [P9] AdminRoute에 console.log가 없는지 확인
 *
 * 주의: 무거운 페이지 컴포넌트를 실제로 렌더링하지 않고
 *       named export 존재 여부만 검증하여 테스트 속도를 보장합니다.
 */
import { describe, expect, it, vi } from 'vitest';

// ─────────────────────────────────────────────────────────────────
// [P2] 페이지 모듈 named export 검증 (dynamic import 분리 전제 조건)
// ─────────────────────────────────────────────────────────────────
describe('[P2] 페이지 lazy import 전제: named export 구조', () => {
  it('MainPage가 named export로 정의되어야 한다', async () => {
    const mod = await import('./pages/MainPage');
    expect(typeof mod.MainPage).toBe('function');
  }, 30000);

  it('MapPage가 named export로 정의되어야 한다', async () => {
    const mod = await import('./pages/MapPage');
    expect(typeof mod.MapPage).toBe('function');
  }, 30000);

  it('RankingPage가 named export로 정의되어야 한다', async () => {
    const mod = await import('./pages/RankingPage');
    expect(typeof mod.RankingPage).toBe('function');
  }, 30000);

  it('SplashPage가 named export로 정의되어야 한다', async () => {
    const mod = await import('./pages/SplashPage');
    expect(typeof mod.SplashPage).toBe('function');
  }, 30000);

  it('AuthCallback이 named export로 정의되어야 한다', async () => {
    const mod = await import('./pages/AuthCallback');
    expect(typeof mod.AuthCallback).toBe('function');
  }, 30000);

  it('SocialSignupPage가 named export로 정의되어야 한다', async () => {
    const mod = await import('./pages/SocialSignupPage');
    expect(typeof mod.SocialSignupPage).toBe('function');
  }, 30000);

  it('ServerErrorPage가 named export로 정의되어야 한다', async () => {
    const mod = await import('./pages/ServerErrorPage');
    expect(typeof mod.ServerErrorPage).toBe('function');
  }, 30000);
});

// ─────────────────────────────────────────────────────────────────
// [P9] AdminRoute console.log 제거 — 소스 텍스트 직접 검증
// ─────────────────────────────────────────────────────────────────
describe('[P9] AdminRoute 디버그 console 제거 검증', () => {
  it('App.tsx에 "[AdminRoute] Debug" 문자열이 없어야 한다', async () => {
    // Node.js 환경에서 소스 파일을 직접 읽어 검증
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(__dirname, 'App.tsx');
    const source = fs.readFileSync(filePath, 'utf-8');

    expect(source).not.toContain('[AdminRoute] Debug');
    expect(source).not.toContain("console.log('[AdminRoute]");
    expect(source).not.toContain("console.error('[AdminRoute]");
  });
});

// ─────────────────────────────────────────────────────────────────
// [P2] Suspense fallback 검증
// ─────────────────────────────────────────────────────────────────
describe('[P2] Suspense fallback 검증', () => {
  it('App.tsx 파일 내에 Suspense fallback으로 LoadingPage가 설정되어 있어야 한다', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(__dirname, 'App.tsx');
    const source = fs.readFileSync(filePath, 'utf-8');

    expect(source).toContain('Suspense fallback={<LoadingPage />}');
  });
});
