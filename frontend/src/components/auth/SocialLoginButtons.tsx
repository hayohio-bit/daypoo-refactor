import { motion } from 'framer-motion';

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.647 1.688 4.97 4.234 6.348L5.25 21l4.477-2.984A11.6 11.6 0 0012 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

interface SocialLoginButtonsProps {
  label: string;
}

export function SocialLoginButtons({ label }: SocialLoginButtonsProps) {
  const handleOAuth = (provider: string) => {
    localStorage.setItem('returnUrl', window.location.pathname + window.location.search);
    window.location.href = `/oauth2/authorization/${provider}`;
  };

  return (
    <div className="flex flex-col gap-2">
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
        onClick={() => handleOAuth('kakao')}
        className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-sm font-bold shadow-sm"
        style={{ background: '#FEE500', color: '#1a1a1a', border: '1px solid rgba(254,229,0,0.2)' }}>
        <KakaoIcon />카카오로 {label}
      </motion.button>
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
        onClick={() => handleOAuth('google')}
        className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-sm font-bold shadow-sm"
        style={{ background: '#fff', color: '#555', border: '1.5px solid rgba(26,43,39,0.08)' }}>
        <GoogleIcon />Google로 {label}
      </motion.button>
    </div>
  );
}
