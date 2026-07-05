import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ArrowLeft, Check, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { api } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { InputField } from './InputField';
import { SocialLoginButtons } from './SocialLoginButtons';
import { TermsCheck } from './TermsCheck';

// ── 생년월일 드랍다운 ───────────────────────────────────────────────────
function BirthDropdowns({ year, month, day, onYearChange, onMonthChange, onDayChange }: any) {
  const currentYear = 2026;
  const years = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysCount = year && month ? new Date(parseInt(year), parseInt(month), 0).getDate() : 31;
  const days = Array.from({ length: daysCount }, (_, i) => i + 1);

  const SelectWrapper = ({ value, onChange, options, placeholder, suffix }: any) => (
    <div className="relative group flex-1">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full bg-[#f8faf9] outline-none text-[#1A2B27] text-sm font-medium px-4 py-3.5 rounded-xl appearance-none border border-transparent focus:border-[#E8A838]/60 focus:bg-white transition-all cursor-pointer"
      >
        <option value="" disabled className="text-gray-400">{placeholder}</option>
        {options.map((opt: any) => (
          <option key={opt} value={opt} className="text-[#1A2B27]">
            {opt}{suffix}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-hover:text-[#E8A838]" style={{ color: 'rgba(26,43,39,0.3)' }}>
        <ChevronDown size={14} />
      </div>
    </div>
  );

  return (
    <div className="flex gap-2 mt-1.5">
      <SelectWrapper value={year} onChange={onYearChange} options={years} placeholder="년" suffix="년" />
      <SelectWrapper value={month} onChange={onMonthChange} options={months} placeholder="월" suffix="월" />
      <SelectWrapper value={day} onChange={onDayChange} options={days} placeholder="일" suffix="일" />
    </div>
  );
}

// ── 비밀번호 강도 ─────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    { label: '8자+', ok: password.length >= 8 },
    { label: '영문', ok: /[a-zA-Z]/.test(password) },
    { label: '숫자', ok: /[0-9]/.test(password) },
    { label: '특수문자', ok: /[!@#$%^&*]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const col = ['', '#E85D5D', '#E8A838', '#E8A838', '#52b788'][score];
  const lbl = ['', '약함', '보통', '좋음', '강함'][score];
  return (
    <div className="text-left flex flex-col gap-1.5 mt-1.5">
      <div className="flex gap-1">
        {[0,1,2,3].map((i) => <div key={i} className="flex-1 h-0.5 rounded-full transition-all duration-300" style={{ background: i < score ? col : 'rgba(26,43,39,0.08)' }} />)}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {checks.map((c) => (
            <span key={c.label} className="flex items-center gap-0.5 text-[10px] font-medium" style={{ color: c.ok ? '#2d6a4f' : 'rgba(26,43,39,0.35)' }}>
              <Check size={9} strokeWidth={c.ok ? 3 : 1.5} />{c.label}
            </span>
          ))}
        </div>
        {score > 0 && <span className="text-[10px] font-bold" style={{ color: col }}>{lbl}</span>}
      </div>
    </div>
  );
}

// ── 스텝 도트 ─────────────────────────────────────────────────────────
function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div key={i} animate={{
          width: i === step ? '20px' : '6px',
          background: i < step ? '#1B4332' : i === step ? '#E8A838' : 'rgba(26,43,39,0.1)',
        }} style={{ height: '6px', borderRadius: '3px', flexShrink: 0 }} />
      ))}
      <span className="ml-1 text-[10px] font-bold" style={{ color: 'rgba(26,43,39,0.4)' }}>{step + 1}/{total}</span>
    </div>
  );
}

interface SignupFormProps {
  onSwitch: () => void;
  onSuccess?: () => void;
}

export function SignupForm({ onSwitch, onSuccess }: SignupFormProps) {
  const { login: authLogin } = useAuth();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPwC, setShowPwC] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [dir, setDir] = useState(1);
  const [shake, setShake] = useState(false);

  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');

  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeService, setAgreeService] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const onAgreeAllChange = (v: boolean) => {
    setAgreeAll(v); setAgreeService(v); setAgreePrivacy(v); setAgreeMarketing(v);
  };
  const syncAll = (s: boolean, p: boolean, m: boolean) => setAgreeAll(s && p && m);

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!email) e.email = '이메일을 입력해주세요';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = '올바른 이메일 형식이 아니에요';
      if (!password) e.password = '비밀번호를 입력해주세요';
      else if (password.length < 8) e.password = '8자 이상 입력해주세요';
      if (password !== pwConfirm) e.pwConfirm = '비밀번호가 일치하지 않아요';
    } else if (s === 1) {
      if (!nickname.trim()) e.nickname = '닉네임을 입력해주세요';
      else if (nickname.trim().length < 2) e.nickname = '닉네임을 2자 이상 입력해주세요';
      if (!birthYear || !birthMonth || !birthDay) e.birth = '생년월일을 모두 선택해주세요';
    } else if (s === 2) {
      if (!agreeService) e.terms = '서비스 이용약관에 동의해주세요';
      else if (!agreePrivacy) e.terms = '개인정보처리방침에 동의해주세요';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (step === 0) {
      setLoading(true);
      try {
        await api.get(`/auth/check-email?email=${email}`);
      } catch (err: any) {
        setErrors({ email: err.message || '이미 사용 중인 이메일입니다.' });
        setShake(true); return;
      } finally { setLoading(false); }
    } else if (step === 1) {
      setLoading(true);
      try {
        await api.get(`/auth/check-nickname?nickname=${nickname}`);
      } catch (err: any) {
        setErrors({ nickname: err.message || '이미 사용 중인 닉네임입니다.' });
        setShake(true); return;
      } finally { setLoading(false); }
    }

    if (step < 2) { setDir(1); setStep((s) => s + 1); return; }

    setLoading(true);
    try {
      await api.post('/auth/signup', { email, password, nickname });
      const res: any = await api.post('/auth/login', { email, password });
      if (res && res.accessToken) {
        authLogin(res.accessToken, res.refreshToken || '');
        onSuccess?.();
      }
    } catch (err: any) {
      setErrors({ terms: err.message || '회원가입에 실패했습니다.' });
    } finally { setLoading(false); }
  };

  const stepTitles = ['계정 만들기', '나를 소개해요', '거의 다 됐어요!'];
  const stepDescs = ['소셜 또는 이메일로 가입하세요', '닉네임과 생년월일을 입력해주세요', '약관에 동의하면 시작할 수 있어요'];

  return (
    <div className="text-left">
      <div className="mb-4">
        <h2 className="font-black text-[#1A2B27] text-xl">{stepTitles[step]}</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(26,43,39,0.45)' }}>{stepDescs[step]}</p>
      </div>

      <StepDots step={step} total={3} />

      {step === 0 && <div className="mb-4"><SocialLoginButtons label="시작하기" /></div>}

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step}>
            {step === 0 && (
              <div className="flex flex-col gap-3">
                <InputField label="이메일" type="email" value={email} onChange={setEmail} placeholder="hello@example.com" error={errors.email} />
                <InputField label="비밀번호" type={showPw ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="8자 이상" error={errors.password} 
                  rightEl={<button type="button" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>} />
                <PasswordStrength password={password} />
                <InputField label="비밀번호 확인" type={showPwC ? 'text' : 'password'} value={pwConfirm} onChange={setPwConfirm} error={errors.pwConfirm} 
                  rightEl={pwConfirm && password === pwConfirm ? <CheckCircle2 size={15} color="#52b788" /> : <button type="button" onClick={() => setShowPwC(!showPwC)}>{showPwC ? <EyeOff size={15} /> : <Eye size={15} />}</button>} />
              </div>
            )}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <InputField label="닉네임" value={nickname} onChange={setNickname} placeholder="2~12자" error={errors.nickname} maxLength={12} hint="랭킹과 지도에서 사용돼요" />
                <div>
                  <label className="text-xs font-bold block mb-1.5" style={{ color: 'rgba(26,43,39,0.5)' }}>생년월일</label>
                  <BirthDropdowns year={birthYear} month={birthMonth} day={birthDay} onYearChange={setBirthYear} onMonthChange={setBirthMonth} onDayChange={setBirthDay} />
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="flex flex-col gap-3">
                <div className="p-3.5 rounded-xl" style={{ background: 'rgba(232,168,56,0.05)', border: '1.5px solid rgba(232,168,56,0.15)' }}>
                  <TermsCheck checked={agreeAll} onChange={onAgreeAllChange}>전체 동의하기</TermsCheck>
                </div>
                <TermsCheck checked={agreeService} required onChange={(v) => { setAgreeService(v); syncAll(v, agreePrivacy, agreeMarketing); }}>서비스 이용약관</TermsCheck>
                <TermsCheck checked={agreePrivacy} required onChange={(v) => { setAgreePrivacy(v); syncAll(agreeService, v, agreeMarketing); }}>개인정보처리방침</TermsCheck>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2 mt-5">
          {step > 0 && (
            <button type="button" onClick={() => setStep(s => s - 1)} className="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-100">
              <ArrowLeft size={16} color="rgba(0,0,0,0.4)" />
            </button>
          )}
          <motion.button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2" style={{ background: '#1B4332' }}>
            {loading ? "가입 중..." : step < 2 ? <>다음 <ArrowRight size={14} /></> : "가입 완료하기 ✓"}
          </motion.button>
        </div>
      </form>

      <p className="text-center mt-4 text-sm" style={{ color: 'rgba(26,43,39,0.4)' }}>
        이미 계정이 있으신가요? <button onClick={onSwitch} className="font-bold text-[#1B4332]">로그인</button>
      </p>
    </div>
  );
}
