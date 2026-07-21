import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquare,
  Settings,
  ShoppingBag,
  Star,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiClient';
import type {
  AdminStatsResponse,
  AdminTitleResponse,
  ItemResponse,
} from '../types/admin';

// ── 분할된 서브 뷰 임포트 ───────────────────────────────────────────────
import { COLORS, type AdminTab } from './admin/adminCommons';
import { DashboardView } from './admin/DashboardView';
import { UsersView } from './admin/UsersView';
import { ToiletsView } from './admin/ToiletsView';
import { CsView } from './admin/CsView';
import { StoreView } from './admin/StoreView';
import { TitleManagementView } from './admin/TitleManagementView';
import { AddTitleView } from './admin/AddTitleView';
import { SystemView, type SystemLog } from './admin/SystemView';
import { AddItemView } from './admin/AddItemView';
import { EditItemView } from './admin/EditItemView';
import { LogsView } from './admin/LogsView';

// ── Main Page Layout: Admin Dashboard ─────────────────────────────────

export function AdminPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [editingTitle, setEditingTitle] = useState<AdminTitleResponse | null>(null);
  const [editingItem, setEditingItem] = useState<ItemResponse | null>(null);

  // Dashboard 통계 데이터 상태 관리
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // 알림 확인 여부 관리 (localStorage 연동)
  const [visitedTabs, setVisitedTabs] = useState<AdminTab[]>(() => {
    const saved = localStorage.getItem('daypoo_admin_visited_tabs');
    return saved ? JSON.parse(saved) : [];
  });

  // 탭 변경 시 방문 기록 추가 및 저장
  const handleTabChange = (tabId: AdminTab) => {
    setActiveTab(tabId);
    setVisitedTabs((prev) => {
      if (!prev.includes(tabId)) {
        const next = [...prev, tabId];
        localStorage.setItem('daypoo_admin_visited_tabs', JSON.stringify(next));
        return next;
      }
      return prev;
    });
  };

  // 권한 체크 로직 (즉시 리다이렉트)
  const isAdmin =
    user &&
    ((typeof user.role === 'string' && user.role.toUpperCase().includes('ADMIN')) ||
      (Array.isArray(user.role) &&
        user.role.some((r: string) => r.toUpperCase().includes('ADMIN'))));

  // 로딩 완료 후 권한 없으면 즉시 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      console.group('🚫 Unauthorized Access Blocked');
      console.warn('Page: AdminPage');
      console.warn('User ID:', user?.id);
      console.warn('User Role:', user?.role);
      console.groupEnd();
      navigate('/main', { replace: true });
    }
  }, [authLoading, isAdmin, user, navigate]);

  // H-3 개선: fetchStats를 useCallback으로 래핑하여 리렌더링 시 함수가 계속 생성되는 것을 방지
  const fetchStats = useCallback(async () => {
    try {
      const [statsData, logsData] = await Promise.all([
        api.get<AdminStatsResponse>('/admin/stats'),
        api.get<SystemLog[]>('/admin/logs'),
      ]);
      setStats(statsData);
      setLogs(Array.isArray(logsData) ? logsData : []);
    } catch (err) {
      console.error('Admin data fetch error', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    // 5분마다 통계 데이터 갱신
    const statsTimer = setInterval(fetchStats, 300000);

    return () => {
      clearInterval(t);
      clearInterval(statsTimer);
    };
  }, [fetchStats]);

  // 로딩 중이거나 권한 없는 경우 빈 화면
  if (authLoading || !isAdmin) {
    return null;
  }

  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    {
      id: 'users',
      label: '유저 관리',
      icon: import('lucide-react').then((m) => m.Users), // 동적으로 lucide-react에서 icon을 들고오는 구조 대응용 (Menu에서 직접 Users 컴포넌트로 전달)
      badge:
        !visitedTabs.includes('users') && stats?.todayNewUsers && stats.todayNewUsers > 0
          ? stats.todayNewUsers
          : undefined,
    },
    {
      id: 'toilets',
      label: '화장실 관리',
      icon: MapPin,
      badge: undefined,
    },
    {
      id: 'cs',
      label: '고객 지원',
      icon: MessageSquare,
      badge:
        !visitedTabs.includes('cs') && stats?.pendingInquiries && stats.pendingInquiries > 0
          ? stats.pendingInquiries
          : undefined,
    },
    { id: 'store', label: '프리미엄 상점', icon: ShoppingBag },
    { id: 'titles', label: '칭호 시스템', icon: Star },
    { id: 'system', label: '시스템 설정', icon: Settings },
  ];

  return (
    <div
      className="flex h-screen overflow-hidden font-['Pretendard'] bg-cover bg-no-repeat"
      style={{ background: COLORS.background }}
    >
      {/* Sidebar Navigation */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 96 : 300 }}
        className="h-full border-r bg-white/85 backdrop-blur-3xl z-30 transition-all flex flex-col py-8"
        style={{ borderColor: COLORS.border }}
      >
        <div
          className={`mb-12 px-6 flex items-center justify-between ${
            sidebarCollapsed ? 'justify-center mx-auto' : ''
          }`}
        >
          {!sidebarCollapsed && (
            <motion.span
              onClick={() => setActiveTab('dashboard')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-black cursor-pointer"
              style={{
                fontFamily: "'SchoolSafetyNotification'",
                color: COLORS.primary,
                letterSpacing: '-0.05em',
              }}
            >
              Day<span style={{ color: COLORS.accent }}>.</span>Poo
              <span className="ml-2 px-2 py-0.5 text-[9px] bg-[#E8A838]/20 text-[#E8A838] rounded-lg">
                ADMIN
              </span>
            </motion.span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            className="p-2 rounded-xl hover:bg-black/5 transition-colors text-[#1B4332]"
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 w-full space-y-2 px-4">
          {menuItems.map((item) => {
            const IconComponent = item.id === 'users' ? require('lucide-react').Users : item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id as AdminTab)}
                className="group relative w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all overflow-hidden"
                style={{ color: activeTab === item.id ? COLORS.primary : COLORS.textSecondary }}
              >
                {activeTab === item.id && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-[#1B4332]/5 border-r-[4px] border-[#1B4332]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <div
                  className={`relative z-10 p-1.5 rounded-xl transition-all ${
                    activeTab === item.id
                      ? 'bg-[#1B4332] text-white shadow-lg shadow-green-900/20'
                      : 'group-hover:bg-black/5'
                  }`}
                >
                  <IconComponent size={20} />
                </div>
                {!sidebarCollapsed && (
                  <span className="relative z-10 text-sm font-black tracking-tight flex-1 text-left">
                    {item.label}
                  </span>
                )}
                {item.badge && !sidebarCollapsed && (
                  <span className="relative z-10 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-[#FF4B4B] text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="w-full px-4 mt-auto space-y-1">
          <button
            onClick={() => navigate('/main')}
            className="w-full py-4 rounded-2xl flex items-center gap-4 px-4 transition-colors hover:bg-emerald-50 text-emerald-600 font-bold text-sm"
          >
            <div className="p-1.5 rounded-xl bg-emerald-100">
              <Home size={20} />
            </div>
            {!sidebarCollapsed && <span>메인 페이지로</span>}
          </button>
          <button
            onClick={logout}
            className="w-full py-4 rounded-2xl flex items-center gap-4 px-4 transition-colors hover:bg-red-50 text-red-500 font-bold text-sm"
          >
            <div className="p-1.5 rounded-xl bg-red-100">
              <LogOut size={20} />
            </div>
            {!sidebarCollapsed && <span>로그아웃</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Shell */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative flex flex-col">
        {/* Header / TopBar */}
        <header
          className="sticky top-0 z-20 px-8 py-5 flex items-center justify-between transition-all backdrop-blur-md border-b bg-white/40"
          style={{ borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-4">
            <div
              className="p-2.5 rounded-2xl bg-white shadow-sm border"
              style={{ borderColor: COLORS.border }}
            >
              {activeTab === 'dashboard' ? (
                <LayoutDashboard size={20} style={{ color: COLORS.primary }} />
              ) : activeTab === 'users' ? (
                <span className="text-[#1B4332] font-black text-sm flex items-center justify-center w-5 h-5">U</span>
              ) : activeTab === 'toilets' ? (
                <MapPin size={20} style={{ color: COLORS.primary }} />
              ) : activeTab === 'cs' ? (
                <MessageSquare size={20} style={{ color: COLORS.primary }} />
              ) : activeTab === 'store' ? (
                <ShoppingBag size={20} style={{ color: COLORS.primary }} />
              ) : activeTab === 'titles' ? (
                <Star size={20} style={{ color: COLORS.primary }} />
              ) : (
                <Settings size={20} style={{ color: COLORS.primary }} />
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-black text-black/90 uppercase tracking-widest leading-none mb-1">
                {activeTab === 'dashboard'
                  ? '관리자 대시보드'
                  : activeTab === 'users'
                  ? '유저 제어 센터'
                  : activeTab === 'toilets'
                  ? '맵 엔진 관제'
                  : activeTab === 'cs'
                  ? '고객 통합 지원'
                  : activeTab === 'store'
                  ? '프리미엄 샵 관리'
                  : activeTab === 'titles'
                  ? '칭호 시스템 엔진'
                  : activeTab === 'add-title'
                  ? '신규 칭호 마스터 클래스'
                  : activeTab === 'add-item'
                  ? '신규 아이템 카탈로그'
                  : activeTab === 'edit-item'
                  ? '아이템 데이터 마스터 수정'
                  : activeTab === 'logs'
                  ? '시스템 런타임 로그'
                  : '시스템 인프라 설정'}
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-black/40 font-bold">
                <Calendar size={12} /> {currentTime.toLocaleDateString()}
                <Clock size={12} className="ml-2" /> {currentTime.toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 group cursor-pointer pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-black/80 leading-none">시스템 마스터</p>
                <p className="text-[10px] font-bold text-black/30 mt-1 uppercase tracking-tighter">
                  최고 관리자 계정
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-2xl overflow-hidden shadow-md border-2 border-[#1B4332]/20 group-hover:scale-105 transition-transform flex items-center justify-center">
                <span className="text-xl">💩</span>
              </div>
            </div>
          </div>
        </header>

        {/* View Container */}
        <section className="flex-1 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {activeTab === 'dashboard' && (
                <DashboardView
                  stats={stats}
                  logs={logs}
                  loading={statsLoading}
                  setActiveTab={handleTabChange}
                />
              )}
              {activeTab === 'users' && <UsersView />}
              {activeTab === 'toilets' && <ToiletsView />}
              {activeTab === 'cs' && <CsView stats={stats} onStatsRefresh={fetchStats} />}
              {activeTab === 'store' && (
                <StoreView setActiveTab={handleTabChange} setEditingItem={setEditingItem} />
              )}
              {activeTab === 'titles' && (
                <TitleManagementView
                  setActiveTab={handleTabChange}
                  setEditingTitle={setEditingTitle}
                />
              )}
              {activeTab === 'add-title' && (
                <AddTitleView setActiveTab={handleTabChange} editingTitle={editingTitle} />
              )}
              {activeTab === 'system' && (
                <SystemView
                  stats={stats}
                  logs={logs}
                  loading={statsLoading}
                  onRefresh={fetchStats}
                  setActiveTab={handleTabChange}
                />
              )}
              {activeTab === 'add-item' && <AddItemView setActiveTab={handleTabChange} />}
              {activeTab === 'edit-item' && editingItem && (
                <EditItemView setActiveTab={handleTabChange} editingItem={editingItem} />
              )}
              {activeTab === 'logs' && <LogsView logs={logs} loading={statsLoading} />}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      {/* Background Decoration */}
      <div className="fixed top-0 right-0 -z-10 w-[800px] h-[800px] bg-[#1B4332]/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-[#E8A838]/5 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />
    </div>
  );
}
export default AdminPage;
