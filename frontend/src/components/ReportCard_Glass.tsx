import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { Lock, TrendingUp, Sparkles, ArrowRight, Utensils, Droplets, Moon } from 'lucide-react';
import { HighlightReveal } from './HighlightReveal';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const PIE_DATA = [
  { name: 'Healthy', value: 85 },
  { name: 'Remaining', value: 15 },
];

const BAR_DATA = [
  { day: '월', score: 4 },
  { day: '화', score: 3 },
  { day: '수', score: 5 },
  { day: '목', score: 4 },
  { day: '금', score: 2 },
  { day: '토', score: 6 },
  { day: '일', score: 4 },
];

const LOCKED_INSIGHTS = [
  {
    icon: <Utensils size={20} className="text-[#1B4332]" />,
    label: '식습관 분석',
    preview: '매운 음식 섭취와 장 자극 패턴 관찰',
  },
  {
    icon: <Droplets size={20} className="text-[#1B4332]" />,
    label: '수분 섭취 연관성',
    preview: '수분 부족 시 브리스톨 지수 변화 경향',
  },
  {
    icon: <Moon size={20} className="text-[#1B4332]" />,
    label: '수면 & 장 리듬',
    preview: '수면 패턴과 배변 타이밍 상관관계 분석',
  },
];

export function ReportCard({ openAuth }: { openAuth: (mode: 'login' | 'signup') => void }) {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [50, -50]);

  const handleReportAction = () => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token) {
      navigate('/mypage');
    } else {
      openAuth('signup');
    }
  };

  return (
    <section
      ref={sectionRef}
      id="health-section"
      className="relative pt-12 sm:pt-40 pb-10 sm:pb-64 px-4 sm:px-6 overflow-hidden"
      style={{ backgroundColor: '#eef5f0' }}
    >
      {/* 배경 그라데이션 블롭 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 -right-48 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full opacity-15 will-change-transform"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#2d6a4f] via-[#52b788] to-[#95d5b2] blur-[40px] sm:blur-[80px]" />
        </div>

        <div
          className="absolute bottom-1/4 -left-48 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full opacity-12 will-change-transform"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] blur-[40px] sm:blur-[80px]" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* ── 섹션 헤더 ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-16"
        >
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: 'var(--green-mid)' }}
          >
            AI HEALTH REPORT
          </p>
          <h2
            className="text-2xl sm:text-3xl md:text-5xl font-black"
            style={{ color: 'var(--text-main)', letterSpacing: '-0.02em' }}
          >
            당신의 <HighlightReveal
              text="장이 말하고 있어요"
              highlightColor="#E8A838"
              highlightStyle="underline"
              animationDelay={0.8}
              translateY={8}
            />
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-lg" style={{ color: 'var(--text-sec)' }}>
            기록만 하면 AI가 알아서 분석합니다
          </p>
        </motion.div>

        {/* ── 메인 차트 카드 (Glass) ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          className="relative mb-8"
        >
          {/* 글로우 효과 */}
          <div
            className="absolute -inset-4 rounded-[48px] opacity-15 blur-3xl"
            style={{
              background: 'radial-gradient(circle at top right, rgba(45,106,79,0.4) 0%, rgba(232,168,56,0.2) 50%, transparent 100%)',
            }}
          />

          {/* 글래스 카드 */}
          <div
            className="relative p-5 sm:p-8 md:p-10 rounded-[24px] sm:rounded-[40px] overflow-hidden will-change-transform"
            style={{
              background: 'rgba(248, 250, 249, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(45, 106, 79, 0.12)',
              boxShadow: '0 8px 32px 0 rgba(27, 67, 50, 0.1)',
            }}
          >
            {/* 네온 보더 */}
            <div
              className="absolute inset-0 rounded-[40px] opacity-40 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(45,106,79,0.2) 0%, rgba(232,168,56,0.25) 50%, rgba(45,106,79,0.2) 100%)',
                backgroundSize: '200% 200%',
                animation: 'borderGlow 4s ease-in-out infinite',
              }}
            />

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-sec)' }}>
                    2026년 3월 3주차
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1" style={{ color: 'var(--text-main)' }}>
                    이번 주 쾌변 리포트
                  </h3>
                </div>
                <motion.span
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(232,168,56,0.15), rgba(232,168,56,0.08))',
                    color: '#c8941f',
                    border: '1px solid rgba(232,168,56,0.25)',
                    boxShadow: '0 2px 8px rgba(232,168,56,0.15)',
                  }}
                >
                  <Sparkles size={16} /> AI 분석 완료
                </motion.span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-10 items-center">
                {/* Pie Chart */}
                <div className="col-span-12 md:col-span-5 flex flex-col items-center justify-center">
                  <div className="w-full max-w-[140px] sm:max-w-[220px] md:max-w-[320px] aspect-square relative mx-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={PIE_DATA}
                          cx="50%" cy="50%"
                          innerRadius={85} outerRadius={115}
                          paddingAngle={10}
                          dataKey="value"
                          startAngle={90} endAngle={450}
                        >
                          <Cell fill="var(--amber)" />
                          <Cell fill="rgba(0,0,0,0.08)" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center flex flex-col items-center justify-center mt-2">
                        <motion.span
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          transition={{ type: "spring", delay: 0.5, stiffness: 100 }}
                          className="text-3xl sm:text-5xl md:text-7xl font-black leading-none"
                          style={{ color: 'var(--text-main)', letterSpacing: '-0.05em' }}
                        >
                          85
                        </motion.span>
                        <span className="text-sm font-bold mt-1 opacity-70" style={{ color: 'var(--text-sec)' }}>쾌변 점수</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="col-span-12 md:col-span-7 w-full">
                  <div className="w-full h-[200px] px-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={BAR_DATA} margin={{ top: 10, right: 10, bottom: 0, left: 10 }} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                        <XAxis
                          dataKey="day"
                          axisLine={false} tickLine={false}
                          tick={{ fill: 'var(--text-sec)', fontSize: 12 }}
                        />
                        <YAxis hide />
                        <Tooltip
                          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                          contentStyle={{
                            borderRadius: '16px',
                            border: 'none',
                            background: 'rgba(255,255,255,0.9)',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 10px 24px rgba(0,0,0,0.15)',
                          }}
                          formatter={(v) => [`${v}형`, '브리스톨']}
                        />
                        <Bar dataKey="score" fill="var(--green-mid)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-center text-xs mt-2" style={{ color: 'var(--text-sec)' }}>
                    7일 브리스톨 척도
                  </p>
                </div>
              </div>

              {/* AI 조언 (인라인) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(232,168,56,0.12), rgba(45,106,79,0.08))',
                  border: '1px solid rgba(232,168,56,0.2)',
                  boxShadow: '0 2px 12px rgba(232,168,56,0.08)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--amber)', color: '#fff' }}
                >
                  <Sparkles size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--amber)' }}>AI 한줄 조언</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                    매운 음식 줄이면 쾌변 점수 더 올라가요. 수분 섭취도 늘려보세요!
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* ── 인사이트 카드들 (레이어드) ─────────────────── */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 items-stretch">
          {LOCKED_INSIGHTS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative p-4 sm:p-6 rounded-[20px] sm:rounded-[28px] overflow-hidden group will-change-transform h-full flex flex-col justify-start min-h-[100px] sm:min-h-[130px]"
              style={{
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(45, 106, 79, 0.1)',
                boxShadow: '0 8px 30px -10px rgba(27, 67, 50, 0.08)',
              }}
            >
              {/* 호버 글로우 */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle at center, rgba(45,106,79,0.08), rgba(232,168,56,0.06), transparent 70%)',
                }}
              />

              {/* 잠금 오버레이 */}
              <div
                className="absolute inset-0 flex items-center justify-center z-10 rounded-[32px]"
                style={{
                  backgroundColor: 'rgba(248,250,249,0.88)'
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <Lock size={16} style={{ color: 'var(--green-mid)' }} />
                  <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: 'var(--green-mid)' }}>Check after JOIN</span>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <span>{item.icon}</span>
                <div>
                  <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-main)' }}>{item.label}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-sec)' }}>{item.preview}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── CTA 버튼 ─────────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleReportAction}
          className="w-full max-w-md mx-auto block p-5 rounded-3xl font-bold flex items-center justify-center gap-3 transition-all"
          style={{
            background: 'linear-gradient(135deg, #E8A838 0%, #d99a2e 100%)',
            color: 'var(--green-deep)',
            boxShadow: '0 8px 32px rgba(232,168,56,0.35), 0 4px 12px rgba(45,106,79,0.15), inset 0 1px 0 rgba(255,255,255,0.4)',
          }}
        >
          <TrendingUp size={20} />
          내 배변 패턴 리포트 보기
          <ArrowRight size={18} />
        </motion.button>
      </div>

      <style>{`
        @keyframes borderGlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </section>
  );
}
