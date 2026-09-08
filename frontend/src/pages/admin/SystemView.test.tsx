import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SystemSettings } from '../../types/admin';
import { SystemView } from './SystemView';

const { notifyError, notifySuccess, getSystemSettings, updateSystemSettings } = vi.hoisted(() => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
  getSystemSettings: vi.fn(),
  updateSystemSettings: vi.fn(),
}));
vi.mock('../../hooks/useFeedback', () => ({
  useFeedback: () => ({ notifyError, notifySuccess, notifyInfo: vi.fn() }),
}));
vi.mock('../../services/adminService', () => ({ getSystemSettings, updateSystemSettings }));

const stats = {
  totalUsers: 120,
  todayVisitors: 8,
  totalRecords: 340,
  pendingInquiries: 3,
  totalToilets: 28000,
} as never;

/** `GET /api/v1/admin/settings` 응답과 같은 형태다. */
const serverSettings: SystemSettings = {
  noticeMessage: 'Day Poo에 오신 것을 환영합니다!',
  noticeEnabled: false,
  maintenanceMode: false,
  signupEnabled: true,
  aiReportEnabled: true,
};

function renderView() {
  return render(
    <SystemView
      stats={stats}
      logs={[]}
      loading={false}
      onRefresh={() => {}}
      setActiveTab={() => {}}
    />,
  );
}

describe('SystemView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSystemSettings.mockResolvedValue(serverSettings);
    updateSystemSettings.mockImplementation(async (next: SystemSettings) => next);
  });

  /**
   * 아이콘을 import 하지 않은 채 JSX 에서 참조하면 타입 검사에서만 걸리고 빌드는 통과한 뒤
   * 화면을 열 때 ReferenceError 로 터진다. 렌더링만 해봐도 그 상황을 잡을 수 있다.
   */
  it('통계 카드가 있는 본문을 오류 없이 그린다', async () => {
    renderView();

    expect(screen.getByText('미답변 문의')).toBeInTheDocument();
    expect(screen.getByText('전체 화장실')).toBeInTheDocument();
    await waitFor(() => expect(getSystemSettings).toHaveBeenCalledTimes(1));
  });

  it('마운트 시 서버 설정을 읽어 토글 상태에 반영한다', async () => {
    renderView();

    expect(screen.getByText('설정을 불러오는 중입니다')).toBeInTheDocument();

    const notice = await screen.findByRole('button', { name: '공지사항 배너' });
    expect(notice).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '점검 모드' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: '신규 회원가입 허용' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('토글을 누르면 다섯 항목을 모두 담아 PUT 하고 응답값을 화면에 반영한다', async () => {
    // 서버가 요청과 다른 값을 돌려주면 화면은 서버 값을 따라야 한다.
    updateSystemSettings.mockResolvedValue({
      ...serverSettings,
      maintenanceMode: true,
      noticeEnabled: true,
      noticeMessage: '서버가 정규화한 공지',
    });
    renderView();
    const maintenance = await screen.findByRole('button', { name: '점검 모드' });

    await userEvent.click(maintenance);

    await waitFor(() =>
      expect(updateSystemSettings).toHaveBeenCalledWith({
        ...serverSettings,
        maintenanceMode: true,
      }),
    );
    expect(maintenance).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByText('서버가 정규화한 공지')).toBeInTheDocument();
    expect(notifySuccess).toHaveBeenCalled();
  });

  it('공지 문구 저장에 실패하면 편집 상태와 입력값을 유지한다', async () => {
    getSystemSettings.mockResolvedValue({ ...serverSettings, noticeEnabled: true });
    updateSystemSettings.mockRejectedValue(new Error('서버 오류'));
    renderView();
    await userEvent.click(await screen.findByRole('button', { name: '수정' }));
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, '새 공지');

    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(notifyError).toHaveBeenCalled());
    expect(screen.getByRole('textbox')).toHaveValue('새 공지');
  });

  it('공지 문구가 null 이어도 수정 입력창을 빈 문자열로 연다', async () => {
    getSystemSettings.mockResolvedValue({
      ...serverSettings,
      noticeEnabled: true,
      noticeMessage: null,
    });
    renderView();

    await userEvent.click(await screen.findByRole('button', { name: '수정' }));

    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('저장에 실패하면 이전 값으로 되돌리고 오류를 알린다', async () => {
    updateSystemSettings.mockRejectedValue(new Error('서버 오류'));
    renderView();
    const signup = await screen.findByRole('button', { name: '신규 회원가입 허용' });

    await userEvent.click(signup);

    await waitFor(() => expect(notifyError).toHaveBeenCalled());
    expect(signup).toHaveAttribute('aria-pressed', 'true');
  });

  it('설정 조회에 실패하면 오류를 알리고, 다시 시도 버튼으로 재조회한다', async () => {
    getSystemSettings.mockRejectedValueOnce(new Error('서버 오류'));
    renderView();

    await waitFor(() => expect(notifyError).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: '점검 모드' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /다시 시도/ }));

    expect(await screen.findByRole('button', { name: '점검 모드' })).toBeInTheDocument();
    expect(getSystemSettings).toHaveBeenCalledTimes(2);
  });
});
