import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NOTICE_BANNER_HEIGHT_CHANGE, NoticeBanner } from './NoticeBanner';

const { getPublicSettings } = vi.hoisted(() => ({ getPublicSettings: vi.fn() }));
vi.mock('../services/settingsService', () => ({ getPublicSettings }));

// jsdom 에는 ResizeObserver 가 없다. NoticeBanner 가 높이를 관찰하는 데만 쓰므로 빈 구현으로 대체한다.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);

describe('NoticeBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    document.documentElement.style.removeProperty('--notice-banner-height');
  });

  it('공지가 켜져 있으면 문구를 노출한다', async () => {
    getPublicSettings.mockResolvedValue({
      noticeEnabled: true,
      noticeMessage: '9월 10일 새벽 2시에 점검이 예정되어 있습니다.',
    });

    render(<NoticeBanner />);

    expect(
      await screen.findByText('9월 10일 새벽 2시에 점검이 예정되어 있습니다.'),
    ).toBeInTheDocument();
  });

  it('공지가 꺼져 있으면 배너를 그리지 않는다', async () => {
    getPublicSettings.mockResolvedValue({ noticeEnabled: false, noticeMessage: null });

    render(<NoticeBanner />);

    await waitFor(() => expect(getPublicSettings).toHaveBeenCalled());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('설정 조회에 실패해도 화면을 깨뜨리지 않고 배너만 감춘다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getPublicSettings.mockRejectedValue(new Error('네트워크 오류'));

    render(<NoticeBanner />);

    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    warn.mockRestore();
  });

  it('닫으면 배너가 사라지고 닫은 문구를 저장한다', async () => {
    getPublicSettings.mockResolvedValue({ noticeEnabled: true, noticeMessage: '점검 예정 안내' });

    render(<NoticeBanner />);
    await screen.findByText('점검 예정 안내');

    await userEvent.click(screen.getByRole('button', { name: '공지 닫기' }));

    await waitFor(() => expect(screen.queryByText('점검 예정 안내')).not.toBeInTheDocument());
    expect(localStorage.getItem('notice_dismissed_message')).toBe('점검 예정 안내');
    // 퇴장 애니메이션이 끝나면 높이 변수도 지워져야 Navbar 가 원래 자리로 돌아간다.
    await waitFor(() =>
      expect(document.documentElement.style.getPropertyValue('--notice-banner-height')).toBe(''),
    );
  });

  it('이미 닫은 문구와 같으면 다시 노출하지 않는다', async () => {
    localStorage.setItem('notice_dismissed_message', '점검 예정 안내');
    getPublicSettings.mockResolvedValue({ noticeEnabled: true, noticeMessage: '점검 예정 안내' });

    render(<NoticeBanner />);

    await waitFor(() => expect(getPublicSettings).toHaveBeenCalled());
    expect(screen.queryByText('점검 예정 안내')).not.toBeInTheDocument();
  });

  it('배너가 뜨고 질 때 Navbar 가 위치를 다시 재도록 이벤트를 알린다', async () => {
    getPublicSettings.mockResolvedValue({ noticeEnabled: true, noticeMessage: '점검 예정 안내' });
    const onHeightChange = vi.fn();
    window.addEventListener(NOTICE_BANNER_HEIGHT_CHANGE, onHeightChange);

    render(<NoticeBanner />);
    await screen.findByText('점검 예정 안내');
    expect(onHeightChange).toHaveBeenCalled();

    onHeightChange.mockClear();
    await userEvent.click(screen.getByRole('button', { name: '공지 닫기' }));

    await waitFor(() => expect(onHeightChange).toHaveBeenCalled());
    window.removeEventListener(NOTICE_BANNER_HEIGHT_CHANGE, onHeightChange);
  });

  it('공지 문구가 바뀌면 이전에 닫았더라도 다시 노출한다', async () => {
    localStorage.setItem('notice_dismissed_message', '지난 공지');
    getPublicSettings.mockResolvedValue({ noticeEnabled: true, noticeMessage: '새로운 공지' });

    render(<NoticeBanner />);

    expect(await screen.findByText('새로운 공지')).toBeInTheDocument();
  });
});
