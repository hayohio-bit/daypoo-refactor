import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Sparkles,
  Zap,
  Shield,
  BarChart3,
  Brain,
  Heart,
  ArrowRight,
  ChevronLeft,
  Award,
  Crown,
} from 'lucide-react';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

// ── 데이터 ─────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'BASIC',
    name: 'BASIC',
    price: '0원',
    desc: '매일 기록하고 확인하는 기본 관리',
    features: [
      { text: '무제한 배변 기록', ok: true },
      { text: '데일리 한 줄 평 분석', ok: true },
      { text: '인근 화장실 정보 조회', ok: true },
      { text: '7일 정밀 분석 리포트', ok: false },
      { text: '30일 배변 패턴 분석', ok: false },
      { text: 'AI 맞춤형 식단 조언', ok: false },
    ],
    accent: '#52b788',
    isPopular: false,
  },
  {
    id: 'PRO',
    name: 'PRO',
    price: '4,900원',
    period: '/월',
    desc: '체계적인 생활 습관 관리를 위한 첫 걸음',
    features: [
      { text: '무제한 배변 기록', ok: true },
      { text: '데일리 한 줄 평 분석', ok: true },
      { text: '인근 화장실 정보 조회', ok: true },
      { text: '7일 정밀 분석 리포트', ok: true },
      { text: '30일 배변 패턴 분석', ok: true },
      { text: 'AI 맞춤형 식단 조언', ok: false },
    ],
    accent: '#E8A838',
    isPopular: true,
  },
  {
    id: 'PREMIUM',
    name: 'PREMIUM',
    price: '9,900원',
    period: '/월',
    desc: 'AI가 스마트하게 관리하는 나의 배변 습관',
    features: [
      { text: '무제한 배변 기록', ok: true },
      { text: '데일리 한 줄 평 분석', ok: true },
      { text: '인근 화장실 정보 조회', ok: true },
      { text: '7일 정밀 분석 리포트', ok: true },
      { text: '30일 배변 패턴 분석', ok: true },
      { text: 'AI 맞춤형 식단 조언', ok: true },
    ],
    accent: '#1B4332',
    isPopular: false,
  },
];

