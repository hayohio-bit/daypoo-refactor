import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './apiClient';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const fetchMock = vi.fn();

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiClient 게스트 폴백', () => {
  it('토큰 리프레시 실패 시 Authorization 없이 재요청하고, 폴백 요청에는 새 타임아웃 signal을 사용한다', async () => {
    localStorage.setItem('accessToken', 'expired-access');
    localStorage.setItem('refreshToken', 'expired-refresh');

    fetchMock
      // 1차: 원 요청 → 401
      .mockResolvedValueOnce(jsonResponse(401, { message: 'unauthorized' }))
      // 2차: 리프레시 요청 → 실패
      .mockResolvedValueOnce(jsonResponse(401, { message: 'refresh failed' }))
      // 3차: 게스트 폴백 요청 → 성공
      .mockResolvedValueOnce(jsonResponse(200, { data: [{ id: 1 }] }));

    const result = await api.get<Array<{ id: number }>>('/toilets');

    expect(result).toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const originalInit = fetchMock.mock.calls[0][1];
    const guestInit = fetchMock.mock.calls[2][1];

    // 폴백 요청은 Authorization 헤더 없이 나간다
    expect(originalInit.headers['Authorization']).toBe('Bearer expired-access');
    expect(guestInit.headers['Authorization']).toBeUndefined();

    // 원 요청의 signal(타임아웃이 이미 해제됨)을 재사용하지 않고 새 signal을 쓴다
    expect(guestInit.signal).not.toBe(originalInit.signal);
    expect(guestInit.signal.aborted).toBe(false);

    // 실패한 토큰은 제거된다
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('토큰이 아예 없을 때 401이 나면 게스트 폴백 없이 인증 에러를 던진다', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { message: 'unauthorized' }));

    await expect(api.get('/favorites')).rejects.toMatchObject({
      code: 'AUTHENTICATION_REQUIRED',
      status: 401,
    });
    // 원 요청 1회만 발생 (리프레시 토큰이 없어 리프레시 시도도 실패로 즉시 귀결)
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('apiClient 재시도', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('GET 은 5xx 응답 뒤 1초 뒤에 한 번 더 요청한다', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(503, { message: 'unavailable' }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { ok: true } }));

    const pending = api.get<{ ok: boolean }>('/toilets');
    await vi.advanceTimersByTimeAsync(1000);

    await expect(pending).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('POST 는 5xx 응답에도 다시 보내지 않고 그대로 실패한다', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(502, { message: 'bad gateway' }));

    const pending = api.post('/records', { toiletId: 1 }).catch((e) => e);
    await vi.runAllTimersAsync();

    const error = await pending;
    expect(error).toMatchObject({ status: 502 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('POST 는 타임아웃에도 다시 보내지 않는다', async () => {
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
          });
        }),
    );

    const pending = api.post('/records/check-in', { toiletId: 1 }).catch((e) => e);
    await vi.runAllTimersAsync();

    const error = await pending;
    expect(error).toMatchObject({ code: 'TIMEOUT' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
