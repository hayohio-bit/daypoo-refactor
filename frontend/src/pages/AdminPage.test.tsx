import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { AdminPage } from './AdminPage';

// 대시보드의 CountUp 이 framer-motion useInView 로 IntersectionObserver 를 요구하는데 jsdom 에는 없다.
beforeAll(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'admin@example.com', nickname: '관리자', role: 'ROLE_ADMIN' },
    loading: false,
    logout: vi.fn(),
  }),
}));

vi.mock('../services/adminService', () => ({
  getAdminStats: vi.fn().mockResolvedValue({
    totalUsers: 0,
    totalToilets: 0,
    pendingInquiries: 0,
    todayNewUsers: 0,
    todayInquiries: 0,
    weeklyTrend: [],
  }),
  getSystemLogs: vi.fn().mockResolvedValue([]),
}));

describe('AdminPage', () => {
  /**
   * 관리자 페이지의 렌더링 스모크 테스트. 사이드바 메뉴 아이콘이 컴포넌트가 아닌 값
   * (예: 동적 import 가 돌려주는 Promise)이면 렌더링이 실패한다.
   * require('lucide-react') 로 인한 브라우저 전용 회귀는 vitest 에 require 가 있어
   * 여기서 잡히지 않으며, biome 의 noCommonJs 규칙이 막는다.
   */
  it('관리자로 로그인하면 사이드바 메뉴가 오류 없이 그려진다', async () => {
    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('button', { name: /유저 관리/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /대시보드/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /화장실 관리/ })).toBeInTheDocument();
  });
});
