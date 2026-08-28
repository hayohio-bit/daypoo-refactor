import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SystemView } from './SystemView';

vi.mock('../../hooks/useFeedback', () => ({
  useFeedback: () => ({ notifyError: vi.fn(), notifySuccess: vi.fn(), notifyInfo: vi.fn() }),
}));

vi.mock('../../services/adminService', () => ({
  getSystemSettings: vi.fn().mockResolvedValue({}),
  updateSystemSettings: vi.fn(),
}));

const stats = {
  totalUsers: 120,
  todayVisitors: 8,
  totalRecords: 340,
  pendingInquiries: 3,
  totalToilets: 28000,
} as never;

describe('SystemView', () => {
  /**
   * 아이콘을 import 하지 않은 채 JSX 에서 참조하면 타입 검사에서만 걸리고 빌드는 통과한 뒤
   * 화면을 열 때 ReferenceError 로 터진다. 렌더링만 해봐도 그 상황을 잡을 수 있다.
   */
  it('통계 카드가 있는 본문을 오류 없이 그린다', () => {
    render(
      <SystemView
        stats={stats}
        logs={[]}
        loading={false}
        onRefresh={() => {}}
        setActiveTab={() => {}}
      />,
    );

    expect(screen.getByText('미답변 문의')).toBeInTheDocument();
    expect(screen.getByText('전체 화장실')).toBeInTheDocument();
  });
});
