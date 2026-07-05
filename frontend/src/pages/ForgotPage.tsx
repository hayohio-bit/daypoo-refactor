import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail, KeyRound, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { api } from '../services/apiClient';

// ── 타입 ──────────────────────────────────────────────────────────────
type ForgotMode = 'password' | 'email';
type Step = 'input' | 'done'; // verify 단계 제거

// ── 상단 헤더 (Navbar Style) ──────────────────────────────────────────
function PageHeader() {
  const navigate = useNavigate();
  return (
    <div className="flex justify-center mb-10">
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center bg-[#1A2B27] rounded-full px-6 sm:px-8 py-2.5 sm:py-3 shadow-2xl gap-3 sm:gap-5"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <Link
          to="/main"
          className="font-black text-white no-underline text-xl tracking-tighter"
          style={{ fontFamily: 'SchoolSafetyNotification, sans-serif' }}
        >
          Day<span style={{ color: '#E8A838' }}>.</span>Poo
        </Link>
        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)' }} />
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-bold text-white/60 transition-all hover:text-white cursor-pointer"
          style={{ background: 'none', border: 'none' }}
        >
          <ArrowLeft size={14} />
          뒤로
        </button>
      </motion.nav>
    </div>
  );
}

// ── 애니메이션 빔 배경 ──────────────────────────────────────────────────
function AnimatedBeamBackground() {
  const paths = [
    "M-100,200 C150,150 350,450 500,300 C650,150 850,450 1100,200",
    "M1100,800 C850,750 650,950 500,800 C350,650 150,850 -100,800",
    "M200,-100 C150,150 450,350 300,500 C150,650 450,850 200,1100",
    "M800,1100 C750,850 950,650 800,500 C650,350 850,150 800,-100",
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
      <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
        <defs>
          <linearGradient id="beam-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1B4332" stopOpacity="0" />
            <stop offset="30%" stopColor="#52B788" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#E8A838" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#1B4332" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {paths.map((d, i) => (
          <g key={i}>
            <path d={d} fill="none" stroke="rgba(27,67,50,0.04)" strokeWidth="1.5" />
            <motion.path
              d={d}
              fill="none"
              stroke="url(#beam-grad)"
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#glow)"
              initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0.15, 0.25, 0.15],
                pathOffset: [0, 1],
                opacity: [0, 0.8, 0]
              }}
              transition={{
                duration: 7 + i * 2,
                repeat: Infinity,
                delay: i * 2.5,
                ease: "linear"
              }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── 공통 Input ────────────────────────────────────────────────────────
function InputField({
  label, type = 'text', value, onChange, placeholder,
  error, hint, autoComplete, rightEl,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  error?: string; hint?: string; autoComplete?: string;
  rightEl?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold" style={{ color: '#5a7a6a', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <div
        className="relative flex items-center rounded-xl transition-all duration-200"
        style={{
          background: focused ? '#fff' : '#f4faf6',
          border: error
            ? '1.5px solid rgba(232,93,93,0.55)'
            : focused
            ? '1.5px solid #1B4332'
            : '1.5px solid #d4e8db',
          boxShadow: focused ? '0 0 0 3px rgba(27,67,50,0.06)' : 'none',
        }}
      >
        <input
          type={type} value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent outline-none text-sm font-medium px-4 py-3.5"
          style={{ color: '#1a2b22', caretColor: '#1B4332' }}
        />
        {rightEl && <div className="pr-3.5 flex-shrink-0">{rightEl}</div>}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-xs" style={{ color: '#E85D5D' }}>
            <AlertCircle size={11} />{error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 생년월일 드랍다운 ───────────────────────────────────────────────────
function BirthDropdowns({ 
  year, month, day, 
  onYearChange, onMonthChange, onDayChange 
}: { 
  year: string; month: string; day: string; 
  onYearChange: (v: string) => void; 
  onMonthChange: (v: string) => void; 
  onDayChange: (v: string) => void; 
}) {
  const years = Array.from({ length: 2026 - 1920 + 1 }, (_, i) => 2026 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const SelectWrapper = ({ value, onChange, options, placeholder, suffix }: any) => (
    <div className="relative group flex-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#f4faf6] outline-none text-sm font-medium px-4 py-3.5 rounded-xl appearance-none border border-[#d4e8db] focus:border-[#1B4332] focus:bg-white transition-all cursor-pointer"
        style={{ color: '#1a2b22' }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt: any) => <option key={opt} value={opt}>{opt}{suffix}</option>)}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#7a9e8a]">
        <ChevronDown size={14} />
      </div>
    </div>
  );

  return (
    <div className="flex gap-2">
      <SelectWrapper value={year} onChange={onYearChange} options={years} placeholder="년" suffix="년" />
      <SelectWrapper value={month} onChange={onMonthChange} options={months} placeholder="월" suffix="월" />
      <SelectWrapper value={day} onChange={onDayChange} options={days} placeholder="일" suffix="일" />
    </div>
  );
}

// ── 비밀번호 찾기 폼 ─────────────────────────────────────────────────
function PasswordForgot({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('input');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      setErrors({ email: '이메일을 입력해주세요' });
      return;
    }
    setLoading(true);
    try {
      // POST /api/v1/auth/password/reset?email=xxx
      await api.post(`/auth/password/reset?email=${encodeURIComponent(email)}`, null);
      setStep('done');
    } catch (err: any) {
      setErrors({ email: err.response?.data?.message || '비밀번호 재설정 요청에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const slideVar = {
    enter: { opacity: 0, x: 24 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  };

  return (
    <AnimatePresence mode="wait">
      {step === 'input' ? (
        <motion.div key="input" variants={slideVar} initial="enter" animate="center" exit="exit"
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#e8f3ec' }}>
              <KeyRound size={20} style={{ color: '#1B4332' }} />
            </div>
            <div>
              <h2 className="font-black text-lg" style={{ color: '#1a2b22', letterSpacing: '-0.03em' }}>
                비밀번호 찾기
              </h2>
              <p className="text-sm" style={{ color: '#7a9e8a' }}>
                이메일로 임시 비밀번호를 보내드려요
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <InputField label="이메일" type="email" value={email} onChange={setEmail}
              placeholder="가입한 이메일 주소" error={errors.email} autoComplete="email" />

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleReset} disabled={loading}
              className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2"
              style={{
                background: loading ? 'rgba(27,67,50,0.4)' : 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
                color: '#fff',
                boxShadow: loading ? 'none' : '0 4px 18px rgba(27,67,50,0.22)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>💩</motion.span> : <>임시 비밀번호 발송 <ArrowRight size={14} /></>}
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div key="done" variants={slideVar} initial="enter" animate="center" exit="exit"
          className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#e8f3ec' }}>
            <CheckCircle2 size={32} style={{ color: '#1B4332' }} />
          </div>
          <h2 className="font-black text-xl mb-2">메일 발송 완료!</h2>
          <p className="text-sm mb-6 text-[#7a9e8a]">
            입력하신 이메일로 8자리 임시 비밀번호가 발송되었습니다.<br />로그인 후 비밀번호를 꼭 변경해주세요!
          </p>
          <button onClick={() => navigate('/main')} className="w-full py-3.5 rounded-xl font-black text-sm transition-all"
            style={{ background: '#E8A838', color: '#1B4332' }}>로그인하러 가기 →</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── 이메일 찾기 폼 ───────────────────────────────────────────────────
function EmailForgot() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('input');
  const [nickname, setNickname] = useState('');
  const [foundEmail, setFoundEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // 생년월일은 UI 유지를 위해 남겨두지만 현재 백엔드는 nickname만 사용함
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');

  const handleFind = async () => {
    if (!nickname.trim()) {
      setErrors({ nickname: '닉네임을 입력해주세요' });
      return;
    }
    setLoading(true);
    try {
      // GET /api/v1/auth/find-id?nickname=xxx
      const res = await api.get(`/auth/find-id?nickname=${encodeURIComponent(nickname)}`);
      setFoundEmail((res as any)?.data || (res as any)); // 서버에 따라 res.data 혹은 res 자체가 문자열일 수 있음
      setStep('done');
    } catch (err: any) {
      setErrors({ nickname: err.response?.data?.message || '등록된 정보를 찾을 수 없습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const slideVar = {
    enter: { opacity: 0, x: 24 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  };

  return (
    <AnimatePresence mode="wait">
      {step === 'input' ? (
        <motion.div key="input" variants={slideVar} initial="enter" animate="center" exit="exit"
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#fdf3de' }}>
              <Mail size={20} style={{ color: '#b5810f' }} />
            </div>
            <div>
              <h2 className="font-black text-lg" style={{ color: '#1a2b22', letterSpacing: '-0.03em' }}>
                이메일 찾기
              </h2>
              <p className="text-sm" style={{ color: '#7a9e8a' }}>
                닉네임으로 가입된 이메일을 찾아드려요
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <InputField label="닉네임" value={nickname} onChange={setNickname}
              placeholder="가입 시 등록한 닉네임" error={errors.nickname} />

            <div className="opacity-60">
              <label className="text-xs font-bold block mb-1.5" style={{ color: '#5a7a6a' }}>생년월일 (선택)</label>
              <BirthDropdowns year={birthYear} month={birthMonth} day={birthDay}
                onYearChange={setBirthYear} onMonthChange={setBirthMonth} onDayChange={setBirthDay} />
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleFind} disabled={loading}
              className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2"
              style={{
                background: loading ? 'rgba(27,67,50,0.4)' : 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
                color: '#fff',
                boxShadow: loading ? 'none' : '0 4px 18px rgba(27,67,50,0.22)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
              {loading ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>💩</motion.span> : <>이메일 찾기 <ArrowRight size={14} /></>}
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div key="done" variants={slideVar} initial="enter" animate="center" exit="exit"
          className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#fdf3de' }}>
            <Mail size={28} style={{ color: '#b5810f' }} />
          </div>
          <h2 className="font-black text-xl mb-2">이메일을 찾았어요!</h2>
          <div className="w-full px-5 py-4 rounded-2xl mb-6 bg-[#f4faf6] border border-[#d4e8db]">
            <p className="font-black text-lg text-[#1B4332]">{foundEmail}</p>
            <p className="text-xs mt-1 text-[#7a9e8a]">일부 정보가 마스킹 되었습니다.</p>
          </div>
          <button onClick={() => navigate('/main')} className="w-full py-3.5 rounded-xl font-black text-sm transition-all"
            style={{ background: '#E8A838', color: '#1B4332' }}>로그인하러 가기 →</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────
export function ForgotPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ForgotMode>('email');
  const [modeDir, setModeDir] = useState(1);

  const switchMode = (next: ForgotMode) => {
    setModeDir(next === 'email' ? -1 : 1);
    setMode(next);
  };

  const modeVar = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 32 : -32 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -32 : 32 }),
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#F8FAF9]">
      <AnimatedBeamBackground />
      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}
        className="relative z-10 w-full max-w-[540px]">
        <PageHeader />
        <div className="rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 bg-white border border-[#d4e8db] shadow-xl">
          <div className="flex rounded-2xl p-1 mb-5 bg-[#f4faf6] border border-[#d4e8db]">
            {[
              { key: 'email' as ForgotMode,    label: '이메일 찾기', icon: <Mail size={15} /> },
              { key: 'password' as ForgotMode, label: '비밀번호 찾기', icon: <KeyRound size={15} /> },
            ].map((t) => (
              <button key={t.key} onClick={() => switchMode(t.key)} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all relative flex items-center justify-center gap-1.5"
                style={{ color: mode === t.key ? '#1B4332' : '#7a9e8a' }}>
                {mode === t.key && <motion.div layoutId="tabBg" className="absolute inset-0 rounded-xl bg-white border border-[#d4e8db] shadow-sm" />}
                <div className="relative z-10 flex items-center gap-1.5">
                  {t.icon}
                  <span>{t.label}</span>
                </div>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" custom={modeDir}>
            <motion.div key={mode} custom={modeDir} variants={modeVar} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }}>
              {mode === 'password' ? <PasswordForgot onBack={() => navigate(-1)} /> : <EmailForgot />}
            </motion.div>
          </AnimatePresence>
        </div>
        <p className="text-center mt-4 text-sm text-[#7a9e8a]">
          계정이 기억나셨나요? <Link to="/main" className="font-bold text-[#1B4332] no-underline">로그인하기</Link>
        </p>
      </motion.div>
    </div>
  );
}
