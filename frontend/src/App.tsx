import { LazyMotion, m } from 'framer-motion';
import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

// Lazy load all pages
const SplashPage = lazy(() =>
  import('./pages/SplashPage').then((m) => ({ default: m.SplashPage })),
);
const MainPage = lazy(() => import('./pages/MainPage').then((m) => ({ default: m.MainPage })));
const MapPage = lazy(() => import('./pages/MapPage').then((m) => ({ default: m.MapPage })));

const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);
const ForgotPage = lazy(() =>
  import('./pages/ForgotPage').then((m) => ({ default: m.ForgotPage })),
);
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
);
const MyPage = lazy(() => import('./pages/MyPage').then((m) => ({ default: m.MyPage })));
const SupportPage = lazy(() =>
  import('./pages/SupportPage').then((m) => ({ default: m.SupportPage })),
);

const AuthCallback = lazy(() =>
  import('./pages/AuthCallback').then((m) => ({ default: m.AuthCallback })),
);
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const SocialSignupPage = lazy(() =>
  import('./pages/SocialSignupPage').then((m) => ({ default: m.SocialSignupPage })),
);

const ServerErrorPage = lazy(() =>
  import('./pages/ServerErrorPage').then((m) => ({ default: m.ServerErrorPage })),
);
import { LoadingPage } from './pages/LoadingPage';

import { AuthModal } from './components/AuthModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LocationConsentBanner } from './components/LocationConsentBanner';
import { NotificationSubscriber } from './components/NotificationSubscriber';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToiletProvider } from './context/ToiletContext';
import { TransitionProvider } from './context/TransitionContext';

// 동적 로드될 Framer Motion 기능들
const loadFeatures = () => import('./utils/framerFeatures').then((res) => res.default);

function LoginPage({
  openAuth,
}: {
  openAuth: (mode: 'login' | 'signup', callback?: () => void) => void;
}) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/main', { replace: true });
    } else {
      openAuth('login');
    }
  }, [isAuthenticated, navigate, openAuth]);

  return <MainPage openAuth={openAuth} />;
}

function SignupPage({
  openAuth,
}: {
  openAuth: (mode: 'login' | 'signup', callback?: () => void) => void;
}) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/main', { replace: true });
    } else {
      openAuth('signup');
    }
  }, [isAuthenticated, navigate, openAuth]);

  return <MainPage openAuth={openAuth} />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingPage />;
  }

  const isAdmin =
    user &&
    ((typeof user.role === 'string' && user.role.toUpperCase().includes('ADMIN')) ||
      (Array.isArray(user.role) &&
        user.role.some((r: string) => r.toUpperCase().includes('ADMIN'))));

  if (!isAdmin) {
    return <Navigate to="/main" replace />;
  }

  return <>{children}</>;
}

function NavigationHelper({ authOpen }: { authOpen: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 모달이 닫혔는데 현재 URL이 /login이나 /signup인 경우 /main으로 이동
    if (!authOpen && (location.pathname === '/login' || location.pathname === '/signup')) {
      navigate('/main', { replace: true });
    }
  }, [authOpen, location.pathname, navigate]);

  return null;
}

function App() {
  const [onAuthSuccess, setOnAuthSuccess] = useState<(() => void) | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // URL에 ?login=open 이나 error 가 있을 경우 처리
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      // OAuth2 인증 실패(예: KAKAO_CLIENT_ID 없음 등) 시
      console.error('OAuth Error:', params.get('error'));
      alert(
        '소셜 로그인 처리 중 문제가 발생했습니다. (설정/비밀키 누락 등)\n서버 관리자에게 문의하세요.',
      );
    } else if (params.get('login') === 'open') {
      setAuthMode('login');
      setAuthOpen(true);
    }
  }, []);

  const openAuth = useCallback((mode: 'login' | 'signup', callback?: () => void) => {
    setAuthMode(mode);
    setOnAuthSuccess(() => callback || null);
    setAuthOpen(true);
  }, []);

  return (
    <BrowserRouter>
      <LazyMotion features={loadFeatures} strict>
        <ErrorBoundary>
          <AuthProvider>
            <ToiletProvider>
              <TransitionProvider>
                <NotificationProvider>
                  <NavigationHelper authOpen={authOpen} />
                  <NotificationSubscriber />
                  <LocationConsentBanner />
                  <Suspense fallback={<LoadingPage />}>
                    <Routes>
                      <Route path="/" element={<SplashPage />} />
                      <Route path="/main" element={<MainPage openAuth={openAuth} />} />
                      <Route path="/login" element={<LoginPage openAuth={openAuth} />} />
                      <Route path="/signup" element={<SignupPage openAuth={openAuth} />} />
                      <Route path="/map" element={<MapPage openAuth={openAuth} />} />

                      <Route path="/forgot-password" element={<ForgotPage />} />
                      <Route path="/terms" element={<TermsPage />} />
                      <Route path="/privacy" element={<PrivacyPage />} />
                      <Route path="/mypage" element={<MyPage openAuth={openAuth} />} />
                      <Route path="/support" element={<SupportPage openAuth={openAuth} />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/signup/social" element={<SocialSignupPage />} />


                      <Route path="/500" element={<ServerErrorPage />} />
                      <Route
                        path="/admin"
                        element={
                          <AdminRoute>
                            <AdminPage />
                          </AdminRoute>
                        }
                      />
                      <Route path="/404" element={<NotFoundPage openAuth={openAuth} />} />
                      <Route path="/loading" element={<LoadingPage />} />
                      <Route path="*" element={<NotFoundPage openAuth={openAuth} />} />
                    </Routes>
                  </Suspense>
                  <AuthModal
                    isOpen={authOpen}
                    onClose={() => setAuthOpen(false)}
                    defaultMode={authMode}
                    onSuccess={() => {
                      if (onAuthSuccess) onAuthSuccess();
                      setOnAuthSuccess(null);
                    }}
                  />
                </NotificationProvider>
              </TransitionProvider>
            </ToiletProvider>
          </AuthProvider>
        </ErrorBoundary>
      </LazyMotion>
    </BrowserRouter>
  );
}

export default App;
