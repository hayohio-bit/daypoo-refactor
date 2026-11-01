import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

const { getMe } = vi.hoisted(() => ({ getMe: vi.fn() }));
vi.mock('../services/authService', () => ({
  getMe,
  logout: vi.fn().mockResolvedValue(undefined),
  deleteMe: vi.fn(),
}));

type AuthValue = ReturnType<typeof useAuth>;

/** AuthProvider 의 최신 컨텍스트 값과 loading 변화 이력을 노출한다. */
function renderProvider() {
  const ref: { current: AuthValue | null } = { current: null };
  const loadingHistory: boolean[] = [];
  function Probe() {
    const value = useAuth();
    ref.current = value;
    loadingHistory.push(value.loading);
    return null;
  }
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  return { ref, loadingHistory };
}

const USER = { id: 1, email: 'user@example.com', nickname: 'user', role: 'ROLE_USER' };

function apiError(status: number, code: string) {
  return Object.assign(new Error(code), { status, code });
}

describe('AuthContext 사용자 새로고침', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    getMe.mockReset();
    vi.useRealTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('accessToken', 'access');
    localStorage.setItem('refreshToken', 'refresh');
  });

  it('초기 로드에서 사용자 정보를 읽어 온다', async () => {
    getMe.mockResolvedValue(USER);
    const { ref } = renderProvider();

    await waitFor(() => expect(ref.current?.loading).toBe(false));
    expect(ref.current?.user).toEqual(USER);
  });

  it('일시적인 네트워크 오류로는 토큰을 지우지 않는다', async () => {
    getMe.mockResolvedValueOnce(USER);
    const { ref } = renderProvider();
    await waitFor(() => expect(ref.current?.user).toEqual(USER));

    getMe.mockRejectedValueOnce(apiError(0, 'NETWORK_ERROR'));
    await act(async () => {
      await ref.current?.refreshUser();
    });

    expect(localStorage.getItem('accessToken')).toBe('access');
    expect(localStorage.getItem('refreshToken')).toBe('refresh');
    expect(ref.current?.user).toEqual(USER); // 이미 읽어 온 사용자 정보도 유지
  });

  it('서버 5xx 오류로도 토큰을 지우지 않는다', async () => {
    getMe.mockRejectedValueOnce(apiError(503, 'UNKNOWN'));
    const { ref } = renderProvider();
    await waitFor(() => expect(ref.current?.loading).toBe(false));

    expect(localStorage.getItem('accessToken')).toBe('access');
  });

  it('인증이 만료되면(401) 토큰과 사용자 정보를 정리한다', async () => {
    getMe.mockResolvedValueOnce(USER);
    const { ref } = renderProvider();
    await waitFor(() => expect(ref.current?.user).toEqual(USER));

    getMe.mockRejectedValueOnce(apiError(401, 'AUTHENTICATION_REQUIRED'));
    await act(async () => {
      await ref.current?.refreshUser();
    });

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(ref.current?.user).toBeNull();
  });

  it('첫 로드가 끝난 뒤의 새로고침은 loading 을 다시 올리지 않는다', async () => {
    getMe.mockResolvedValueOnce(USER);
    const { ref, loadingHistory } = renderProvider();
    await waitFor(() => expect(ref.current?.loading).toBe(false));
    const afterInitial = loadingHistory.length;

    // 응답이 오기 전의 중간 상태를 관찰하려고 getMe 를 보류시킨다
    let resolveMe: (value: unknown) => void = () => {};
    getMe.mockReturnValueOnce(new Promise((resolve) => (resolveMe = resolve)));
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = ref.current?.refreshUser() ?? Promise.resolve();
    });
    expect(ref.current?.loading).toBe(false);

    await act(async () => {
      resolveMe(USER);
      await pending;
    });

    expect(loadingHistory.slice(afterInitial)).not.toContain(true);
  });

  it('첫 로드가 일시 오류로 실패하면 토큰을 유지한 채 다시 시도해 사용자 정보를 읽어 온다', async () => {
    vi.useFakeTimers();
    try {
      getMe.mockRejectedValueOnce(apiError(0, 'NETWORK_ERROR')).mockResolvedValueOnce(USER);
      const { ref } = renderProvider();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(ref.current?.loading).toBe(false);
      expect(ref.current?.user).toBeNull();
      expect(ref.current?.isAuthenticated).toBe(false);
      expect(localStorage.getItem('accessToken')).toBe('access');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });
      expect(ref.current?.user).toEqual(USER);
      expect(getMe).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('재시도는 정해진 횟수에서 멈춘다', async () => {
    vi.useFakeTimers();
    try {
      getMe.mockRejectedValue(apiError(503, 'UNKNOWN'));
      renderProvider();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });

      expect(getMe).toHaveBeenCalledTimes(4); // 최초 1회 + 재시도 3회
    } finally {
      vi.useRealTimers();
    }
  });

  it('로그인 직후 사용자 정보를 읽지 못하면 성공으로 끝내지 않고 토큰은 유지한다', async () => {
    localStorage.clear();
    getMe.mockRejectedValue(apiError(503, 'UNKNOWN'));
    const { ref } = renderProvider();
    await waitFor(() => expect(ref.current?.loading).toBe(false));

    await expect(
      act(async () => {
        await ref.current?.login('new-access', 'new-refresh', true);
      }),
    ).rejects.toThrow('사용자 정보를 불러오지 못했습니다');

    expect(localStorage.getItem('accessToken')).toBe('new-access');
  });

  it('로그아웃 전에 보낸 사용자 정보 응답이 로그아웃 뒤에 도착해도 상태를 덮어쓰지 않는다', async () => {
    getMe.mockResolvedValueOnce(USER);
    const { ref } = renderProvider();
    await waitFor(() => expect(ref.current?.user).toEqual(USER));

    let resolveMe: (value: unknown) => void = () => {};
    getMe.mockReturnValueOnce(new Promise((resolve) => (resolveMe = resolve)));
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = ref.current?.refreshUser() ?? Promise.resolve();
    });

    await act(async () => {
      await ref.current?.logout();
    });
    expect(ref.current?.user).toBeNull();

    await act(async () => {
      resolveMe(USER);
      await pending;
    });

    expect(ref.current?.user).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
