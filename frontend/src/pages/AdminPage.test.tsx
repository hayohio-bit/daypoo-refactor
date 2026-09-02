import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { AdminPage } from './AdminPage';

// framer-motion 의 whileInView 가 IntersectionObserver 를 요구하는데 jsdom 에는 없다.
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

vi.mock('../services/apiClient', () => ({
  api: { get: vi.fn().mockResolvedValue({}), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

describe('AdminPage', () => {
  /**
   * 사이드바 메뉴의 아이콘은 모두 lucide-react 에서 정적으로 import 한 컴포넌트여야 한다.
   * 한때 '유저 관리' 항목만 require('lucide-react') 로 아이콘을 가져오도록 되어 있었고,
   * 브라우저(ESM)에는 require 가 없어 관리자로 로그인하는 즉시 ErrorBoundary 화면이 떴다.
   * vitest 환경에는 require 가 존재하므로 이 테스트만으로는 그 회귀를 잡지 못한다.
   * require 사용 자체는 biome 의 noCommonJs 규칙이 막고, 이 테스트는 메뉴가 실제로
   * 렌더링되는지(아이콘이 Promise 같은 비컴포넌트 값이 아닌지)를 확인한다.
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
