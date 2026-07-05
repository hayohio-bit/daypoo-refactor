import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { api } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { InputField } from './InputField';
import { SocialLoginButtons } from './SocialLoginButtons';

interface LoginFormProps {
  onSwitch: () => void;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function LoginForm({ onSwitch, onSuccess, onClose }: LoginFormProps) {
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => localStorage.getItem('rememberedEmail') || '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(() => !!localStorage.getItem('rememberedEmail'));
  const [stayLoggedIn, setStayLoggedIn] = useState(() => localStorage.getItem('stayLoggedIn') === 'true');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email) e.email = '이메일을 입력해주세요';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = '올바른 이메일 형식이 아니에요';
    if (!password) e.password = '비밀번호를 입력해주세요';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 이미 요청 중이면 추가 요청 방지 (Debounce 역할)
    if (loading) return;

    if (!validate()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setLoading(true);
    try {
      const res: any = await api.post('/auth/login', { email, password });
      if (res && res.accessToken) {
        // 아이디 기억하기
        if (rememberEmail) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        // 로그인 유지 설정 저장
        localStorage.setItem('stayLoggedIn', String(stayLoggedIn));

        await authLogin(res.accessToken, res.refreshToken || '', stayLoggedIn);
        
        // ROLE_ADMIN 체크
        try {
          const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
          if (payload.role === 'ROLE_ADMIN') navigate('/admin');
        } catch {}

        onSuccess?.();
      }
    } catch (err: any) {
      setErrors({ email: '이메일 또는 비밀번호가 잘못되었습니다.' });
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-5 text-left">
        <h2 className="font-black text-[#1A2B27] text-xl" style={{ letterSpacing: '-0.03em' }}>
          다시 만나서 반가워요 👋
        </h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(26,43,39,0.45)' }}>계정에 로그인하세요</p>
      </div>

      <SocialLoginButtons label="로그인" />

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px" style={{ background: 'rgba(26,43,39,0.08)' }} />
        <span className="text-xs font-medium" style={{ color: 'rgba(26,43,39,0.3)' }}>이메일로 로그인</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(26,43,39,0.08)' }} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <motion.div animate={shake && errors.email ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.3 }}>
          <InputField label="이메일" type="email" value={email} onChange={setEmail} placeholder="hello@example.com" error={errors.email} autoComplete="email" />
        </motion.div>
        <motion.div animate={shake && errors.password ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.3 }}>
          <InputField 
            label="비밀번호" 
            type={showPw ? 'text' : 'password'} 
            value={password} 
            onChange={setPassword} 
            placeholder="비밀번호 입력" 
            error={errors.password} 
            autoComplete="current-password"
            rightEl={
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ color: 'rgba(26,43,39,0.25)', lineHeight: 0 }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />
        </motion.div>
        <div className="flex items-center justify-between flex-wrap gap-y-2 -mt-1">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
              <input type="checkbox" checked={rememberEmail} onChange={(e) => setRememberEmail(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 accent-[#1B4332]" />
              <span className="text-[11px] xs:text-xs" style={{ color: 'rgba(26,43,39,0.5)' }}>아이디 기억하기</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
              <input type="checkbox" checked={stayLoggedIn} onChange={(e) => setStayLoggedIn(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 accent-[#1B4332]" />
              <span className="text-[11px] xs:text-xs" style={{ color: 'rgba(26,43,39,0.5)' }}>로그인 유지</span>
            </label>
          </div>
          <Link to="/forgot-password" onClick={onClose} className="text-[11px] xs:text-xs transition-colors hover:text-[#1A2B27] whitespace-nowrap" style={{ color: 'rgba(26,43,39,0.4)' }}>
            비밀번호를 잊으셨나요?
          </Link>
        </div>

        <motion.button type="submit" disabled={loading}
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.97 } : {}}
          className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 mt-1"
          style={{ background: loading ? 'rgba(27,67,50,0.4)' : '#1B4332', color: '#FFFFFF', boxShadow: loading ? 'none' : '0 6px 20px rgba(27,67,50,0.25)' }}>
          {loading ? "로그인 중..." : <>로그인 <ArrowRight size={14} /></>}
        </motion.button>
      </form>

      <p className="text-center mt-5 text-sm" style={{ color: 'rgba(26,43,39,0.4)' }}>
        계정이 없으신가요?{' '}
        <button onClick={onSwitch} className="font-bold transition-colors hover:text-[#2d6a4f]" style={{ color: '#1B4332' }}>
          회원가입
        </button>
      </p>
    </div>
  );
}
