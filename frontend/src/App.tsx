import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LazyMotion, m } from 'framer-motion';

// Lazy load all pages
import { SplashPage } from './pages/SplashPage';
import { MainPage } from './pages/MainPage';
import { MapPage } from './pages/MapPage';
import { RankingPage } from './pages/RankingPage';
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
const PaymentSuccessPage = lazy(() =>
  import('./pages/PaymentSuccessPage').then((m) => ({ default: m.PaymentSuccessPage })),
);
import { AuthCallback } from './pages/AuthCallback';
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
import { SocialSignupPage } from './pages/SocialSignupPage';
const PremiumPage = lazy(() =>
  import('./pages/PremiumPage').then((m) => ({ default: m.PremiumPage })),
);
import { ServerErrorPage } from './pages/ServerErrorPage';
import { LoadingPage } from './pages/LoadingPage';

import { TransitionProvider } from './context/TransitionContext';
import { AuthModal } from './components/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationSubscriber } from './components/NotificationSubscriber';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LocationConsentBanner } from './components/LocationConsentBanner';

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

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  console.log('[AdminRoute] Debug:', {
    loading,
    user,
    userRole: user?.role,
    hasUser: !!user,
    accessToken: !!(localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')),
  });

  if (loading) {
    return <LoadingPage />;
  }

  const isAdmin =
    user &&
    ((typeof user.role === 'string' && user.role.toUpperCase().includes('ADMIN')) ||
      (Array.isArray(user.role) &&
        user.role.some((r: string) => r.toUpperCase().includes('ADMIN'))));

  if (!isAdmin) {
    console.error('[AdminRoute] ❌ Access denied. Redirecting to /main.', {
      userRole: user?.role,
      hasToken: !!(localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')),
    });
    return <Navigate to="/main" replace />;
  }

  console.log('[AdminRoute] ✅ Access granted. User is admin.');
  return <>{children}</>;
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
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('login') === 'open') {
      setAuthMode('login');
      setAuthOpen(true);
      // 열고 난 후 URL 파라미터 정리
      window.history.replaceState({}, document.title, window.location.pathname);
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
            <TransitionProvider>
              <NotificationProvider>
                <NotificationSubscriber />
                <LocationConsentBanner />
                <Suspense fallback={<LoadingPage />}>
                  <Routes>
                    <Route path="/" element={<SplashPage />} />
                    <Route path="/main" element={<MainPage openAuth={openAuth} />} />
                    <Route path="/login" element={<LoginPage openAuth={openAuth} />} />
                    <Route path="/map" element={<MapPage openAuth={openAuth} />} />
                    <Route path="/ranking" element={<RankingPage openAuth={openAuth} />} />
                    <Route path="/forgot-password" element={<ForgotPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/mypage" element={<MyPage openAuth={openAuth} />} />
                    <Route path="/support" element={<SupportPage openAuth={openAuth} />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/signup/social" element={<SocialSignupPage />} />
                    <Route path="/payment/success" element={<PaymentSuccessPage />} />
                    <Route path="/premium" element={<PremiumPage openAuth={openAuth} />} />
                    <Route path="/500" element={<ServerErrorPage />} />
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminPage />
                        </AdminRoute>
                      }
                    />
                    <Route path="/404" element={<NotFoundPage />} />
                    <Route path="/loading" element={<LoadingPage />} />
                    <Route path="*" element={<NotFoundPage />} />
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
          </AuthProvider>
        </ErrorBoundary>
      </LazyMotion>
    </BrowserRouter>
  );
}

export default App;
