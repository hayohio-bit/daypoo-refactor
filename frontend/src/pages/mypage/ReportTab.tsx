import { AnimatePresence, motion, useInView } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Brain,
  Crown,
  Droplets,
  Lock,
  Minus,
  Plus,
  RefreshCw,
  Sparkles,
  Trophy,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WaveButtonComponent from '../../components/WaveButton';
import { KnockoutWobble } from '../../components/common/KnockoutWobble';
import { api } from '../../services/apiClient';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  },
});

export interface ReportTabProps {
  isPro: boolean;
  membershipName: string;
  onAddRecord?: () => void;
}

export const ReportTab = ({ isPro, membershipName, onAddRecord }: ReportTabProps) => {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [reportData, setReportData] = useState<any>(null);
  const [isFetchLoading, setIsFetchLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const reportCacheRef = useRef<Record<string, any>>({});
  const hasData = reportData != null;

  const fetchReport = useCallback(
    async (type: string) => {
      setReportData(null);

      // 일반회원은 weekly/monthly AI 분석 호출 차단
      if (!isPro && type !== 'daily') {
        setIsFetchLoading(false);
        return;
      }

      if (type !== 'daily' && reportCacheRef.current[type]) {
        setReportData(reportCacheRef.current[type]);
        return;
      }

      setIsFetchLoading(true);
      try {
        const res = await api.get(`/reports/${type.toUpperCase()}`);
        reportCacheRef.current[type] = res;
        setReportData(res);
      } catch (err: any) {
        console.error('리포트 조회 실패:', err);
        if (err.message?.includes('포인트')) {
          alert('포인트가 부족하여 리포트를 생성할 수 없습니다. 포인트를 충전해주세요!');
          setActiveSubTab('daily');
        }
      } finally {
        setIsFetchLoading(false);
      }
    },
    [isPro],
  );

  useEffect(() => {
    fetchReport(activeSubTab);
  }, [activeSubTab, fetchReport]);

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className="flex flex-col gap-8"
    >
      {onAddRecord && (
        <div className="flex justify-end">
          <WaveButtonComponent
            onClick={onAddRecord}
            variant="primary"
            size="md"
            className="animate-none"
            icon={<Plus size={16} />}
          >
            기록 추가하기
          </WaveButtonComponent>
        </div>
      )}

      {/* 서브 탭 */}
      <div className="flex p-1.5 sm:p-2 bg-gray-100 rounded-[16px] sm:rounded-[24px] w-full sm:w-fit mx-auto mb-4 mt-3 border border-gray-200 shadow-inner overflow-x-auto scrollbar-hide">
        {[
          { key: 'daily', label: '오늘 가이드', free: true },
          { key: 'weekly', label: '7일 리포트', free: false },
          { key: 'monthly', label: '30일 트렌드', free: false },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveSubTab(t.key as any)}
            className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-[12px] sm:rounded-[18px] text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 sm:gap-2.5 whitespace-nowrap ${
              activeSubTab === t.key
                ? 'bg-white text-[#1B4332] shadow-md border border-gray-100'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'
            }`}
          >
            {t.label}
            {!t.free && (
              <Crown
                size={14}
                className={activeSubTab === t.key ? 'text-amber-500' : 'text-gray-300'}
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'daily' ? (
          <motion.div
            key="daily"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {!isPro && (
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => navigate('/premium')}
                className="rounded-[32px] p-6 cursor-pointer overflow-hidden relative"
                style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)' }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-900/30">
                      <Sparkles className="text-emerald-950" size={24} />
                    </div>
                    <div>
                      <p className="text-white font-black text-base">7일 정밀 분석 리포트 해제</p>
                      <p className="text-emerald-200/60 text-xs font-bold">
                        {membershipName} 멤버십으로 모든 통계를 한눈에 확인하세요
                      </p>
                    </div>
                  </div>
                  <Crown className="text-emerald-300" size={20} />
                </div>
              </motion.div>
            )}

            <div className="rounded-[24px] sm:rounded-[40px] p-5 sm:p-12 bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 sm:gap-5 mb-6 sm:mb-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[16px] sm:rounded-[24px] bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner flex-shrink-0">
                  <Activity className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-2xl font-black text-[#1A2B27] tracking-tight">
                    오늘의 쾌변 가이드
                  </h3>
                  <p className="text-[10px] sm:text-sm font-black text-gray-400 uppercase tracking-[0.15em] mt-1">
                    Free Analyst • Live Update
                  </p>
                </div>
              </div>

              {isFetchLoading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw size={36} className="animate-spin text-[#1B4332] opacity-35" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:gap-5 mb-6 sm:mb-8">
                    <div className="p-4 sm:p-8 rounded-[20px] sm:rounded-[36px] bg-gray-50 border border-gray-100 shadow-inner">
                      <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 sm:mb-2.5">
                        현재 장 상태
                      </p>
                      <p className="text-lg sm:text-2xl font-black text-[#1B4332] flex items-center gap-1.5 sm:gap-2.5">
                        {!hasData
                          ? '분석 데이터 없음'
                          : reportData?.healthScore > 80
                          ? '아주 좋음'
                          : reportData?.healthScore > 60
                          ? '좋음'
                          : '보통'}
                        <Sparkles size={22} className="text-amber-400" />
                      </p>
                    </div>
                    <div className="p-4 sm:p-8 rounded-[20px] sm:rounded-[36px] bg-gray-50 border border-gray-100 shadow-inner">
                      <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 sm:mb-2.5">
                        장 컨디션 점수
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-amber-500">
                        {reportData?.healthScore || 0}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-10 rounded-[20px] sm:rounded-[40px] bg-emerald-950 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Sparkles size={60} />
                    </div>
                    <p className="text-[11px] sm:text-[13px] font-black text-emerald-300 mb-2 sm:mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> AI Guide Poo Insight
                    </p>
                    <p className="text-base sm:text-xl font-bold leading-relaxed relative z-10 tracking-tight">
                      "
                      {reportData?.summary || '기록을 분석하고 있습니다. 화장실 기록을 남겨주세요!'}
                      "
                    </p>
                    {reportData?.solution && (
                      <p className="mt-3 sm:mt-4 text-emerald-200 text-sm sm:text-lg italic">
                        💡 {reportData.solution}
                      </p>
                    )}
                    {reportData?.premiumSolution && (
                      <button
                        onClick={() => setShowPremiumModal(true)}
                        className="mt-4 sm:mt-6 w-full py-3 sm:py-4 bg-amber-400 text-emerald-950 font-black rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 hover:bg-amber-300 transition-all uppercase tracking-widest text-xs sm:text-sm"
                      >
                        <Crown size={18} /> 프리미엄 정밀 분석 보기
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="pro-sections"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="relative min-h-[600px] sm:min-h-[800px]"
          >
            <div
              className={`space-y-6 ${
                !isPro ? 'blur-[8px] opacity-40 pointer-events-none select-none' : ''
              }`}
            >
              {isPro && isFetchLoading ? (
                <div className="rounded-[24px] sm:rounded-[40px] p-6 sm:p-12 bg-white border border-gray-100 shadow-sm flex items-center justify-center py-20 sm:py-32">
                  <RefreshCw size={44} className="animate-spin text-amber-500 opacity-40" />
                </div>
              ) : (
                <div className="rounded-[24px] sm:rounded-[40px] p-5 sm:p-12 bg-white border border-gray-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-10">
                    <h3 className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-[0.2em]">
                      {activeSubTab === 'weekly'
                        ? '7일 정밀 분석 리포트'
                        : '30일 컨디션 트렌드 리포트'}
                    </h3>
                    <div className="px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100 flex items-center gap-2 shadow-sm">
                      <Crown size={14} className="text-amber-500" />
                      <span className="text-xs font-black text-amber-600">
                        {membershipName} MEMBERSHIP
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-center mb-8 sm:mb-12">
                    <div className="relative">
                      <svg
                        width="160"
                        height="160"
                        viewBox="0 0 200 200"
                        className="sm:w-[200px] sm:h-[200px]"
                      >
                        <circle
                          cx="100"
                          cy="100"
                          r="90"
                          fill="none"
                          stroke="#f3f4f6"
                          strokeWidth="16"
                        />
                        <motion.circle
                          cx="100"
                          cy="100"
                          r="90"
                          fill="none"
                          stroke="#E8A838"
                          strokeWidth="16"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 90}`}
                          initial={{ strokeDashoffset: 2 * Math.PI * 90 }}
                          animate={{
                            strokeDashoffset:
                              2 * Math.PI * 90 * (1 - (reportData?.healthScore || 0) / 100),
                          }}
                          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                          transform="rotate(-90 100 100)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl sm:text-5xl font-black text-[#1A2B27] tracking-tighter">
                          {reportData?.healthScore || 0}
                        </span>
                        <span className="text-[12px] font-black text-gray-400 mt-0.5 uppercase tracking-widest">
                          Health Score
                        </span>
                      </div>
                    </div>
                  </div>

                  {reportData?.periodStart && reportData?.periodEnd && (
                    <p className="text-sm text-gray-400 text-center mb-6">
                      분석 기간: {new Date(reportData.periodStart).toLocaleDateString('ko-KR')} ~{' '}
                      {new Date(reportData.periodEnd).toLocaleDateString('ko-KR')}
                      &nbsp;({reportData.recordCount}건)
                    </p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-10">
                    {[
                      {
                        label: '최다 식단',
                        val: reportData?.mostFrequentDiet ?? '-',
                        emoji: <Droplets size={24} className="text-emerald-500" />,
                      },
                      {
                        label: '최다 컨디션',
                        val: reportData?.mostFrequentCondition ?? '-',
                        emoji: <AlertCircle size={24} className="text-red-500" />,
                      },
                      {
                        label: '최다 브리스톨',
                        val:
                          reportData?.mostFrequentBristol != null
                            ? `Step ${reportData.mostFrequentBristol}`
                            : '-',
                        emoji: <Activity size={24} className="text-blue-500" />,
                      },
                      {
                        label: '쾌변 비율',
                        val: reportData?.healthyRatio != null ? `${reportData.healthyRatio}%` : '-',
                        emoji: <Trophy size={24} className="text-amber-500" />,
                      },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center p-3 sm:p-6 rounded-[20px] sm:rounded-[32px] bg-gray-50 border border-gray-50 shadow-inner group hover:bg-white hover:shadow-xl transition-all"
                      >
                        <span className="text-[#1A2B27] mb-3 transform group-hover:scale-110 transition-transform">
                          {stat.emoji}
                        </span>
                        <span className="text-[10px] font-black text-gray-300 mb-1 uppercase tracking-tighter text-center">
                          {stat.label}
                        </span>
                        <span className="text-sm font-black text-[#1A2B27]">{stat.val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 sm:p-8 rounded-[20px] sm:rounded-[40px] bg-emerald-50 border border-emerald-100 shadow-inner">
                      <div className="flex items-center gap-3 mb-3 sm:mb-4">
                        <Brain size={18} className="text-emerald-700" />
                        <p className="text-sm sm:text-lg font-black text-emerald-800">
                          심층 분석 데이터 인사이트
                        </p>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        {(reportData?.insights || []).map((insight: string, i: number) => (
                          <p
                            key={i}
                            className="text-sm sm:text-base text-emerald-900/70 font-bold leading-relaxed flex items-start gap-2"
                          >
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            {insight}
                          </p>
                        ))}
                      </div>
                      {reportData?.solution && (
                        <div className="mt-6 pt-6 border-t border-emerald-100">
                          <p className="text-emerald-700 text-sm sm:text-lg italic font-bold">
                            💡 {reportData.solution}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {(activeSubTab === 'monthly' || !isPro) && (
                    <div className="mt-5 sm:mt-8 p-4 sm:p-8 rounded-[20px] sm:rounded-[40px] bg-gray-50 border border-gray-100 shadow-inner">
                      <div className="flex items-center justify-between mb-5 sm:mb-8">
                        <h4 className="text-base sm:text-lg font-black text-[#1A2B27]">
                          30일 심층 트렌드
                        </h4>
                        <div className="flex items-center gap-2">
                          {reportData?.improvementTrend === 'IMPROVING' ? (
                            <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-black flex items-center gap-1">
                              <TrendingUp size={14} /> 개선 중
                            </span>
                          ) : reportData?.improvementTrend === 'DECLINING' ? (
                            <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-600 text-xs font-black flex items-center gap-1">
                              <TrendingDown size={14} /> 주의 필요
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-600 text-xs font-black flex items-center gap-1">
                              <Minus size={14} /> 안정적
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">
                            주차별 장 컨디션 점수 추이
                          </p>
                          <div className="flex items-end justify-between h-40 px-4 border-b border-gray-200 pb-2 gap-4 overflow-visible">
                            {(reportData?.weeklyHealthScores || [0, 0, 0, 0]).map(
                              (score: number, i: number) => (
                                <div
                                  key={i}
                                  className="flex-1 flex flex-col items-center justify-end gap-2 h-full"
                                >
                                  {score > 0 && (
                                    <motion.span
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="text-[10px] font-black text-emerald-600 mb-1"
                                    >
                                      {score}
                                    </motion.span>
                                  )}
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(score, 4)}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    className="w-8 rounded-t-lg shadow-sm"
                                    style={{ backgroundColor: '#52b788' }}
                                  />
                                  <span className="text-[10px] font-bold text-gray-400 mt-1">
                                    {i + 1}주
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">
                            브리스톨 척도 분포
                          </p>
                          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                            {Object.entries(reportData?.bristolDistribution || {}).map(
                              ([key, val]: [string, any]) => {
                                const k = Number.parseInt(key);
                                const total = Object.values(
                                  reportData?.bristolDistribution || {},
                                ).reduce((a: any, b: any) => a + b, 0) as number;
                                const percentage = (val / (total || 1)) * 100;
                                const isHealthy = k === 3 || k === 4;
                                return (
                                  <div
                                    key={key}
                                    style={{
                                      width: `${percentage}%`,
                                      backgroundColor: isHealthy ? '#52b788' : '#e9c46a',
                                    }}
                                    title={`Step ${key}: ${val}회`}
                                    className="h-full border-r border-white last:border-0"
                                  />
                                );
                              },
                            )}
                          </div>
                          <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400">
                            <span>변비/정상</span>
                            <span>설사/묽은변</span>
                          </div>
                          <p className="mt-4 text-sm font-black text-[#1A2B27]">
                            일평균 배변:{' '}
                            <span className="text-emerald-600">
                              {reportData?.avgDailyRecordCount || 0}회
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 잠금 오버레이 */}
            {!isPro && (
              <div className="absolute inset-0 z-10 flex items-center justify-center p-3 sm:p-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-md bg-white/95 backdrop-blur-xl p-5 sm:p-14 rounded-[32px] sm:rounded-[56px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-white text-center"
                >
                  <motion.div
                    className="w-12 h-12 sm:w-20 sm:h-20 bg-amber-100 rounded-[20px] sm:rounded-[32px] flex items-center justify-center mx-auto mb-3 sm:mb-6 shadow-inner"
                    animate={{ rotate: [0, -15, 15, -10, 10, -5, 5, 0] }}
                    transition={{
                      duration: 0.8,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: 2,
                      ease: 'easeInOut',
                    }}
                  >
                    <Lock size={24} className="text-amber-500 sm:w-9 sm:h-9" />
                  </motion.div>
                  <h3 className="text-lg sm:text-2xl font-black text-[#1A2B27] mb-1 sm:mb-3 tracking-tight">
                    정밀 분석 리포트 잠금
                  </h3>
                  <p className="text-gray-500 font-bold text-xs sm:text-base mb-5 sm:mb-10 leading-relaxed">
                    {activeSubTab === 'weekly' ? '7일간의' : '30일간의'} 누적 기록을 바탕으로 산출되는 <br />
                    <span className="text-emerald-700">장 컨디션 점수</span>와{' '}
                    <span className="text-emerald-700">AI 푸의 맞춤 가이드</span>는<br />
                    <span className="text-[#1B4332] font-black">
                      {activeSubTab === 'weekly' ? 'PRO' : 'PREMIUM'} 멤버십
                    </span>{' '}
                    회원에게만 제공됩니다.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/premium')}
                    className="w-full py-3.5 sm:py-6 bg-[#1B4332] text-white font-black rounded-[18px] sm:rounded-[28px] shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-lg"
                  >
                    {activeSubTab === 'weekly' ? 'PRO' : 'PREMIUM'} 멤버십 가입하고 확인하기 <ArrowRight size={18} />
                  </motion.button>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reportOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReportOpen(false)}
              className="fixed inset-0 z-[200]"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed z-[201] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-y-auto"
              style={{
                width: 'min(520px, calc(100vw - 32px))',
                maxHeight: 'calc(100dvh - 48px)',
                background: '#ffffff',
                borderRadius: '28px',
                border: '1px solid rgba(26,43,39,0.08)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
              }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest block mb-1"
                      style={{ color: 'rgba(26,43,39,0.3)' }}
                    >
                      주간 진단서
                    </span>
                    <KnockoutWobble
                      text="데이푸의 주간 리포트"
                      gradient="linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #E8A838 100%)"
                      fontSize="18px"
                      fontWeight={900}
                      wobbleDuration={400}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setReportOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-3"
                    style={{ background: 'rgba(26,43,39,0.06)', color: 'rgba(26,43,39,0.4)' }}
                  >
                    <X size={15} />
                  </motion.button>
                </div>
                {!isPro ? (
                  <div className="text-center py-10">
                    <Lock size={40} className="mx-auto text-amber-500 mb-4" />
                    <p className="font-black text-[#1A2B27] mb-2">PRO 전용 정밀 리포트입니다</p>
                    <p className="text-sm text-gray-500 mb-6">
                      멤버십을 구독하고 전체 내용을 확인하세요.
                    </p>
                    <button
                      onClick={() => navigate('/premium')}
                      className="px-6 py-3 bg-[#1B4332] text-white rounded-xl font-bold"
                    >
                      PRO 가입하기
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <svg width="120" height="120" viewBox="0 0 120 120">
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke="rgba(26,43,39,0.06)"
                            strokeWidth="8"
                          />
                          <motion.circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke="#E8A838"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 50}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 50 * 0.15 }}
                            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            transform="rotate(-90 60 60)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span
                            className="font-black text-3xl"
                            style={{ color: '#E8A838', letterSpacing: '-0.04em' }}
                          >
                            85
                          </span>
                          <span className="text-[10px]" style={{ color: 'rgba(26,43,39,0.4)' }}>
                            쾌변 점수
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="rounded-2xl p-4 mb-4"
                      style={{
                        background: 'rgba(27,67,50,0.05)',
                        border: '1px solid rgba(82,183,136,0.18)',
                      }}
                    >
                      <p className="text-xs font-bold mb-3" style={{ color: '#2D6A4F' }}>
                        🤖 AI 인사이트
                      </p>
                      <p
                        className="text-sm leading-relaxed mb-3"
                        style={{ color: 'rgba(26,43,39,0.7)' }}
                      >
                        성격이 급하신가요? 배변 데이터가 조금 불규칙해요. 다음 주는 조금 더 여유를 가져보세요.
                      </p>
                    </div>
                  </>
                )}
                <div className="flex gap-2.5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setReportOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-black text-sm"
                    style={{ background: '#1B4332', color: '#fff' }}
                  >
                    닫기
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default ReportTab;
