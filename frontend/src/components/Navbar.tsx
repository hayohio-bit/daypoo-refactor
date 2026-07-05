import { m, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Map,
  Trophy,
  HelpCircle,
  Crown,
  Home,
  Plus,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { AnimatedUnderlink } from './AnimatedUnderlink';
import WaveButton from './WaveButton';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { NotificationPanel } from './NotificationPanel';
import { HealthLogModal, HealthLogResult } from './map/HealthLogModal';
import { api } from '../services/apiClient';
import { HealthRecordRequest } from '../types/api';
import { useTransitionContext } from '../context/TransitionContext';
import { isTouchDevice } from '../hooks/useIsTouchDevice';

const NAV_LINKS = [
  { label: '지도', path: '/map', icon: Map, variant: 0 },
  { label: '랭킹', path: '/ranking', icon: Trophy, variant: 1 },
  { label: 'FAQ', path: '/support', icon: HelpCircle, variant: 0 },
];

export function Navbar({ openAuth }: { openAuth: (mode: 'login' | 'signup') => void }) {
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 100], [1, 0.97]);
  const [hidden, setHidden] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount, fetchNotifications } = useNotification();
  const { transitionTo } = useTransitionContext();
  const [notifOpen, setNotifOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showHealthLog, setShowHealthLog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const handleLogout = () => {
    logout();
    setDrawerOpen(false);
    navigate('/main');
  };

  const handleLogoClick = () => {
    if (window.location.pathname.endsWith('/main') || window.location.pathname.endsWith('/')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isActivePath = (path: string) => location.pathname === path;

  const handleHealthLogComplete = async (result: HealthLogResult) => {
    try {
      const payload: HealthRecordRequest = {
        conditionTags: result.conditionTags,
        dietTags: result.foodTags,
        ...(result.bristolType !== null && { bristolScale: result.bristolType }),
        ...(result.color !== null && { color: result.color }),
        ...(result.imageBase64 && { imageBase64: result.imageBase64 }),
      };
      await api.post('/records', payload);
    } catch (e: any) {
      if (e.code === 'R007') {
        alert('똥 사진이 아닌 것 같아요!\n변기 안의 변을 다시 촬영해주세요. 💩');
      } else {
        alert(`기록 저장 실패: ${e.message || '서버 오류'}`);
      }
      throw e;
    }
  };

  return (
    <>
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full flex justify-center px-4 pointer-events-none">
        <m.nav
          variants={{
            visible: { y: 0, opacity: 1 },
            hidden: { y: -110, opacity: 0 },
          }}
          animate={hidden ? 'hidden' : 'visible'}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="flex items-center bg-[#1A2B27] rounded-full px-8 py-3 shadow-[0_12px_48px_rgba(0,0,0,0.3)] gap-4 pointer-events-auto"
          style={{ scale }}
        >
          {/* 로고 */}
          <button
            onClick={() => {
              if (location.pathname === '/main' || location.pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate('/main');
              }
            }}
            className="font-['SchoolSafetyNotification'] text-[22px] text-white no-underline tracking-[-0.01em] font-bold shrink-0 cursor-pointer"
          >
            Day<span className="text-[#E8A838]">.</span>Poo
          </button>

          {/* 구분선 - 데스크톱 */}
          <div className="hidden md:block w-px h-4 bg-white/15" />

          {/* 네비 링크 - 데스크톱 */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
            className="hidden md:flex flex-nowrap"
          >
            {NAV_LINKS.map((link) => (
              <div key={link.path} className="whitespace-nowrap flex-shrink-0">
                <AnimatedUnderlink
                  to={link.path}
                  text={link.label}
                  style={{ fontSize: '15px' }}
                  variant={link.variant}
                />
              </div>
            ))}
          </div>

          {/* 구분선 - 데스크톱 */}
          <div className="hidden md:block w-px h-4 bg-white/15" />

          {/* 우측 — 데스크톱 인증 버튼 */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* 글로벌 기록하기 버튼 (로그인 시에만) */}
                <WaveButton
                  onClick={() => setShowHealthLog(true)}
                  variant="accent"
                  size="sm"
                  icon={<Plus size={14} />}
                  className="shadow-lg shadow-amber-500/20 whitespace-nowrap"
                >
                  기록하기
                </WaveButton>

                <Link
                  to="/mypage"
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:bg-white/10 text-white/85"
                >
                  <User size={15} />
                  마이페이지
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold transition-all hover:bg-white/10 text-white/40"
                >
                  <LogOut size={13} />
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuth('login')}
                  aria-label="로그인"
                  className="text-sm font-bold transition-all hover:text-white cursor-pointer text-white/60"
                >
                  로그인
                </button>
                <button
                  onClick={() => openAuth('signup')}
                  aria-label="회원가입"
                  className="text-sm font-bold transition-all hover:text-white cursor-pointer text-white/60"
                >
                  회원가입
                </button>
              </>
            )}
          </div>

          {/* 알림 벨 (로그인 상태에서만 표시) */}
          {isAuthenticated && (
            <m.button
              whileHover={!isTouchDevice() ? { scale: 1.1 } : undefined}
              whileTap={!isTouchDevice() ? { scale: 0.9 } : undefined}
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-full transition-colors hover:bg-white/10 hidden md:flex items-center justify-center text-white/60"
              aria-label={unreadCount > 0 ? `알림 (읽지 않은 알림 ${unreadCount}개)` : '알림'}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <m.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: '#E85D5D', border: '1.5px solid #1A2B27' }}
                  aria-hidden="true"
                />
              )}
            </m.button>
          )}

          {/* 햄버거 메뉴 - 모바일 */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="메뉴 열기"
            className="md:hidden flex items-center justify-center p-2 rounded-full transition-colors hover:bg-white/10 text-white/70"
          >
            <Menu size={20} />
          </button>
        </m.nav>
      </div>

      {/* ── 모바일 사이드 드로어 ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm md:hidden"
            />

            <m.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 z-[151] w-[280px] h-full flex flex-col md:hidden bg-gradient-to-b from-[#1A2B27] to-[#0F1D19] shadow-[-8px_0_40px_rgba(0,0,0,0.3)]"
            >
              {/* 드로어 헤더 */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <span className="font-['SchoolSafetyNotification'] text-xl text-white font-bold">
                  Day<span className="text-[#E8A838]">.</span>Poo
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="메뉴 닫기"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/10 text-white/50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mx-6 h-px bg-white/10" />

              {/* 네비 링크 */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate('/main');
                  }}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl w-full text-left ${isActivePath('/main')
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 active:bg-white/5 active:text-white/80'
                    }`}
                >
                  <Home size={20} />
                  <span className="text-[15px] font-bold">홈</span>
                </button>

                {NAV_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.path}
                      onClick={() => {
                        setDrawerOpen(false);
                        if (link.path === '/ranking') {
                          transitionTo(link.path);
                        } else {
                          navigate(link.path);
                        }
                      }}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl w-full text-left ${isActivePath(link.path)
                          ? 'bg-white/10 text-white'
                          : 'text-white/60 active:bg-white/5 active:text-white/80'
                        }`}
                    >
                      <Icon size={20} />
                      <span className="text-[15px] font-bold">{link.label}</span>
                      {isActivePath(link.path) && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E8A838]" />
                      )}
                    </button>
                  );
                })}

                {isAuthenticated && (
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      navigate('/mypage');
                    }}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl w-full text-left ${isActivePath('/mypage')
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 active:bg-white/5 active:text-white/80'
                      }`}
                  >
                    <User size={20} />
                    <span className="text-[15px] font-bold">마이페이지</span>
                    {isActivePath('/mypage') && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E8A838]" />
                    )}
                  </button>
                )}

                {/* 글로벌 기록하기 버튼 — 로그인 시에만 표시 */}
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      setShowHealthLog(true);
                    }}
                    className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all w-full bg-[#E8A838]/10 text-[#E8A838]"
                  >
                    <Plus size={20} />
                    <span className="text-[15px] font-bold">기록하기</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate('/premium');
                  }}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl w-full text-left ${isActivePath('/premium')
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 active:bg-white/5 active:text-white/80'
                    }`}
                >
                  <Crown size={20} />
                  <span className="text-[15px] font-bold">프리미엄</span>
                </button>
              </div>

              {/* 하단 인증 영역 */}
              <div className="px-4 pb-8">
                <div className="mx-2 h-px bg-white/10 mb-6" />
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="px-4 py-2">
                      <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">
                        로그인 중
                      </p>
                      <p className="text-sm font-bold text-white/80 truncate">
                        {user?.nickname || user?.email}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-white/40 hover:bg-white/5 hover:text-white/60 transition-all"
                    >
                      <LogOut size={18} />
                      <span className="text-sm font-bold">로그아웃</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setDrawerOpen(false);
                        openAuth('login');
                      }}
                      className="w-full py-3 rounded-2xl text-sm font-bold transition-all bg-white/10 text-white/80 border border-white/10"
                    >
                      로그인
                    </button>
                    <button
                      onClick={() => {
                        setDrawerOpen(false);
                        openAuth('signup');
                      }}
                      className="w-full py-3 rounded-2xl text-sm font-bold transition-all bg-[#E8A838] text-[#1A2B27]"
                    >
                      회원가입
                    </button>
                  </div>
                )}
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>

      <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* 글로벌 건강 기록 모달 */}
      <AnimatePresence>
        {showHealthLog && (
          <HealthLogModal
            onClose={() => setShowHealthLog(false)}
            onComplete={handleHealthLogComplete}
          />
        )}
      </AnimatePresence>
    </>
  );
}
