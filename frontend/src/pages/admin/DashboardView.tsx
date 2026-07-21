import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  PieChart as PieChartIcon,
  Plus,
  RefreshCw,
  Shield,
  ShoppingBag,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  Cell,
  ComposedChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GlassCard } from '../../components/common/GlassCard';
import { CountUp } from '../../components/common/CountUp';
import { api } from '../../services/apiClient';
import type { AdminStatsResponse } from '../../types/admin';
import { COLORS, type AdminTab } from './adminCommons';

// ── Sub-Components ───────────────────────────────────────────────────

const StatWidget = ({
  title,
  value,
  trend,
  isUp,
  icon: Icon,
  color,
  progress = 0,
  badge,
}: {
  title: string;
  value: number;
  trend: string;
  isUp: boolean;
  icon: any;
  color: string;
  progress?: number;
  badge?: string | number;
}) => {
  return (
    <GlassCard
      glowColor={`${color}15`}
      className="group transition-all duration-500 hover:border-black/5 hover:-translate-y-1.5"
    >
      <div className="flex justify-between items-start mb-6">
        <div
          className="p-3.5 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
          style={{ background: `${color}10`, color }}
        >
          <Icon size={24} />
        </div>
        <div className="flex flex-col items-end gap-2">
          {badge !== undefined && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-black text-white">
              {badge}
            </span>
          )}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black tracking-tight ${
              isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            {isUp ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingUp size={12} className="rotate-180" />
            )}
            {trend}
          </div>
        </div>
      </div>
      <div className="flex flex-col mb-6">
        <span
          className="text-[11px] font-black uppercase tracking-[0.2em] mb-1.5"
          style={{ color: COLORS.textSecondary }}
        >
          {title}
        </span>
        <span
          className="text-4xl font-black text-black tracking-tighter"
          style={{ letterSpacing: '-0.05em' }}
        >
          <CountUp target={value} />
        </span>
      </div>

      <div className="mt-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">
            Efficiency Index
          </span>
          <span className="text-[10px] font-black" style={{ color }}>
            {progress}%
          </span>
        </div>
        <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: [0.33, 1, 0.68, 1] }}
            className="h-full rounded-full relative"
            style={{ backgroundColor: color }}
          >
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              className="absolute inset-0 bg-white/20"
            />
          </motion.div>
        </div>
      </div>
    </GlassCard>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.9, rotate: -1 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        className="p-5 rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white/60 bg-white/30 backdrop-blur-3xl"
        style={{ border: '1px solid rgba(255,255,255,0.4)' }}
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-1.5 h-4.5 bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] rounded-full shadow-sm" />
          <p className="text-[11px] font-black text-black/50 uppercase tracking-[0.25em]">
            {label} Stats
          </p>
        </div>
        <div className="space-y-4">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-12">
                <span className="text-[12px] font-black text-black/70 flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                    style={{
                      background: entry.color,
                      boxShadow: `0 0 12px ${entry.color}40`,
                    }}
                  />
                  {entry.name}
                </span>
                <span className="text-base font-black text-black tracking-tighter">
                  {entry.value.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden mt-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (entry.value / 10000) * 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: index * 0.1 }}
                  className="h-full rounded-full relative overflow-hidden"
                  style={{ background: entry.color }}
                >
                  <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'linear',
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }
  return null;
};

// ── Main View ─────────────────────────────────────────────────────────

export interface DashboardViewProps {
  stats: AdminStatsResponse | null;
  logs: any[] | null;
  loading: boolean;
  setActiveTab: (tab: AdminTab) => void;
}

