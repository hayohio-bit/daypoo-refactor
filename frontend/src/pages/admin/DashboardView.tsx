import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ChevronRight,
  LayoutDashboard,
  MessageSquare,
  Plus,
  RefreshCw,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CountUp } from '../../components/common/CountUp';
import { GlassCard } from '../../components/common/GlassCard';
import { api } from '../../services/apiClient';
import type { AdminStatsResponse } from '../../types/admin';
import { type AdminTab, COLORS } from './adminCommons';
import { DashboardBottomSection } from './dashboard/DashboardBottomSection';
import { DashboardTooltip } from './dashboard/DashboardTooltip';
import { StatWidget } from './dashboard/StatWidget';
import { useDashboardMetrics } from './dashboard/useDashboardMetrics';

// ── Main View ─────────────────────────────────────────────────────────

export interface DashboardViewProps {
  stats: AdminStatsResponse | null;
  logs: any[] | null;
  loading: boolean;
  setActiveTab: (tab: AdminTab) => void;
}

export const DashboardView = ({ stats, logs, loading, setActiveTab }: DashboardViewProps) => {
  const [chartRange, setChartRange] = useState<'7D' | '30D'>('7D');
  const { liveUsers, trendData, userTrend, inquiryTrend } = useDashboardMetrics(stats, chartRange);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <RefreshCw size={40} className="animate-spin text-[#1B4332] opacity-20" />
        <p className="text-sm font-black text-black/20 uppercase tracking-[0.3em]">
          Analyzing Real-time Data...
        </p>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* 🚀 Bento Grid: Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatWidget
          title="활성 접속자"
          value={liveUsers}
          trend={`${liveUsers > 300 ? 'ACTIVE' : 'STABLE'}`}
          isUp={true}
          icon={Activity}
          color="#3B82F6"
          progress={88}
        />
        <StatWidget
          title="오늘 가입한 신규 유저"
          value={stats?.todayNewUsers || 0}
          trend={userTrend.val}
          isUp={userTrend.up}
          icon={Plus}
          color={COLORS.primary}
          progress={75}
          badge={stats?.todayNewUsers || undefined}
        />
        <StatWidget
          title="오늘 신규 문의"
          value={stats?.todayInquiries || 0}
          trend={inquiryTrend.val}
          isUp={inquiryTrend.up}
          icon={MessageSquare}
          color={COLORS.accent}
          progress={65}
        />
        <StatWidget
          title="답변 대기 문의"
          value={stats?.pendingInquiries || 0}
          trend={`${stats?.pendingInquiries || 0} Ticket`}
          isUp={(stats?.pendingInquiries || 0) === 0}
          icon={MessageSquare}
          color="#FF4B4B"
          progress={98}
          badge={stats?.pendingInquiries || undefined}
        />
      </div>

      {/* 🚀 Bento Grid: Middle Section (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart Container */}
        <GlassCard className="lg:col-span-8 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-2xl bg-black text-white shadow-2xl flex items-center justify-center">
                    <Activity size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-black tracking-tighter leading-none mb-1">
                      성장 엔진 리포트
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] font-black text-black/30 uppercase tracking-[0.3em]">
                        Real-time Cluster Analysis
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[9px] font-black tracking-tighter uppercase">
                      Momentum +12.4%
                    </span>
                    <span className="text-[10px] font-black text-black/20 uppercase tracking-widest">
                      Peak Traffic
                    </span>
                  </div>
                  <span className="text-2xl font-black text-black tracking-tighter">
                    {Math.max(...trendData.map((d) => d.users), 0).toLocaleString()}
                  </span>
                </div>
                <div className="h-8 w-[1px] bg-black/5" />
                <div className="flex p-1.5 bg-black/[0.03] rounded-2xl border border-black/5">
                  {['7D', '30D'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setChartRange(range as any)}
                      className={`relative px-6 py-2.5 rounded-xl text-[11px] font-black transition-all duration-500 ${
                        chartRange === range ? 'text-white' : 'text-black/30 hover:text-black/60'
                      }`}
                    >
                      {chartRange === range && (
                        <motion.div
                          layoutId="activeRange"
                          className="absolute inset-0 bg-black rounded-xl shadow-xl z-0"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">{range}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-[440px] w-full relative">
              <motion.div
                key={chartRange}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute left-6 top-0 z-20 flex flex-col gap-1 pointer-events-none"
              >
                <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.4em]">
                  Current Growth Velocity
                </span>
                <span className="text-7xl font-black text-black tracking-[calc(-0.06em)] tabular-nums">
                  {trendData.length > 0
                    ? trendData[trendData.length - 1].users.toLocaleString()
                    : 0}
                </span>
              </motion.div>

              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={trendData}
                  margin={{ top: 100, right: 30, left: -20, bottom: 0 }}
                >
                  <defs>
                    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="mainGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1B4332" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#1B4332" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E8A838" stopOpacity={0.8} />
                      <stop offset="60%" stopColor="#E8A838" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#E8A838" stopOpacity={0.1} />
                    </linearGradient>
                    <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow
                        dx="0"
                        dy="8"
                        stdDeviation="12"
                        floodColor="#E8A838"
                        floodOpacity="0.2"
                      />
                    </filter>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="12 12"
                    vertical={false}
                    stroke="rgba(0,0,0,0.02)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 900, fill: 'rgba(0,0,0,0.2)' }}
                    dy={25}
                  />
                  <YAxis hide />
                  <Tooltip content={<DashboardTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                  <Area
                    type="monotone"
                    dataKey="users"
                    name="신규 방문"
                    stroke="#1B4332"
                    strokeWidth={chartRange === '30D' ? 4 : 6}
                    fill="url(#mainGradient)"
                    animationDuration={800}
                    style={{ filter: chartRange === '30D' ? 'none' : 'url(#neonGlow)' }}
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#000' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between mt-10 px-6">
              <div className="flex items-center gap-10">
                <div className="flex items-center gap-4 group/leg">
                  <div className="w-4 h-1.5 rounded-full bg-[#1B4332] group-hover:w-8 transition-all duration-500" />
                  <span className="text-[12px] font-black text-black/40 uppercase tracking-[0.2em]">
                    Active Traffic
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/5">
                <RefreshCw size={12} className="animate-spin duration-10s text-black/20" />
                <span className="text-[10px] font-black text-black/30 uppercase tracking-widest">
                  Auto Sync On
                </span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Membership Segment & Service Health */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard className="bg-white border border-black/5 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-[#1B4332]/10 text-[#1B4332]">
                  <Shield size={20} />
                </div>
                <span className="text-[10px] font-black text-black uppercase tracking-widest">
                  Engine Healthy
                </span>
              </div>
              <h4 className="text-lg font-black mb-1 text-black">시스템 상태</h4>
              <p className="text-xs font-bold text-black mb-6">모든 시스템이 정상 작동 중입니다.</p>
            </div>
            <Zap className="absolute -right-8 -bottom-8 w-32 h-32 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
          </GlassCard>
        </div>
      </div>

      <DashboardBottomSection stats={stats} logs={logs} setActiveTab={setActiveTab} />
    </motion.div>
  );
};
export default DashboardView;
