import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useFeedback } from '../hooks/useFeedback';
import { NotificationProvider, useNotification } from './NotificationContext';

vi.mock('./AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, nickname: '테스터' } }),
}));

vi.mock('../services/notificationService', () => ({
  getNotifications: vi.fn().mockResolvedValue([]),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
  deleteNotification: vi.fn(),
}));

/** 토스트를 띄우는 버튼. `useFeedback` 구독자를 대표한다. */
function ErrorTrigger({ error }: { error: unknown }) {
  const { notifyError } = useFeedback();
  return (
    <button type="button" onClick={() => notifyError(error, '저장 실패')}>
      실행
    </button>
  );
}

/** 알림 목록 컨텍스트 구독자. 렌더링 횟수를 세어 둔다. */
function ListSubscriber({ onRender }: { onRender: (count: number) => void }) {
  const { unreadCount } = useNotification();
  const renders = useRef(0);
  renders.current += 1;
  onRender(renders.current);
  return <span data-testid="unread">{unreadCount}</span>;
}

describe('토스트 알림', () => {
  it('apiClient 가 채운 서버 메시지를 토스트 본문으로 보여준다', async () => {
    const user = userEvent.setup();
    const serverError = Object.assign(new Error('이미 등록된 후기입니다.'), {
      code: 'T002',
      status: 400,
    });

    render(
      <NotificationProvider>
        <ErrorTrigger error={serverError} />
      </NotificationProvider>,
    );

    await user.click(screen.getByRole('button', { name: '실행' }));

    await waitFor(() => {
      expect(screen.getByText('저장 실패')).toBeInTheDocument();
    });
    expect(screen.getByText('이미 등록된 후기입니다.')).toBeInTheDocument();
  });

  it('메시지가 없는 값에는 공통 기본 문구를 쓴다', async () => {
    const user = userEvent.setup();

    render(
      <NotificationProvider>
        <ErrorTrigger error={undefined} />
      </NotificationProvider>,
    );

    await user.click(screen.getByRole('button', { name: '실행' }));

    await waitFor(() => {
      expect(screen.getByText('요청 처리에 실패했습니다.')).toBeInTheDocument();
    });
  });

  it('토스트가 떠도 알림 목록 구독자는 다시 렌더링되지 않는다', async () => {
    const user = userEvent.setup();
    let renderCount = 0;

    render(
      <NotificationProvider>
        <ListSubscriber
          onRender={(count) => {
            renderCount = count;
          }}
        />
        <ErrorTrigger error={new Error('무언가 잘못되었습니다.')} />
      </NotificationProvider>,
    );

    const before = renderCount;
    await user.click(screen.getByRole('button', { name: '실행' }));

    await waitFor(() => {
      expect(screen.getByText('무언가 잘못되었습니다.')).toBeInTheDocument();
    });
    expect(renderCount).toBe(before);
  });
});
