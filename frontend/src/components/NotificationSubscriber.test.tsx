import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationSubscriber } from './NotificationSubscriber';

// 실제 컨텍스트처럼 함수 참조가 렌더 간에 유지되어야 한다. 매 렌더 새 함수를 돌려주면
// connectSSE 가 매번 다시 만들어져 의존성 누락 결함이 가려진다.
const { showToast, issueSseToken, refreshUser, fetchNotifications, user } = vi.hoisted(() => ({
  showToast: vi.fn(),
  issueSseToken: vi.fn(),
  refreshUser: vi.fn(),
  fetchNotifications: vi.fn(),
  user: { id: 1, email: 'user@example.com' },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user, refreshUser }),
}));
vi.mock('../context/NotificationContext', () => ({
  useNotification: () => ({ fetchNotifications }),
}));
vi.mock('../context/ToastContext', () => ({
  useToast: () => ({ showToast }),
}));
vi.mock('../services/apiClient', () => ({
  getAccessToken: () => 'access-token',
}));
vi.mock('../services/notificationService', () => ({ issueSseToken }));

/** jsdom 에는 EventSource 가 없다. 생성된 인스턴스를 모아 두고 테스트가 onerror/onopen 을 직접 발생시킨다. */
class FakeEventSource {
  static instances: FakeEventSource[] = [];
  onopen: (() => void) | null = null;
  onerror: ((err: unknown) => void) | null = null;
  closed = false;

  constructor() {
    FakeEventSource.instances.push(this);
  }

  addEventListener() {}

  close() {
    this.closed = true;
  }
}

/** 비동기 connectSSE(토큰 발급 await)가 끝나고 지정 시간이 흐르도록 가짜 타이머를 진행한다. */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

async function failLatestConnection() {
  const latest = FakeEventSource.instances[FakeEventSource.instances.length - 1];
  await act(async () => {
    latest.onerror?.(new Event('error'));
  });
}

describe('NotificationSubscriber SSE 재연결', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeEventSource.instances = [];
    vi.stubGlobal('EventSource', FakeEventSource);
    issueSseToken.mockResolvedValue({ sseToken: 'sse-token' });
    showToast.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('재연결 지연이 1초, 2초, 4초로 늘어난다', async () => {
    render(<NotificationSubscriber />);
    await advance(0);
    expect(FakeEventSource.instances).toHaveLength(1);

    // n차 실패 → delay 직전까지는 재연결하지 않고, delay 시점에 재연결한다
    for (const [i, delay] of [1000, 2000, 4000].entries()) {
      await failLatestConnection();
      await advance(delay - 1);
      expect(FakeEventSource.instances).toHaveLength(i + 1);
      await advance(1);
      expect(FakeEventSource.instances).toHaveLength(i + 2);
    }
  });

  it('10회 재시도 뒤에는 재연결을 멈추고 안내 토스트를 띄운다', async () => {
    render(<NotificationSubscriber />);
    await advance(0);

    for (let i = 0; i < 10; i++) {
      await failLatestConnection();
      await advance(30000); // 최대 지연(30초)만큼 진행하면 반드시 재연결된다
    }
    expect(FakeEventSource.instances).toHaveLength(11);
    expect(showToast).not.toHaveBeenCalled();

    await failLatestConnection();
    await advance(30000);
    expect(FakeEventSource.instances).toHaveLength(11);
    expect(showToast).toHaveBeenCalledWith(
      '알림 연결 실패',
      expect.stringContaining('연결할 수 없습니다'),
      'info',
    );
  });

  it('연결에 성공하면 재시도 횟수를 되돌리되 다시 연결하지는 않는다', async () => {
    render(<NotificationSubscriber />);
    await advance(0);

    await failLatestConnection();
    await advance(1000);
    expect(FakeEventSource.instances).toHaveLength(2);

    await act(async () => {
      FakeEventSource.instances[1].onopen?.();
    });
    await advance(30000);
    expect(FakeEventSource.instances).toHaveLength(2);
    expect(FakeEventSource.instances[1].closed).toBe(false);

    // 성공 뒤 다시 실패하면 지연이 1초부터 시작한다
    await failLatestConnection();
    await advance(1000);
    expect(FakeEventSource.instances).toHaveLength(3);
  });
});
