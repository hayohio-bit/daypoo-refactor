import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiClient';
import { LoadingPage } from './LoadingPage';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const navigatedRef = useRef(false);

  useEffect(() => {
    if (navigatedRef.current) return;

    const code = searchParams.get('code');

    if (code) {
      navigatedRef.current = true;

      // 보안 개선: 전달받은 일회용 코드를 서버에서 실제 토큰으로 교환
      api
        .post<any>('/auth/exchange-code', { code })
        .then((data) => {
          const { accessToken, refreshToken } = data;
          const stayLoggedIn = localStorage.getItem('stayLoggedIn') === 'true';

          // AuthContext.login() 호출 → refreshUser() → /auth/me → user 상태 설정
          return login(accessToken, refreshToken || '', stayLoggedIn).then(() => {
            // JWT 디코딩하여 어드민 여부 확인
            try {
              const payload = JSON.parse(atob(accessToken.split('.')[1]));
              if (payload.role === 'ROLE_ADMIN') {
                localStorage.removeItem('returnUrl');
                navigate('/admin', { replace: true });
                return;
              }
            } catch {}

            // 일반 유저: 메인 또는 원래 있던 페이지로 이동
            const returnUrl = localStorage.getItem('returnUrl') || '/main';
            localStorage.removeItem('returnUrl');
            navigate(returnUrl, { replace: true });
          });
        })
        .catch((err) => {
          console.error('인증 코드 교환 실패:', err);
          navigate('/main', { replace: true });
        });
    } else {
      // 레거시 지원 또는 에러 처리 (기존 URL 파라미터 방식 체크)
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      if (accessToken) {
        navigatedRef.current = true;
        const stayLoggedIn = localStorage.getItem('stayLoggedIn') === 'true';

        login(accessToken, refreshToken || '', stayLoggedIn).then(() => {
          const returnUrl = localStorage.getItem('returnUrl') || '/main';
          localStorage.removeItem('returnUrl');
          navigate(returnUrl, { replace: true });
        });
      } else if (searchParams.has('code') === false && searchParams.has('access_token') === false) {
        navigatedRef.current = true;
        console.error('인증 코드를 찾을 수 없습니다.');
        navigate('/main', { replace: true });
      }
    }
  }, [searchParams, navigate, login]);

  return <LoadingPage />;
};