// ── 컴포넌트 ──────────────────────────────────────────────────────────
export function PremiumPage({ openAuth }: { openAuth: (mode: 'login' | 'signup') => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('PRO');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    const plan = PLANS.find((p) => p.id === selectedPlan);
    if (!plan || plan.id === 'BASIC') return;

    if (!user) {
      alert('멤버십 가입을 위해 먼저 로그인을 해주세요.');
      return;
    }

    setLoading(true);
    try {
      const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
      if (!clientKey) {
        throw new Error('결제 설정(Client Key)을 찾을 수 없습니다.');
      }

      const tossPayments = await loadTossPayments(clientKey);

      const amountValue = parseInt(plan.price.replace(/[^0-9]/g, ''));

      const emailPrefix = user.email ? user.email.split('@')[0] : 'ANON';
      const orderId = `POOPMAP_${Date.now()}_${plan.id}_${emailPrefix}`;

      await tossPayments.requestPayment('카드', {
        amount: amountValue,
        orderId: orderId,
        orderName: `DayPoo ${plan.name} 멤버십`,
        successUrl: window.location.origin + '/payment/success',
        failUrl: window.location.origin + '/premium',
      });
    } catch (err: any) {
      console.error('[Payment Error] Detailed:', err);

      // 토스 페이먼츠 취소 대응 (MyPage 일관성 유지)
      const isCancellation =
        err?.code?.includes('CANCELED') ||
        err?.errorCode?.includes('CANCELED') ||
        err?.message?.includes('취소') ||
        err?.message?.toLowerCase().includes('cancel') ||
        String(err).includes('CANCELED');

      if (isCancellation) {
        if (confirm('결제를 취소하시겠습니까?')) {
          // 취소 승인 시 조용히 종료
          return;
        }
        // 취소 거부 시(계속 결제 원할 시) 다시 시도하도록 유도 (필요시)
        return;
      }

      alert(`결제 요청에 실패했습니다: ${err.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Navbar openAuth={openAuth} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 sm:pt-40 pb-10 sm:pb-20">
        {/* 헤더 */}
        <div className="text-center mb-10 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-100 mb-6"
          >
            <Crown size={18} className="text-amber-500" />
            <span className="text-xs font-black text-amber-600 tracking-wider">
              PREMIUM MEMBERSHIP
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-4xl md:text-5xl font-black text-[#1A2B27] mb-4 sm:mb-6 leading-tight"
          >
            당신의 쾌변 데이터를
            <br />
            <span className="text-emerald-700">인텔리전트하게</span> 분석하세요.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-sm sm:text-lg md:text-xl font-medium max-w-2xl mx-auto"
          >
            AI 데이푸가 제안하는 맞춤형 정밀 보고서로
            <br />
            매일 아침 가벼워지는 놀라운 경험을 시작해보세요.
          </motion.p>
        </div>

        {/* 플랜 카드 디자인 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 mb-12 sm:mb-20">
          {PLANS.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative flex flex-col p-5 sm:p-8 rounded-[24px] sm:rounded-[40px] cursor-pointer transition-all duration-300 ${
                selectedPlan === plan.id
                  ? 'bg-white shadow-2xl scale-105 ring-4 ring-emerald-100 z-10'
                  : 'bg-white/60 hover:bg-white border border-gray-100 grayscale-[0.3]'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-lg shadow-amber-200">
                  <span className="text-xs font-black text-white">가장 인기있는 플랜</span>
                </div>
              )}

              <div className="mb-6 sm:mb-8">
                <span
                  className="text-[10px] sm:text-xs font-black tracking-widest uppercase mb-3 sm:mb-4 block"
                  style={{ color: plan.accent }}
                >
                  {plan.name}
                </span>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl sm:text-4xl font-black text-[#1A2B27]">
                    {plan.price}
                  </span>
                  {plan.period && <span className="text-gray-400 font-bold">{plan.period}</span>}
                </div>
                <p className="text-gray-500 text-sm font-medium leading-relaxed">{plan.desc}</p>
              </div>

              <div className="flex-1 space-y-3 sm:space-y-4 mb-6 sm:mb-10">
                {plan.features.map((feature, fidx) => (
                  <div key={fidx} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        feature.ok ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {feature.ok ? <Check size={12} strokeWidth={4} /> : <Zap size={10} />}
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        feature.ok ? 'text-[#1A2B27]' : 'text-gray-300 line-through opacity-60'
                      }`}
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black transition-all ${
                  selectedPlan === plan.id
                    ? 'bg-[#1B4332] text-white shadow-xl shadow-emerald-900/10'
                    : 'bg-gray-50 text-gray-600'
                }`}
              >
                {plan.id === 'BASIC' ? '현재 등급' : '선택하기'}
              </div>
            </motion.div>
          ))}
        </div>

        {/* 결제 요약 및 실행 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="max-w-5xl mx-auto p-5 sm:p-12 md:p-14 rounded-[24px] sm:rounded-[56px] bg-[#1B4332] text-white shadow-3xl overflow-hidden relative"
        >
          {/* 장식용 배경 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-700/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 w-full text-center md:text-left">
              <h3 className="text-lg sm:text-2xl font-black mb-4 flex flex-col md:flex-row items-center md:items-start gap-1 sm:gap-2 leading-tight">
                <span className="whitespace-nowrap">지금 결제하고 배변 패턴 관리를</span>
                <span className="whitespace-nowrap flex items-center gap-2">
                  업그레이드 하세요! <Sparkles size={20} className="text-amber-400 shrink-0" />
                </span>
              </h3>
              <p className="text-emerald-100/70 font-medium mb-0 text-sm sm:text-base flex flex-col items-center md:items-start">
                <span className="whitespace-nowrap">
                  선택하신 {selectedPlan} 플랜으로 한 달간 모든 혜택을
                </span>
                <span className="whitespace-nowrap mb-1">누릴 수 있습니다.</span>

                {selectedPlan !== 'BASIC' && (
                  <span className="text-amber-300 font-bold whitespace-nowrap mb-1">
                    신청 시 {PLANS.find((p) => p.id === selectedPlan)?.price}이 결제됩니다.
                  </span>
                )}

                <span className="whitespace-nowrap opacity-80 mt-1">
                  언제든 해지가 가능하며 첫 결제 시
                </span>
                <span className="whitespace-nowrap opacity-80">포인트 보너스를 드려요.</span>
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 min-w-[200px] w-full md:w-auto">
              {loading ? (
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 border-4 border-white border-t-transparent rounded-full"
                  />
                  <span className="font-bold">결제 준비 중...</span>
                </div>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePayment}
                    disabled={selectedPlan === 'BASIC'}
                    className={`w-full py-4 px-6 sm:py-5 sm:px-10 rounded-2xl sm:rounded-3xl font-black text-base sm:text-lg flex items-center justify-center gap-2 shadow-2xl transition-all ${
                      selectedPlan === 'BASIC'
                        ? 'bg-emerald-800 text-emerald-900 cursor-not-allowed'
                        : 'bg-amber-400 text-emerald-950 hover:bg-amber-300'
                    }`}
                  >
                    {selectedPlan !== 'BASIC'
                      ? `${PLANS.find((p) => p.id === selectedPlan)?.price} 결제하기`
                      : '결제하기'}{' '}
                    <ArrowRight size={20} />
                  </motion.button>
                  <p className="text-[10px] text-emerald-300 font-bold tracking-tight">
                    * Toss Payments로 안전하게 결제됩니다.
                  </p>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* 푸터 안내 */}
        <div className="mt-10 sm:mt-16 text-center space-y-3 sm:space-y-4">
          <p className="text-gray-400 text-[11px] sm:text-xs font-bold leading-relaxed flex flex-col items-center gap-1">
            <span className="whitespace-nowrap">구독은 매월 자동 갱신되며, 언제든지</span>
            <span className="whitespace-nowrap">
              마이페이지 설정에서 멤버십을 변경할 수 있습니다.
            </span>
            <span className="whitespace-nowrap mt-1 opacity-60 italic">
              결제와 관련된 문의는 고객센터 1:1 문의하기를 이용해주세요.
            </span>
          </p>
          <button
            onClick={() => navigate('/mypage')}
            className="inline-flex items-center gap-2 text-[#1B4332] font-black text-sm transition-opacity hover:opacity-70"
          >
            <ChevronLeft size={16} /> 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
