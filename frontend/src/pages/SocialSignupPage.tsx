import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

export function SocialSignupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const registrationToken = searchParams.get('registration_token');
  const navigatedRef = useRef(false);

  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 토큰이 없으면 메인으로 리다이렉트
  useEffect(() => {
    if (navigatedRef.current) return;
    
    if (!registrationToken) {
      navigatedRef.current = true;
      const returnUrl = localStorage.getItem('returnUrl') || '/main';
      localStorage.removeItem('returnUrl');
      navigate(returnUrl, { replace: true });
    }
  }, [registrationToken, navigate]);

  // 닉네임 중복 체크 (디바운스 필요할 수 있지만 여기서는 버튼 클릭 또는 입력 시 간단히 처리)
  const checkNickname = async (name: string) => {
    if (!name.trim() || name.length < 2) {
      setStatus('idle');
      return;
    }
    setStatus('checking');
    try {
      await api.get(`/auth/check-nickname?nickname=${encodeURIComponent(name)}`);
      setStatus('available');
    } catch (err: any) {
      setStatus('unavailable');
      setErrorMessage(err.message || '이미 사용 중인 닉네임입니다.');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (nickname) checkNickname(nickname);
    }, 500);
    return () => clearTimeout(timer);
  }, [nickname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'available' || !registrationToken) return;

    setIsSubmitting(true);
    try {
      const response = await api.post<any>('/auth/social/signup', {
        registrationToken: registrationToken, // camelCase로 수정
        nickname: nickname
      });
      
      // 성공 시 토큰 저장 및 메인 이동
      if (response.accessToken) {
        navigatedRef.current = true;
        
        // login 함수를 통해 토큰 저장 및 유저 정보 갱신 수행
        await login(response.accessToken, response.refreshToken);
        
        const returnUrl = localStorage.getItem('returnUrl') || '/main';
        localStorage.removeItem('returnUrl');
        navigate(returnUrl, { replace: true });
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || '가입 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAF9] p-6 relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#52B788] blur-[120px] rounded-full opacity-[0.08]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#E8A838] blur-[120px] rounded-full opacity-[0.05]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white border border-black/[0.04] p-8 md:p-10 rounded-[32px] shadow-[0_20px_50px_rgba(27,67,50,0.08)]">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-[#f4f9f6] rounded-2xl flex items-center justify-center mb-6 border border-[#52B788]/20 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#52B788]/10 to-transparent" />
              <Sparkles className="text-[#2D6A4F] w-8 h-8 relative z-10" />
            </div>
            <h1 className="text-3xl font-black text-[#1A2B27] mb-2 tracking-tight">반가워요! 💩</h1>
            <p className="text-[#5C6B68] text-sm leading-relaxed font-medium">
              마지막 단계입니다. DayPoo에서 사용할<br />멋진 닉네임을 설정해주세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-[#5C6B68]/40 ml-1">
                Nickname
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C6B68]/30 group-focus-within:text-[#2D6A4F] transition-colors">
                  <User size={18} />
                </div>
                <input 
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="2~10자 이내로 입력"
                  className="w-full bg-[#f8faf9] border border-[#e2e8e6] rounded-2xl py-4 pl-12 pr-12 text-[#1A2B27] outline-none focus:border-[#52B788]/50 focus:bg-white transition-all font-bold placeholder:text-[#5C6B68]/30 shadow-sm"
                  required
                  maxLength={10}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <AnimatePresence mode="wait">
                    {status === 'checking' && (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-5 h-5 border-2 border-[#52B788]/30 border-t-[#52B788] rounded-full animate-spin"
                      />
                    )}
                    {status === 'available' && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <CheckCircle2 className="text-[#52B788]" size={20} />
                      </motion.div>
                    )}
                    {status === 'unavailable' && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <AlertCircle className="text-[#E85D5D]" size={20} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <div className="min-h-[20px]">
                <AnimatePresence>
                  {status === 'unavailable' && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-[#E85D5D] text-[11px] font-bold mt-1 ml-1"
                    >
                      {errorMessage}
                    </motion.p>
                  )}
                  {status === 'available' && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-[#52B788] text-[11px] font-bold mt-1 ml-1"
                    >
                      사용 가능한 닉네임입니다!
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: status === 'available' && !isSubmitting ? 1.015 : 1 }}
              whileTap={{ scale: status === 'available' && !isSubmitting ? 0.985 : 1 }}
              disabled={status !== 'available' || isSubmitting}
              className={`w-full py-4.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                status === 'available' && !isSubmitting
                  ? 'bg-[#1B4332] text-white shadow-[0_10px_30px_rgba(27,67,50,0.15)] hover:bg-[#2D6A4F]'
                  : 'bg-[#f4f9f6] text-[#5C6B68]/30 cursor-not-allowed border border-[#e2e8e6]'
              }`}
            >
              {isSubmitting ? '가입 중...' : (
                <>
                  시작하기 <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          <p className="mt-8 text-center text-[11px] text-[#5C6B68]/50 font-medium leading-relaxed">
            회원가입 시 DayPoo의 <span className="underline cursor-pointer hover:text-[#2D6A4F]">서비스 이용약관</span> 및 <br />
            <span className="underline cursor-pointer hover:text-[#2D6A4F]">개인정보 처리방침</span>에 동의하게 됩니다.
          </p>
        </div>
      </motion.div>
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#52B788] via-[#E8A838] to-[#1B4332] opacity-30" />
    </div>
  );
}