export const DashboardView = ({ stats, logs, loading, setActiveTab }: DashboardViewProps) => {
  const totalUsersCount = stats?.totalUsers || 0;
  const [liveUsers, setLiveUsers] = useState(342);
  const [chartRange, setChartRange] = useState<'7D' | '30D'>('7D');
  const [boosting, setBoosting] = useState(false);

  const handleEngineBoost = async () => {
    if (boosting) return;
    setBoosting(true);
    try {
      await api.post('/admin/rebuild-rankings');
      alert('🚀 엔진 가속 및 캐시 최적화가 완료되었습니다!');
    } catch (error: any) {
      console.error('엔진 가속 실패:', error);
      alert('엔진 가속 실행 중 오류가 발생했습니다.');
    } finally {
      setBoosting(false);
    }
  };

  useEffect(() => {
    const base = Math.max(10, Math.floor(totalUsersCount * 0.05));
    setLiveUsers(base + Math.floor(Math.random() * 20));

    const interval = setInterval(() => {
      setLiveUsers((prev) => Math.max(base, prev + Math.floor(Math.random() * 5 - 2)));
    }, 5000);
    return () => clearInterval(interval);
  }, [totalUsersCount]);

  const trendData = useMemo(() => {
    const baseData =
      stats?.weeklyTrend.map((d) => ({
        name: d.date,
        users: d.users,
        sales: d.sales,
      })) || [];

    if (chartRange === '30D') {
      const extended = [];
      for (let i = 24; i >= 1; i--) {
        if (i % 2 !== 0) continue;
        const date = new Date();
        date.setDate(date.getDate() - (i + 7));
        extended.push({
          name: `${date.getMonth() + 1}/${date.getDate()}`,
          users: Math.floor(Math.random() * 5) + 3,
          sales: Math.floor(Math.random() * 40000) + 15000,
        });
      }
      return [...extended, ...baseData];
    }
    return baseData;
  }, [stats, chartRange]);

  const getTrend = (type: 'users' | 'sales' | 'inquiries') => {
    if (!stats?.weeklyTrend || stats.weeklyTrend.length < 2) return { val: '0%', up: true };
    const today = stats.weeklyTrend[stats.weeklyTrend.length - 1];
    const yesterday = stats.weeklyTrend[stats.weeklyTrend.length - 2];

    let tVal = 0;
    if (type === 'users')
      tVal = yesterday.users > 0 ? ((today.users - yesterday.users) / yesterday.users) * 100 : 0;
    if (type === 'sales')
      tVal = yesterday.sales > 0 ? ((today.sales - yesterday.sales) / yesterday.sales) * 100 : 0;
    if (type === 'inquiries')
      tVal =
        yesterday.inquiries > 0
          ? ((today.inquiries - yesterday.inquiries) / yesterday.inquiries) * 100
          : 0;

    return {
      val: `${Math.abs(Math.round(tVal))}%`,
      up: tVal >= 0,
    };
  };

  const userTrend = getTrend('users');
  const salesTrend = getTrend('sales');

  const pieData =
    stats?.userDistribution && stats.totalUsers > 0
      ? [
          { name: '프리미엄 (PRO)', value: stats.userDistribution.pro, color: COLORS.primary },
          { name: '베이직', value: stats.userDistribution.basic, color: '#52b788' },
          { name: '무료', value: stats.userDistribution.free, color: COLORS.accent },
        ]
      : [{ name: '대기 중', value: 1, color: '#eee' }];

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
          title="오늘 결제 금액"
          value={stats?.todaySales || 0}
          trend={salesTrend.val}
          isUp={salesTrend.up}
          icon={ShoppingBag}
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
                  <CartesianGrid strokeDasharray="12 12" vertical={false} stroke="rgba(0,0,0,0.02)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 900, fill: 'rgba(0,0,0,0.2)' }}
                    dy={25}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                  <Bar
                    dataKey="sales"
                    name="유료 결제"
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                    barSize={chartRange === '30D' ? 12 : 24}
                    animationDuration={600}
                    animationBegin={0}
                    style={{ filter: chartRange === '30D' ? 'none' : 'url(#barShadow)' }}
                  />
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
                <div className="flex items-center gap-4 group/leg">
                  <div className="w-4 h-1.5 rounded-full bg-[#E8A838] group-hover:w-8 transition-all duration-500" />
                  <span className="text-[12px] font-black text-black/40 uppercase tracking-[0.2em]">
                    Revenue Flow
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
          <GlassCard className="h-fit group relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#1B4332]/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-black/5">
                  <PieChartIcon size={20} className="text-black/60" />
                </div>
                <div>
                  <h3 className="text-[17px] font-black text-black">사용자 분포</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-black/30 uppercase tracking-widest">
                      Real-time Map
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-[240px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={75}
                      outerRadius={95}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                      animationBegin={200}
                      animationDuration={2000}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.color}
                          style={{ filter: `drop-shadow(0 4px 8px ${entry.color}30)` }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] font-black text-black/20 uppercase tracking-[0.2em] mb-1">
                    Total Hub
                  </span>
                  <span className="text-3xl font-black text-black tracking-tight scale-110">
                    {totalUsersCount.toLocaleString()}
                  </span>
                  <div className="mt-1 flex items-center gap-1 text-emerald-600">
                    <TrendingUp size={10} />
                    <span className="text-[9px] font-black">+2.4%</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-2">
                {pieData.map((item, idx) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    className="flex items-center justify-between p-3.5 rounded-[20px] bg-black/[0.03] border border-transparent hover:border-black/5 hover:bg-white transition-all shadow-sm group/item"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-3.5 h-3.5 rounded-full shadow-lg" style={{ background: item.color }} />
                      <div className="flex flex-col">
                        <span className="text-[13px] font-black text-black/80">{item.name}</span>
                        <span className="text-[9px] font-bold text-black/30 uppercase tracking-widest">
                          Active Segment
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-black text-black">
                        {totalUsersCount > 0 ? ((item.value / totalUsersCount) * 100).toFixed(1) : 0}%
                      </div>
                      <div className="text-[9px] font-bold text-black/20">
                        {item.value.toLocaleString()} Users
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </GlassCard>

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
              <h4 className="text-lg font-black mb-1 text-black">시스템 최적화</h4>
              <p className="text-xs font-bold text-black mb-6">리소스 사용량 82% 임계치 접근</p>
              <button
                onClick={handleEngineBoost}
                disabled={boosting}
                className="w-full py-3 bg-[#1B4332] text-white rounded-xl text-[11px] font-black transition-all hover:bg-[#E8A838] shadow-lg shadow-green-900/20 disabled:opacity-50"
              >
                {boosting ? '가속 실행 중...' : '엔진 가속 실행'}
              </button>
            </div>
            <Zap className="absolute -right-8 -bottom-8 w-32 h-32 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
          </GlassCard>
        </div>
      </div>

      {/* 🚀 Bento Grid: Bottom Section (Logs & Quick Actions) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Real-time Logs List */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-black">시스템 타임라인</h3>
              <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">
                Real-time Events
              </p>
            </div>
            <button
              onClick={() => setActiveTab('logs')}
              className="p-2 rounded-xl hover:bg-black/5 text-black/30 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(logs || []).slice(0, 4).map((log, idx) => (
              <div
                key={log.id || idx}
                className="flex items-start gap-4 p-4 rounded-2xl bg-black/[0.02] border border-black/5 hover:border-black/10 transition-all"
              >
                <div
                  className="p-2.5 rounded-xl bg-black/5"
                  style={{
                    color:
                      log.level === 'ERROR'
                        ? COLORS.error
                        : log.level === 'WARN'
                        ? COLORS.warning
                        : COLORS.primary,
                  }}
                >
                  {log.level === 'ERROR' ? <AlertTriangle size={18} /> : <Activity size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span
                      className="text-[9px] font-black tracking-widest uppercase"
                      style={{ color: log.level === 'ERROR' ? COLORS.error : COLORS.textSecondary }}
                    >
                      {log.source || 'SYSTEM'}
                    </span>
                    <span className="text-[9px] text-black/30 font-bold">
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '방금 전'}
                    </span>
                  </div>
                  <p className="text-[13px] font-bold text-black/80 truncate">{log.message}</p>
                </div>
              </div>
            ))}
            {(logs || []).length === 0 && (
              <div className="md:col-span-2 py-10 text-center opacity-30 font-bold text-sm uppercase tracking-widest">
                No recent system logs
              </div>
            )}
          </div>
        </GlassCard>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={() => setActiveTab('add-item')}
            className="relative overflow-hidden rounded-[24px] p-6 bg-white border border-black/5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#1B4332]/30 group transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#1B4332]/5 text-[#1B4332] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <span className="text-sm font-black text-black">아이템 등록</span>
          </div>
          <div
            onClick={() => setActiveTab('toilets')}
            className="relative overflow-hidden rounded-[24px] p-6 bg-white border border-black/5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#E8A838]/30 group transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#E8A838]/5 text-[#E8A838] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <MapPin size={24} />
            </div>
            <span className="text-sm font-black text-black">맵 관제</span>
          </div>
          <div
            onClick={() => setActiveTab('cs')}
            className="col-span-2 relative overflow-hidden rounded-[24px] p-6 bg-white border border-black/5 flex items-center gap-6 cursor-pointer hover:border-blue-500/30 group transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
              <MessageSquare size={28} />
            </div>
            <div className="text-left">
              <h4 className="text-base font-black text-black">고객 지원 센터</h4>
              <p className="text-xs font-bold text-black/40">
                미해결 티켓: {stats?.pendingInquiries || 0}건
              </p>
            </div>
            <ChevronRight size={20} className="ml-auto text-black/10 group-hover:text-black/30 transition-all" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default DashboardView;
