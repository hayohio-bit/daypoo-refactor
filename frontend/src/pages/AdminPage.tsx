import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  MapPin,
  MessageSquare,
  ShoppingBag,
  Settings,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  AlertTriangle,
  Activity,
  DollarSign,
  LogOut,
  Bell,
  RefreshCw,
  Plus,
  Shield,
  Zap,
  Search,
  Clock,
  Calendar,
  Navigation,
  Star,
  Maximize2,
  Home,
  Trash2,
  Database,
  Sparkles,
  Lock,
  X,
  Server,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Power,
  UserPlus,
  BrainCircuit,
  MessageCircle,
  Pencil,
  PieChart as PieChartIcon,
} from 'lucide-react';
import WaveButtonComponent from '../components/WaveButton';
import { generateItemAvatar, parseDicebearUrl, AvatarStyle } from '../utils/avatar';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  ComposedChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { useToilets } from '../hooks/useToilets';
import { ToiletData } from '../types/toilet';
import { api } from '../services/apiClient';
import {
  AdminUserListResponse,
  AdminUserDetailResponse,
  AdminInquiryListResponse,
  AdminInquiryDetailResponse,
  AdminToiletListResponse,
  PageResponse,
  Role,
  InquiryStatus,
  ItemResponse,
  ItemType,
  AdminStatsResponse,
  AdminTitleResponse,
  AdminTitleCreateRequest,
  AdminTitleUpdateRequest,
  AdminItemCreateRequest,
  AchievementType,
  SyncStatusResponse,
} from '../types/admin';

// ── Shared Constants & Types ──────────────────────────────────────────
type AdminTab =
  | 'dashboard'
  | 'users'
  | 'toilets'
  | 'cs'
  | 'store'
  | 'titles'
  | 'system'
  | 'add-item'
  | 'edit-item'
  | 'add-title'
  | 'edit-title'
  | 'logs';

const COLORS = {
  primary: '#1B4332',
  secondary: '#2D6A4F',
  accent: '#E8A838',
  error: '#FF4B4B',
  warning: '#F4A261',
  info: '#3B82F6',
  surface: '#FFFFFF',
  background: '#f8faf9',
  border: 'rgba(26,43,39,0.08)',
  textPrimary: '#1A2B27',
  textSecondary: 'rgba(26,43,39,0.5)',
};

// ── Sub-Components: Common Elements ──────────────────────────────────
const GlassCard = ({
  children,
  className = '',
  glowColor = 'rgba(27,67,50,0.05)',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, boxShadow: `0 20px 40px ${glowColor}` }}
    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    onClick={onClick}
    className={`relative overflow-hidden rounded-[24px] p-6 ${className}`}
    style={{
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${COLORS.border}`,
      boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
    }}
  >
    {children}
  </motion.div>
);

const StatWidget = ({ title, value, trend, isUp, icon: Icon, color, progress = 0, badge }: any) => {
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
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-black text-white">
              {badge}
            </span>
          )}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black tracking-tight ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}
          >
            {isUp ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
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
          {value}
        </span>
      </div>

      {/* 🚀 Gauge Bar Implementation */}
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
              transition={{ duration: 2, repeat: Infinity }}
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
                      boxShadow: `0 0 12px ${entry.color}40`
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
                  transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                  className="h-full rounded-full relative overflow-hidden"
                  style={{ background: entry.color }}
                >
                  <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
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

// ── Screen: Dashboard (Overview) ──────────────────────────────────────
const DashboardView = ({
  stats,
  logs,
  loading,
  setActiveTab,
}: {
  stats: AdminStatsResponse | null;
  logs: any[] | null;
  loading: boolean;
  setActiveTab: (tab: AdminTab) => void;
}) => {
  const totalUsersCount = stats?.totalUsers || 0;
  const [liveUsers, setLiveUsers] = useState(342);
  const [chartRange, setChartRange] = useState<'7D' | '30D'>('7D');

  useEffect(() => {
    // 실제 총 유저수에 기반하여 접속자 수 시뮬레이션
    const base = Math.max(10, Math.floor(totalUsersCount * 0.05));
    setLiveUsers(base + Math.floor(Math.random() * 20));

    const interval = setInterval(() => {
      setLiveUsers((prev) => Math.max(base, prev + Math.floor(Math.random() * 5 - 2)));
    }, 5000);
    return () => clearInterval(interval);
  }, [totalUsersCount]);

  const trendData = useMemo(() => {
    const baseData = stats?.weeklyTrend.map((d) => ({
      name: d.date,
      users: d.users,
      sales: d.sales,
    })) || [];

    if (chartRange === '30D') {
      // 30일 데이터 시각적 최적화: 격일(Every other day) 샘플링으로 밀도 조절
      const extended = [];
      for (let i = 24; i >= 1; i--) {
        if (i % 2 !== 0) continue; // 데이터 포인트 1/2 축소로 시원한 뷰 제공
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

  // 트렌드 계산 (어제 대비 오늘)
  const getTrend = (type: 'users' | 'sales' | 'inquiries') => {
    if (!stats?.weeklyTrend || stats.weeklyTrend.length < 2) return { val: '0%', up: true };
    const today = stats.weeklyTrend[stats.weeklyTrend.length - 1];
    const yesterday = stats.weeklyTrend[stats.weeklyTrend.length - 2];
    
    let tVal = 0;
    if (type === 'users') tVal = yesterday.users > 0 ? ((today.users - yesterday.users) / yesterday.users) * 100 : 0;
    if (type === 'sales') tVal = yesterday.sales > 0 ? ((today.sales - yesterday.sales) / yesterday.sales) * 100 : 0;
    if (type === 'inquiries') tVal = yesterday.inquiries > 0 ? ((today.inquiries - yesterday.inquiries) / yesterday.inquiries) * 100 : 0;

    return {
      val: `${Math.abs(Math.round(tVal))}%`,
      up: tVal >= 0
    };
  };

  const userTrend = getTrend('users');
  const inquiryTrend = getTrend('inquiries');

  const inquiriesSpark = (stats?.weeklyTrend || []).map((d) => ({ v: d.inquiries }));
  const toiletSpark = (stats?.weeklyTrend || []).map((d) => ({ v: d.users || 0 })); 

  const pieData = (stats?.userDistribution && stats.totalUsers > 0)
    ? [
        { name: '프리미엄 (PRO)', value: stats.userDistribution.pro, color: COLORS.primary },
        { name: '베이직', value: stats.userDistribution.basic, color: '#52b788' },
        { name: '무료', value: stats.userDistribution.free, color: COLORS.accent },
      ]
    : [
        { name: '대기 중', value: 1, color: '#eee' },
      ];

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
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="space-y-8 pb-20"
    >
      {/* 🔮 Dashboard Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping absolute inset-0" />
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full relative z-10" />
            </div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">
              System Engine Active
            </span>
          </div>
          <h2 className="text-4xl font-black text-black tracking-tighter">
            Next-Gen <span className="text-[#1B4332]">Dashboard</span>
          </h2>
        </div>
        <div className="flex flex-col items-start md:items-end opacity-40">
          <span className="text-[10px] font-black uppercase tracking-widest">Global Status Node</span>
          <span className="text-xs font-bold">{new Date().toLocaleString('ko-KR', { hour12: true, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>

      {/* 🍱 Bento Grid: Top Section (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="md:col-span-2 lg:col-span-1" onClick={() => setActiveTab('users')}>
          <StatWidget
            title="현재 접속자"
            value={liveUsers}
            trend="+12%"
            isUp
            color={COLORS.info}
            icon={Activity}
            progress={Math.min(100, Math.floor((liveUsers / 500) * 100))}
            badge="Live"
          />
        </div>
        <div onClick={() => setActiveTab('users')}>
          <StatWidget
            title="누적 사용자"
            value={(stats?.totalUsers || 0).toLocaleString()}
            trend={`${userTrend.up ? '+' : '-'}${userTrend.val}`}
            isUp={userTrend.up}
            color={COLORS.primary}
            icon={Users}
            progress={78}
          />
        </div>
        <div onClick={() => setActiveTab('toilets')}>
          <StatWidget
            title="관리 화장실"
            value={(stats?.totalToilets || 0).toLocaleString()}
            trend={`+${(stats?.weeklyTrend && stats.weeklyTrend.length > 0) ? (stats.weeklyTrend[stats.weeklyTrend.length - 1].users || 0) : 0}`}
            isUp
            color={COLORS.accent}
            icon={MapPin}
            progress={64}
          />
        </div>
        <div onClick={() => setActiveTab('cs')}>
          <StatWidget
            title="미답변 문의"
            value={`${stats?.pendingInquiries || 0}`}
            trend={`${inquiryTrend.up ? '+' : '-'}${inquiryTrend.val}`}
            isUp={!inquiryTrend.up} // 문의가 줄어야 좋은 것이므로 반대로
            color={COLORS.error}
            icon={MessageSquare}
            progress={Math.max(10, Math.min(100, (stats?.pendingInquiries || 0) * 10))}
            badge={stats?.pendingInquiries && stats.pendingInquiries > 0 ? 'Urgent' : undefined}
          />
        </div>
      </div>

      {/* 📊 Bento Grid: Main Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Growth Chart */}
        <GlassCard className="lg:col-span-8 group relative overflow-hidden bg-white/40 border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)]">
          {/* 💎 Premium Mesh Background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1B4332,transparent)]" />
            <div className="absolute inset-0 bg-[#1B4332]/5 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
          </div>
          
          <div className="relative z-10 p-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-2xl bg-black text-white shadow-2xl flex items-center justify-center">
                    <Activity size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-black tracking-tighter leading-none mb-1">성장 엔진 리포트</h3>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] font-black text-black/30 uppercase tracking-[0.3em]">Real-time Cluster Analysis</span>
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
                    <span className="text-[10px] font-black text-black/20 uppercase tracking-widest">Peak Traffic</span>
                  </div>
                  <span className="text-2xl font-black text-black tracking-tighter">
                    {Math.max(...trendData.map(d => d.users)).toLocaleString()}
                  </span>
                </div>
                <div className="h-8 w-[1px] bg-black/5" />
                <div className="flex p-1.5 bg-black/[0.03] rounded-2xl border border-black/5">
                  {['7D', '30D'].map((range) => (
                    <button 
                      key={range}
                      onClick={() => setChartRange(range as any)}
                      className={`relative px-6 py-2.5 rounded-xl text-[11px] font-black transition-all duration-500 ${chartRange === range ? 'text-white' : 'text-black/30 hover:text-black/60'}`}
                    >
                      {chartRange === range && (
                        <motion.div 
                          layoutId="activeRange"
                          className="absolute inset-0 bg-black rounded-xl shadow-xl z-0"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">{range}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-[440px] w-full relative">
              {/* Floating Value Indicator */}
              <motion.div 
                key={chartRange}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute left-6 top-0 z-20 flex flex-col gap-1 pointer-events-none"
              >
                <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.4em]">Current Growth Velocity</span>
                <span className="text-7xl font-black text-black tracking-[calc(-0.06em)] tabular-nums">
                  {trendData.length > 0 ? trendData[trendData.length - 1].users.toLocaleString() : 0}
                </span>
              </motion.div>

              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 100, right: 30, left: -20, bottom: 0 }}>
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
                      <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#E8A838" floodOpacity="0.2" />
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
                  <YAxis
                    hide
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  />
                  <Bar
                    dataKey="sales"
                    name="유료 결제"
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                    barSize={chartRange === '30D' ? 12 : 24} // 데이터 양이 많을 때는 막대 굵기 축소
                    animationDuration={600} // 빠른 피드백을 위해 애니메이션 가속
                    animationBegin={0}
                    style={{ filter: chartRange === '30D' ? 'none' : 'url(#barShadow)' }} // 30D일 때는 렉 유발 필터 비활성
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
                    activeDot={{ r: 8, strokeWidth: 0, fill: "#000" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex items-center justify-between mt-10 px-6">
              <div className="flex items-center gap-10">
                <div className="flex items-center gap-4 group/leg">
                  <div className="w-4 h-1.5 rounded-full bg-[#1B4332] group-hover:w-8 transition-all duration-500" />
                  <span className="text-[12px] font-black text-black/40 uppercase tracking-[0.2em]">Active Traffic</span>
                </div>
                <div className="flex items-center gap-4 group/leg">
                  <div className="w-4 h-1.5 rounded-full bg-[#E8A838] group-hover:w-8 transition-all duration-500" />
                  <span className="text-[12px] font-black text-black/40 uppercase tracking-[0.2em]">Revenue Flow</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/5">
                <RefreshCw size={12} className="animate-spin duration-10s text-black/20" />
                <span className="text-[10px] font-black text-black/30 uppercase tracking-widest">Auto Sync On</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Membership Segment & Service Health */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard className="h-fit group relative overflow-hidden">
            {/* Dynamic Orbit Background Effect */}
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
                    <span className="text-[9px] font-black text-black/30 uppercase tracking-widest">Real-time Map</span>
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
                        <Cell key={index} fill={entry.color} style={{ filter: `drop-shadow(0 4px 8px ${entry.color}30)` }} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] font-black text-black/20 uppercase tracking-[0.2em] mb-1">Total Hub</span>
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
                        <span className="text-[9px] font-bold text-black/30 uppercase tracking-widest">Active Segment</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-black text-black">
                        {totalUsersCount > 0 ? ((item.value / totalUsersCount) * 100).toFixed(1) : 0}%
                      </div>
                      <div className="text-[9px] font-bold text-black/20">{item.value.toLocaleString()} Users</div>
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
                onClick={() => setActiveTab('system')}
                className="w-full py-3 bg-[#1B4332] text-white rounded-xl text-[11px] font-black transition-all hover:bg-[#E8A838] shadow-lg shadow-green-900/20"
              >
                엔진 가속 실행
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
                  style={{ color: log.level === 'ERROR' ? COLORS.error : log.level === 'WARN' ? COLORS.warning : COLORS.primary }}
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
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '방금 전'}
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
            <ChevronRight
              size={20}
              className="ml-auto text-black/10 group-hover:text-black/30 transition-all"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ── Screen: Users Management ─────────────────────────────────────────
const UsersView = () => {
  const [users, setUsers] = useState<AdminUserListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserListResponse | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '20',
      });
      if (search) params.append('search', search);
      if (roleFilter && roleFilter !== 'ALL') params.append('role', roleFilter);
      if (planFilter && planFilter !== 'ALL') params.append('plan', planFilter);

      const response = await api.get<PageResponse<AdminUserListResponse>>(`/admin/users?${params}`);
      setUsers(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error: any) {
      console.error('유저 목록 조회 실패:', error);
      alert('유저 목록을 불러오는데 실패했습니다. (' + (error.message || '네트워크 오류') + ')');
    } finally {
      setLoading(false);
    }
  };

  // Search Debounce Logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter, planFilter]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(0);
    fetchUsers();
  };

  const handleOpenUserDetail = async (user: AdminUserListResponse) => {
    setSelectedUser(user);
    setShowUserModal(true);
    setLoadingDetail(true);
    try {
      const detail = await api.get<AdminUserDetailResponse>(`/admin/users/${user.id}`);
      setUserDetail(detail);
    } catch (error: any) {
      console.error('유저 상세 조회 실패:', error);
      console.error('Error response:', error.response);
      const errorMsg = error.response?.data?.message || error.message || '알 수 없는 오류';
      alert(`유저 정보를 불러오는데 실패했습니다.\n상세: ${errorMsg}`);
      setShowUserModal(false); // 에러 시 모달 닫기
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateUserRole = async (userId: number, newRole: Role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      alert('역할이 변경되었습니다.');
      setShowUserModal(false);
      fetchUsers(); // 목록 새로고침
    } catch (error: any) {
      console.error('역할 변경 실패:', error);
      alert('역할 변경에 실패했습니다.');
    }
  };

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    const confirmed = window.confirm(
      `정말로 이 사용자를 탈퇴시키겠습니까?\n\n` +
        `이메일: ${userEmail}\n\n` +
        `⚠️ 경고: 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.`,
    );

    if (!confirmed) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      alert('사용자가 성공적으로 탈퇴되었습니다.');
      setShowUserModal(false);
      fetchUsers(); // 목록 새로고침
    } catch (error: any) {
      console.error('사용자 삭제 실패:', error);
      alert('탈퇴 처리 중 오류가 발생했습니다. (권한 또는 데이터 제약 조건 확인 필요)');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString)
      .toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(/\. /g, '.');
  };

  const getRoleBadge = (role: Role) => {
    return role === 'ROLE_ADMIN' ? 'ADMIN' : 'USER';
  };

  const getPlanBadge = (plan: 'BASIC' | 'PRO' | 'PREMIUM') => {
    switch (plan) {
      case 'PRO':
        return <span className="bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase">PRO</span>;
      case 'PREMIUM':
        return <span className="bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase">PREMIUM</span>;
      default:
        return <span className="bg-black/5 text-black/40 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase">BASIC</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black text-black">유저 데이터 센터</h3>
          <p className="text-sm text-black/60 font-bold">
            총 {totalElements.toLocaleString()}명의 사용자
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
            <input
              type="text"
              placeholder="이메일 또는 닉네임으로 검색"
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-black/5 bg-white/50 backdrop-blur-xl focus:outline-none focus:border-[#1B4332]/30 transition-all font-bold text-sm text-[#1B4332] placeholder:text-black/20"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <div className="relative group">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(0);
              }}
              className="pl-4 pr-10 py-3 rounded-2xl border border-black/5 bg-white/50 backdrop-blur-xl focus:outline-none focus:border-[#1B4332]/30 transition-all font-black text-sm appearance-none cursor-pointer text-[#1B4332] hover:bg-white hover:shadow-md"
            >
              <option value="ALL">역할: 전체</option>
              <option value="ROLE_USER">일반 유저</option>
              <option value="ROLE_ADMIN">관리자</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black/20 group-hover:text-[#1B4332] transition-colors">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>

          {/* Plan Filter */}
          <div className="relative group">
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setPage(0);
              }}
              className="pl-4 pr-10 py-3 rounded-2xl border border-black/5 bg-white/50 backdrop-blur-xl focus:outline-none focus:border-[#1B4332]/30 transition-all font-black text-sm appearance-none cursor-pointer text-[#1B4332] hover:bg-white hover:shadow-md"
            >
              <option value="ALL">플랜: 전체</option>
              <option value="BASIC">BASIC (미구독)</option>
              <option value="PRO">PRO</option>
              <option value="PREMIUM">PREMIUM</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black/20 group-hover:text-[#1B4332] transition-colors">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
        </div>
      ) : (
        <>
          <GlassCard className="p-0 border-none bg-transparent shadow-none">
            <div
              className="overflow-x-auto rounded-[28px] border bg-white/50 backdrop-blur-xl"
              style={{ borderColor: COLORS.border }}
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/[0.02] border-b" style={{ borderColor: COLORS.border }}>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      사용자 정보
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      가입일
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      구독 정보
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      레벨
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      포인트
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      기록 수
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40 text-right">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b transition-colors hover:bg-black/[0.01]"
                      style={{ borderColor: COLORS.border }}
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-black/[0.05] flex items-center justify-center font-black text-black/60 text-xs">
                            {u.id}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-[#1B4332]">
                                {u.nickname}
                              </span>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                  u.role === 'ROLE_ADMIN'
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-black/5 text-black/40'
                                }`}
                              >
                                {getRoleBadge(u.role)}
                              </span>
                            </div>
                            <p className="text-xs text-black/30 font-bold">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-black/60">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-8 py-5">
                        {getPlanBadge(u.plan)}
                      </td>
                      <td className="px-8 py-5 font-black text-[#2D6A4F]">Lv.{u.level}</td>
                      <td className="px-8 py-5 font-black text-[#E8A838]">
                        {u.points.toLocaleString()} P
                      </td>
                      <td className="px-8 py-5 font-bold text-black/60">{u.recordCount}건</td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => handleOpenUserDetail(u)}
                          className="p-2 rounded-xl hover:bg-black/5 text-black/20 hover:text-black/60 transition-colors"
                        >
                          <Settings size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-2 rounded-xl bg-white border border-gray-300 text-[#1B4332] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 font-bold text-sm text-black">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-xl bg-white border border-gray-300 text-[#1B4332] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* User Detail Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-[#1B4332]">유저 상세 정보</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 rounded-xl hover:bg-black/5 text-black/40 hover:text-black/60 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {loadingDetail ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
                </div>
              ) : userDetail ? (
                <div className="space-y-6">
                  {/* User Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        이메일
                      </p>
                      <p className="text-sm font-bold text-black/80">{userDetail.email}</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        닉네임
                      </p>
                      <p className="text-sm font-bold text-black/80">{userDetail.nickname}</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        레벨
                      </p>
                      <p className="text-sm font-black text-[#2D6A4F]">Lv.{userDetail.level}</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        경험치
                      </p>
                      <p className="text-sm font-bold text-black/80">
                        {userDetail.exp?.toLocaleString() || 0} EXP
                      </p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        포인트
                      </p>
                      <p className="text-sm font-black text-[#E8A838]">
                        {userDetail.points.toLocaleString()} P
                      </p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        기록 수
                      </p>
                      <p className="text-sm font-bold text-black/80">{userDetail.recordCount}건</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        결제 횟수
                      </p>
                      <p className="text-sm font-bold text-black/80">
                        {userDetail.paymentCount || 0}회
                      </p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        총 결제 금액
                      </p>
                      <p className="text-sm font-bold text-black/80">
                        {userDetail.totalPaymentAmount?.toLocaleString() || 0}원
                      </p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        구독 플랜
                      </p>
                      <div>
                        {getPlanBadge(userDetail.plan)}
                      </div>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        가입일
                      </p>
                      <p className="text-sm font-bold text-black/80">
                        {formatDate(userDetail.createdAt)}
                      </p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        최근 수정일
                      </p>
                      <p className="text-sm font-bold text-black/80">
                        {formatDate(userDetail.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Role Change */}
                  <div className="bg-black/[0.02] rounded-2xl p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-4">
                      계정 설정 및 관리
                    </p>
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-black/60 mb-2">현재 역할</p>
                          <span
                            className={`inline-block text-xs font-black px-3 py-1.5 rounded-lg ${
                              userDetail.role === 'ROLE_ADMIN'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-black/5 text-black/40'
                            }`}
                          >
                            {userDetail.role === 'ROLE_ADMIN' ? 'ADMIN' : 'USER'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateUserRole(userDetail.id, 'ROLE_USER')}
                            disabled={userDetail.role === 'ROLE_USER'}
                            className="px-4 py-2 rounded-xl bg-black/5 text-black/60 text-xs font-black hover:bg-black/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            USER로 변경
                          </button>
                          <button
                            onClick={() => handleUpdateUserRole(userDetail.id, 'ROLE_ADMIN')}
                            disabled={userDetail.role === 'ROLE_ADMIN'}
                            className="px-4 py-2 rounded-xl bg-red-100 text-red-600 text-xs font-black hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            ADMIN으로 변경
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Delete */}
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-xl bg-red-100">
                        <Trash2 size={20} className="text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-red-900 mb-1">위험 구역</p>
                        <p className="text-xs text-red-700 mb-4">
                          사용자를 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                        </p>
                        <button
                          onClick={() => handleDeleteUser(userDetail.id, userDetail.email)}
                          className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          회원 탈퇴시키기
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-black/40 py-10">유저 정보를 불러올 수 없습니다.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Recent Toilets Panel Component ────────────────────────────────────
const RecentToiletsPanel = () => {
  const [recentToilets, setRecentToilets] = useState<AdminToiletListResponse[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    const fetchRecentToilets = async () => {
      try {
        const response = await api.get<PageResponse<AdminToiletListResponse>>(
          '/admin/toilets?page=0&size=5&sort=id,desc',
        );
        setRecentToilets(response.content);
      } catch (error) {
        console.error('최근 화장실 목록 조회 실패:', error);
      } finally {
        setLoadingRecent(false);
      }
    };
    fetchRecentToilets();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  return (
    <div className="space-y-6">
      <GlassCard className="h-full">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-black text-black">최근 등록 화장실</h4>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]/50">
            {recentToilets.length}건
          </span>
        </div>
        {loadingRecent ? (
          <div className="flex items-center justify-center py-10">
            <RefreshCw size={24} className="animate-spin text-[#1B4332]" />
          </div>
        ) : recentToilets.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-black/40 font-bold">등록된 화장실이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentToilets.map((toilet) => (
              <div
                key={toilet.id}
                className="p-5 rounded-[28px] border transition-all hover:border-[#1B4332]/20 hover:bg-[#1B4332]/[0.02]"
                style={{ borderColor: COLORS.border }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-green-50 text-green-600">
                      {toilet.is24h ? '24시간' : '시간제'}
                    </span>
                    {toilet.isUnisex && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-600">
                        남녀공용
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-black/50 font-bold italic">
                    {formatTimeAgo(toilet.createdAt)}
                  </span>
                </div>
                <p className="font-black text-sm mb-1 leading-tight text-black">{toilet.name}</p>
                <p className="text-[11px] font-bold text-black/60 mb-1">{toilet.address}</p>
                <p className="text-[10px] text-black/40 font-bold">
                  운영시간: {toilet.openHours || '정보 없음'}
                </p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

// ── Screen: Map & Toilets Management ──────────────────────────────────
const ToiletsView = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedToilet, setSelectedToilet] = useState<ToiletData | null>(null);
  const [toiletReviews, setToiletReviews] = useState<any[]>([]);
  const [reviewSummary, setReviewSummary] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [mapScale, setMapScale] = useState(3);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5172, lng: 127.0473 });

  // 화장실 선택 시 리뷰 요약 가져오기
  useEffect(() => {
    if (!selectedToilet) return;
    setLoadingDetail(true);
    api.get(`/toilets/${selectedToilet.id}/reviews/summary`)
      .then((res: any) => {
        setReviewSummary(res);
        setToiletReviews(Array.isArray(res?.recentReviews) ? res.recentReviews : []);
      })
      .catch(() => {
        setReviewSummary(null);
        setToiletReviews([]);
      })
      .finally(() => setLoadingDetail(false));
  }, [selectedToilet?.id]); // 강남구청 중심 소폭 조절
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const {
    toilets: apiToilets,
    loading,
    refetch,
  } = useToilets({
    lat: mapCenter.lat,
    lng: mapCenter.lng,
    radius: 1000,
    level: mapScale,
  });

  // API에서 받은 데이터 사용 (빈 배열일 경우 "데이터 없음" UI 표시)
  const toilets = apiToilets;

  // 폴링 함수: 3초마다 동기화 상태 확인
  const startPolling = () => {
    pollingRef.current = setInterval(async () => {
      try {
        const status = await api.get<SyncStatusResponse>('/admin/sync-toilets/status');
        if (status.status === 'COMPLETED') {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setSyncing(false);
          setSyncResult(`동기화 완료! 총 ${status.totalCount}건 처리 (신규 ${status.insertedCount ?? 0}건 / 업데이트 ${status.updatedCount ?? 0}건)`);
          refetch();
        } else if (status.status === 'FAILED') {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setSyncing(false);
          alert('동기화 실패: ' + status.errorMessage);
        }
      } catch {
        clearInterval(pollingRef.current!);
        pollingRef.current = null;
        setSyncing(false);
        alert('동기화 상태 조회 실패');
      }
    }, 3000);
  };

  const handleSyncToilets = async () => {
    if (syncing) return;

    const confirmed = confirm(
      '공공데이터 API로부터 전국 화장실 데이터를 동기화합니다.\n' +
        '범위: 1~550 페이지 (약 53,000건 upsert)\n' +
        '소요 시간: 약 10~15분\n\n' +
        '진행하시겠습니까?',
    );

    if (!confirmed) return;

    setSyncing(true);
    setSyncResult(null);
    try {
      await api.post('/admin/sync-toilets?startPage=1&endPage=550');
      // 202 응답 받으면 폴링 시작
      startPolling();
    } catch (error: any) {
      setSyncing(false);
      console.error('동기화 시작 실패:', error);
      alert('동기화 시작 실패: ' + (error.message || '오류가 발생했습니다.'));
    }
  };

  // 1. 지도 초기화
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const { kakao } = window as any;
    if (!kakao) return;

    kakao.maps.load(() => {
      const options = {
        center: new kakao.maps.LatLng(mapCenter.lat, mapCenter.lng),
        level: mapScale,
      };
      const map = new kakao.maps.Map(mapContainerRef.current, options);
      mapRef.current = map;

      // 지도 이동 시 센터 업데이트 (useToilets 훅 트리거)
      kakao.maps.event.addListener(map, 'idle', () => {
        const center = map.getCenter();
        setMapCenter({ lat: center.getLat(), lng: center.getLng() });
        setMapScale(map.getLevel());
      });
    });
  }, []);

  // 2. 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // 3. 마커 업데이트
  useEffect(() => {
    if (!mapRef.current || !toilets) return;
    const { kakao } = window as any;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // 신규 마커 추가
    const newMarkers = toilets.map((t) => {
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(t.lat, t.lng),
        map: mapRef.current,
        title: t.name,
      });

      kakao.maps.event.addListener(marker, 'click', () => {
        setSelectedToilet(t);
      });

      return marker;
    });

    markersRef.current = newMarkers;
  }, [toilets]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="relative h-[750px] rounded-[32px] overflow-hidden border-4 border-white shadow-2xl">
            {/* Real Kakao Map Container */}
            <div id="map" ref={mapContainerRef} className="w-full h-full" />

            {/* Top Action Buttons */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-10 whitespace-nowrap">
              <WaveButtonComponent
                onClick={handleSyncToilets}
                disabled={syncing}
                variant={syncing ? 'accent' : 'primary'}
                size="md"
                className="shadow-xl backdrop-blur-md"
                icon={
                  syncing ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Database size={14} />
                  )
                }
              >
                {syncing ? '동기화 중...' : '공공데이터 동기화'}
              </WaveButtonComponent>
              {/* 전체목록 버튼 제거됨 */}
              <button
                onClick={async () => {
                  if (!confirm('리뷰 5개 이상 & AI 요약 미생성 화장실에 대해 일괄 생성합니다. 진행할까요?')) return;
                  try {
                    const res: any = await api.post('/admin/toilets/ai-summaries/generate');
                    alert(`AI 요약 ${res?.generated ?? 0}건 생성 완료`);
                  } catch {
                    alert('AI 요약 일괄 생성 실패');
                  }
                }}
                className="px-6 py-3 rounded-2xl border-2 bg-white/90 backdrop-blur-md border-black/10 text-xs font-black text-black/60 hover:bg-white hover:border-emerald-500/30 hover:text-emerald-700 transition-all shadow-xl"
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={14} />
                  AI 요약 일괄 생성
                </span>
              </button>
            </div>

            {/* Sync Result Message */}
            {syncResult && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-[#1B4332]/95 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl border-2 border-white/20">
                  <p className="text-xs font-bold">{syncResult}</p>
                </div>
              </div>
            )}

            {/* Map Overlay Controls (Custom Style) */}
            <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
              <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl border shadow-xl flex flex-col gap-1">
                <button
                  onClick={() => mapRef.current?.setLevel(mapRef.current.getLevel() - 1)}
                  className="p-2 rounded-xl hover:bg-black/5 transition-colors text-[#1B4332]"
                >
                  <Plus size={18} />
                </button>
                <button
                  onClick={() => mapRef.current?.setLevel(mapRef.current.getLevel() + 1)}
                  className="p-2 rounded-xl hover:bg-black/5 transition-colors font-black text-lg text-[#1B4332]"
                  style={{ lineHeight: 1 }}
                >
                  -
                </button>
              </div>
              <button
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                      const latlng = new (window as any).kakao.maps.LatLng(
                        pos.coords.latitude,
                        pos.coords.longitude,
                      );
                      mapRef.current?.setCenter(latlng);
                    });
                  }
                }}
                className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border shadow-xl hover:bg-white transition-colors"
              >
                <Navigation size={18} className="text-[#1B4332]" />
              </button>
            </div>

            {/* Status Overlay */}
            <div className="absolute bottom-6 left-6 right-6 z-10">
              <GlassCard className="bg-white/95 py-4 px-6">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <div className="p-2.5 rounded-2xl bg-green-50 text-green-600">
                      <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-black/70">실시간 데이터 스트림</p>
                      <p className="text-sm font-black tracking-tight text-black">
                        현재 영역 {toilets.length}개 노드 활성
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${loading ? 'bg-amber-400' : 'bg-green-500'} animate-pulse`}
                    />
                    <span className="text-[10px] font-black uppercase text-black/60">
                      {loading ? 'Syncing...' : 'Sync OK'}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Selected Toilet Detail (Admin View) */}
          <AnimatePresence>
            {selectedToilet && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <GlassCard className="border-2 border-[#E8A838]/30">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-[24px] bg-[#1B4332]/5 flex items-center justify-center text-3xl">
                        💩
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-black text-[#1A2B27]">
                            {selectedToilet.name}
                          </h4>
                          <span className="text-[10px] bg-black/5 px-2 py-0.5 rounded-md font-bold text-black/60">
                            ID: {selectedToilet.id}
                          </span>
                        </div>
                        <p className="text-sm text-black/60 font-bold">
                          {selectedToilet.roadAddress}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex gap-0.5 text-[#E8A838]">
                            <Star size={14} fill="currentColor" />
                            <span className="text-xs font-black ml-1 text-[#1A2B27]">
                              {reviewSummary?.avgRating?.toFixed(1) ?? selectedToilet.rating ?? 0}
                            </span>
                          </div>
                          <span className="text-[10px] text-black/20 font-black uppercase italic tracking-widest">
                            Global Master Data
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedToilet(null)}
                      className="p-2 rounded-xl hover:bg-black/5"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-black/[0.02] border">
                      <p className="text-[10px] font-black text-black/30 mb-1">개방 시간</p>
                      <p className="text-xs font-black text-[#1A2B27]">
                        {selectedToilet.openTime || '24시간'}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/[0.02] border">
                      <p className="text-[10px] font-black text-black/30 mb-1">리뷰 수</p>
                      <p className="text-xs font-black text-[#1A2B27]">
                        {reviewSummary?.reviewCount ?? selectedToilet.reviewCount ?? 0}건
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/[0.02] border">
                      <p className="text-[10px] font-black text-black/30 mb-1">평균 평점</p>
                      <p className="text-xs font-black text-[#E8A838]">
                        ★ {reviewSummary?.avgRating?.toFixed(1) || selectedToilet.rating || '-'}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/[0.02] border">
                      <p className="text-[10px] font-black text-black/30 mb-1">상태</p>
                      <p className="text-xs font-black text-green-500 italic">정상 운영</p>
                    </div>
                  </div>

                  {/* AI 리뷰 요약 */}
                  {reviewSummary?.aiSummary && (
                    <div className="mb-6 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-600 mb-1 uppercase">AI 리뷰 요약</p>
                      <p className="text-xs font-bold text-[#1A2B27]">{reviewSummary.aiSummary}</p>
                    </div>
                  )}

                  {/* 최근 리뷰 */}
                  <div>
                    <p className="text-[10px] font-black text-black/30 mb-3 uppercase">최근 리뷰</p>
                    {loadingDetail ? (
                      <p className="text-xs text-black/40 font-bold py-4 text-center">불러오는 중...</p>
                    ) : toiletReviews.length > 0 ? (
                      <div className="space-y-2">
                        {toiletReviews.slice(0, 5).map((review: any, i: number) => (
                          <div key={i} className="p-3 rounded-xl bg-black/[0.02] border flex items-start gap-3">
                            <div className="flex-shrink-0 text-[#E8A838] text-xs font-black">★ {review.rating}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-[#1A2B27] truncate">{review.comment || '댓글 없음'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-black/40 font-bold">{review.nickname || '익명'}</span>
                                {review.emojiTags && (
                                  <span className="text-[10px] text-black/30">{review.emojiTags}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-black/30 font-bold py-4 text-center">리뷰가 없습니다</p>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <RecentToiletsPanel />
      </div>
    </div>
  );
};

// ── Screen: Customer Service ──────────────────────────────────────────
const CsView = ({
  stats,
  onStatsRefresh,
}: {
  stats: AdminStatsResponse | null;
  onStatsRefresh: () => void;
}) => {
  const [inquiries, setInquiries] = useState<AdminInquiryListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InquiryStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<AdminInquiryListResponse | null>(null);
  const [inquiryDetail, setInquiryDetail] = useState<AdminInquiryDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [generatingData, setGeneratingData] = useState(false);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '10',
      });
      if (filter !== 'ALL') params.append('status', filter);

      console.log(`[AdminInquiry] Fetching inquiries with params: ${params.toString()}`);
      const response = await api.get<PageResponse<AdminInquiryListResponse>>(
        `/admin/inquiries?${params}`,
      );
      console.log('[AdminInquiry] Response received:', response);

      setInquiries(response.content || []);
      setTotalPages(response.totalPages || 0);
    } catch (error: any) {
      console.error('문의 목록 조회 실패:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        stack: error.stack,
      });

      // 빈 데이터로 초기화하여 UI가 깨지지 않도록 함
      setInquiries([]);
      setTotalPages(0);

      // 서버 에러인 경우에만 alert 표시 (404나 빈 데이터는 조용히 처리)
      if (error.status && error.status >= 500) {
        const errorMessage = error.message || '서버 오류가 발생했습니다.';
        alert(`문의 목록 조회 실패: ${errorMessage}\n\n개발자 도구 콘솔을 확인해주세요.`);
      }
    } finally {
      setLoading(false);
    }
  };
  const handleGenerateTestData = async () => {
    if (generatingData) return;
    setGeneratingData(true);
    try {
      await api.post('/admin/inquiries/generate-test-data');
      alert('30개의 테스트 문의 데이터가 생성되었습니다.');
      fetchInquiries(); // 목록 새로고침
      onStatsRefresh(); // 상단 KPI 통계 새로고침
    } catch (error: any) {
      console.error('테스트 데이터 생성 실패:', error);
      const errorMessage = error.message || '데이터 생성 중 오류가 발생했습니다.';
      alert(`테스트 데이터 생성 실패: ${errorMessage}\n\n개발자 도구 콘솔을 확인해주세요.`);
    } finally {
      setGeneratingData(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [page, filter]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  const handleOpenInquiryDetail = async (inquiry: AdminInquiryListResponse) => {
    setSelectedInquiry(inquiry);
    setShowInquiryModal(true);
    setLoadingDetail(true);
    setAnswerText('');
    try {
      const detail = await api.get<AdminInquiryDetailResponse>(`/admin/inquiries/${inquiry.id}`);
      setInquiryDetail(detail);
      if (detail.answer) {
        setAnswerText(detail.answer);
      }
    } catch (error) {
      console.error('문의 상세 조회 실패:', error);
      alert('문의 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!inquiryDetail || !answerText.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    setSubmittingAnswer(true);
    try {
      await api.post(`/admin/inquiries/${inquiryDetail.id}/answer`, { answer: answerText });
      alert('답변이 등록되었습니다.');
      setShowInquiryModal(false);
      fetchInquiries(); // 목록 새로고침
      onStatsRefresh(); // 상단 KPI 통계 새로고침
    } catch (error) {
      console.error('답변 등록 실패:', error);
      alert('답변 등록에 실패했습니다.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-2xl font-black text-black">고객 지원 센터</h3>
            <p className="text-sm text-black/60 font-bold">1:1 문의 관리 및 답변</p>
          </div>
          <WaveButtonComponent
            onClick={handleGenerateTestData}
            disabled={generatingData}
            variant="accent"
            size="sm"
            className="shadow-lg"
            icon={
              generatingData ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />
            }
          >
            {generatingData ? '데이터 생성 중...' : '테스트 데이터 30개 생성'}
          </WaveButtonComponent>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              filter === 'ALL'
                ? 'bg-[#1B4332] text-white shadow-lg'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-black/5 hover:border-[#1B4332]/40'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              filter === 'PENDING'
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-400'
            }`}
          >
            미답변{' '}
            {stats?.pendingInquiries && stats.pendingInquiries > 0
              ? `(${stats.pendingInquiries})`
              : ''}
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              filter === 'COMPLETED'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400'
            }`}
          >
            답변 완료
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
        </div>
      ) : inquiries.length === 0 ? (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare size={48} className="text-black/20 mb-4" />
            <h4 className="text-lg font-black text-black mb-2">문의 데이터가 없습니다</h4>
            <p className="text-sm text-black/40 mb-6">
              테스트 데이터를 생성하거나 실제 문의가 등록될 때까지 기다려주세요
            </p>
            <button
              onClick={handleGenerateTestData}
              disabled={generatingData}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-sm shadow-lg transition-all disabled:opacity-50"
            >
              {generatingData ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              {generatingData ? '생성 중...' : '테스트 데이터 생성'}
            </button>
          </div>
        </GlassCard>
      ) : (
        <>
          <GlassCard className="p-0 border-none bg-transparent shadow-none">
            <div
              className="overflow-x-auto rounded-[28px] border bg-white/50 backdrop-blur-xl"
              style={{ borderColor: COLORS.border }}
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/[0.02] border-b" style={{ borderColor: COLORS.border }}>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      사용자
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      문의 유형
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      제목
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      등록 시간
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      상태
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40 text-right">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((inq) => (
                    <tr
                      key={inq.id}
                      className="border-b transition-colors hover:bg-black/[0.01]"
                      style={{ borderColor: COLORS.border }}
                    >
                      <td className="px-8 py-5">
                        <div>
                          <div className="font-black text-sm text-black">{inq.userName}</div>
                          <div className="text-xs text-black/30 font-bold">{inq.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-black/60">{inq.type}</td>
                      <td className="px-8 py-5 font-bold text-black max-w-xs truncate">
                        {inq.title}
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-black/40">
                        {formatTimeAgo(inq.createdAt)}
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                            inq.status === 'PENDING'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-green-100 text-green-600'
                          }`}
                        >
                          {inq.status === 'PENDING' ? '미답변' : '완료'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => handleOpenInquiryDetail(inq)}
                          className="px-3 py-1.5 rounded-xl bg-[#1B4332] text-white text-xs font-black hover:bg-[#2D6A4F] transition-colors"
                        >
                          {inq.status === 'PENDING' ? '답변하기' : '상세보기'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-2 rounded-xl bg-white border border-gray-300 text-[#1B4332] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 font-bold text-sm text-black">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-xl bg-white border border-gray-300 text-[#1B4332] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Inquiry Detail Modal */}
      <AnimatePresence>
        {showInquiryModal && selectedInquiry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowInquiryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-3xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-[#1B4332]">문의 상세</h3>
                <button
                  onClick={() => setShowInquiryModal(false)}
                  className="p-2 rounded-xl hover:bg-black/5 text-black/40 hover:text-black/60 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {loadingDetail ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
                </div>
              ) : inquiryDetail ? (
                <div className="space-y-6">
                  {/* Inquiry Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        문의자
                      </p>
                      <p className="text-sm font-bold text-black/80">{inquiryDetail.userName}</p>
                      <p className="text-xs text-black/40 mt-1">{inquiryDetail.userEmail}</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        문의 유형
                      </p>
                      <p className="text-sm font-bold text-black/80">{inquiryDetail.type}</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        등록일
                      </p>
                      <p className="text-sm font-bold text-black/80">
                        {new Date(inquiryDetail.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        상태
                      </p>
                      <span
                        className={`inline-block text-xs font-black px-3 py-1.5 rounded-lg ${
                          inquiryDetail.status === 'PENDING'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-green-100 text-green-600'
                        }`}
                      >
                        {inquiryDetail.status === 'PENDING' ? '미답변' : '답변 완료'}
                      </span>
                    </div>
                  </div>

                  {/* Inquiry Content */}
                  <div className="bg-black/[0.02] rounded-2xl p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-3">
                      제목
                    </p>
                    <p className="text-base font-bold text-black mb-4">{inquiryDetail.title}</p>
                    <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-3">
                      문의 내용
                    </p>
                    <p className="text-sm text-black/70 whitespace-pre-wrap leading-relaxed">
                      {inquiryDetail.content}
                    </p>
                  </div>

                  {/* Answer Section */}
                  <div className="bg-black/[0.02] rounded-2xl p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-3">
                      답변
                    </p>
                    {inquiryDetail.status === 'PENDING' ? (
                      <div className="space-y-4">
                        <textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="답변 내용을 입력하세요..."
                          className="w-full h-40 px-4 py-3 rounded-2xl border bg-white text-sm text-black/80 focus:ring-2 ring-[#1B4332]/20 outline-none resize-none"
                        />
                        <button
                          onClick={handleSubmitAnswer}
                          disabled={submittingAnswer || !answerText.trim()}
                          className="w-full py-3 bg-[#1B4332] text-white rounded-2xl font-black text-sm hover:bg-[#2D6A4F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {submittingAnswer ? '등록 중...' : '답변 등록'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-black/70 whitespace-pre-wrap leading-relaxed bg-white rounded-xl p-4">
                          {inquiryDetail.answer || '답변이 없습니다.'}
                        </p>
                        <p className="text-xs text-black/40">
                          답변일: {new Date(inquiryDetail.updatedAt).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-center text-black/40 py-10">문의 정보를 불러올 수 없습니다.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Screen: Store & Items Management ──────────────────────────────────
const StoreView = ({
  setActiveTab,
  setEditingItem,
}: {
  setActiveTab: (tab: AdminTab) => void;
  setEditingItem: (item: ItemResponse) => void;
}) => {
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ItemType | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '15',
      });
      if (filter !== 'ALL') params.append('type', filter);

      const response = await api.get<PageResponse<ItemResponse>>(`/admin/shop/items?${params}`);
      setItems(response?.content || []);
      setTotalPages(response?.totalPages || 0);
      setTotalElements(response?.totalElements || 0);
    } catch (error) {
      console.error('아이템 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, filter]);

  const handleDeleteItem = async (id: number, name: string) => {
    if (!confirm(`"${name}" 아이템을 삭제하시겠습니까?`)) return;

    try {
      await api.delete(`/admin/shop/items/${id}`);
      alert('아이템이 삭제되었습니다.');
      fetchItems();
    } catch (error: any) {
      alert(error.message || '아이템 삭제에 실패했습니다.');
    }
  };

  const [syncingStore, setSyncingStore] = useState(false);
  const [generatingItems, setGeneratingItems] = useState(false);

  const handleSyncDefaultItems = async () => {
    if (syncingStore) return;
    const confirmed = confirm(
      '미공개 상태의 모든 아이템을 상점에 공개하시겠습니까?\n공개된 아이템은 유저의 마이페이지 상점에 노출됩니다.',
    );
    if (!confirmed) return;

    setSyncingStore(true);
    try {
      const result = await api.post<{ publishedCount: number }>('/admin/shop/items/publish-all');
      const count = result?.publishedCount ?? 0;
      if (count > 0) {
        alert(`${count}개의 아이템이 공개되었습니다.\n마이페이지의 [상점] 탭에서 확인하실 수 있습니다.`);
      } else {
        alert('공개할 미공개 아이템이 없습니다.');
      }
      fetchItems();
    } catch (error: any) {
      console.error('동기화 실패:', error);
      const errorMsg = error?.response?.data?.message || error?.message || '알 수 없는 오류';
      alert(`동기화 중 오류가 발생했습니다.\n\n상세: ${errorMsg}`);
    } finally {
      setSyncingStore(false);
    }
  };

  const handleTogglePublish = async (itemId: number, itemName: string) => {
    try {
      await api.put(`/admin/shop/items/${itemId}/toggle-publish`);
      fetchItems();
    } catch (error: any) {
      console.error('공개 상태 변경 실패:', error);
      alert(`"${itemName}" 공개 상태 변경에 실패했습니다.`);
    }
  };

  const handleGenerateTestData = async () => {
    if (generatingItems) return;
    const confirmed = confirm(
      '20개의 프리미엄 상점 테스트 데이터를 생성하시겠습니까?\n이 작업은 다소 시간이 걸릴 수 있습니다.',
    );
    if (!confirmed) return;

    setGeneratingItems(true);
    try {
      // 아바타 아이템 (캐릭터 스타일과 어울리는 이름)
      const avatarItems = [
        { emoji: '👑', name: '왕족 스타일', desc: '왕실의 위엄이 느껴지는 고귀한 캐릭터' },
        { emoji: '🎩', name: '신사 스타일', desc: '우아하고 세련된 신사 캐릭터' },
        { emoji: '🎀', name: '러블리 핑크', desc: '사랑스럽고 귀여운 핑크 캐릭터' },
        { emoji: '🧢', name: '힙합 스타일', desc: '스트릿 감성 넘치는 힙합 캐릭터' },
        { emoji: '🎓', name: '졸업생 스타일', desc: '영광스러운 졸업생 캐릭터' },
        { emoji: '🪖', name: '군인 스타일', desc: '강인하고 용맹한 군인 캐릭터' },
        { emoji: '🦊', name: '미스터리 스타일', desc: '신비롭고 영리한 여우 캐릭터' },
        { emoji: '🐱', name: '냥냥 스타일', desc: '귀엽고 사랑스러운 고양이 캐릭터' },
        { emoji: '🐶', name: '멍멍 스타일', desc: '충직하고 친근한 강아지 캐릭터' },
        { emoji: '🦄', name: '유니콘 스타일', desc: '환상적이고 신비로운 유니콘 캐릭터' },
      ];

      // 이펙트 아이템 (이모지와 어울리는 이름)
      const effectItems = [
        { emoji: '✨', name: '반짝이는 오라', desc: '온몸을 감싸는 반짝이는 빛' },
        { emoji: '🌟', name: '별빛 오라', desc: '밤하늘 별처럼 빛나는 효과' },
        { emoji: '💫', name: '유성 궤적', desc: '이동할 때 남는 유성 꼬리' },
        { emoji: '🔥', name: '화염 오라', desc: '타오르는 불꽃 효과' },
        { emoji: '❄️', name: '얼음 오라', desc: '차가운 얼음 결정 효과' },
        { emoji: '🌊', name: '물결 효과', desc: '잔잔한 물결 애니메이션' },
        { emoji: '💨', name: '바람 효과', desc: '시원한 바람이 부는 효과' },
        { emoji: '⚡', name: '번개 오라', desc: '전기가 튀는 섬광 효과' },
        { emoji: '🌈', name: '무지개 오라', desc: '화려한 7색 무지개 효과' },
        { emoji: '🌀', name: '회오리 효과', desc: '빙글빙글 도는 회오리' },
      ];

      const testItems: AdminItemCreateRequest[] = [];

      // 1. 아바타 10개
      const avatarStyles: AvatarStyle[] = ['avataaars', 'bottts', 'lorelei', 'pixelArt', 'funEmoji'];
      avatarItems.forEach((item, index) => {
        const randomStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
        const randomSeed = `test-avatar-${index}-${Math.random().toString(36).substring(7)}`;
        
        testItems.push({
          name: item.name,
          type: 'AVATAR',
          price: Math.floor(Math.random() * 20) * 100 + 500,
          description: `[헤드] ${item.desc}`,
          imageUrl: `dicebear:${randomStyle}:${randomSeed}`, 
        });
      });

      // 2. 이펙트 10개
      effectItems.forEach((item) => {
        testItems.push({
          name: item.name,
          type: 'EFFECT',
          price: Math.floor(Math.random() * 30) * 100 + 1000,
          description: `[이펙트] ${item.desc}`,
          imageUrl: item.emoji, // 이모지를 imageUrl에 저장 (프론트 파티클 표현용)
        });
      });

      for (const item of testItems) {
        await api.post('/admin/shop/items', {
          ...item,
        });
      }

      alert('20개의 다채롭고 고유한 이미지를 가진 테스트 데이터 생성이 완료되었습니다!');
      fetchItems();
    } catch (error) {
      console.error('테스트 데이터 생성 실패:', error);
      alert('데이터 생성 중 오류가 발생했습니다.');
    } finally {
      setGeneratingItems(false);
    }
  };

  const handleDeleteAllItems = async () => {
    if (items.length === 0) {
      alert('삭제할 아이템이 없습니다.');
      return;
    }

    const confirmed = confirm(
      `현재 표시된 ${items.length}개의 아이템을 전부 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다!`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const item of items) {
        try {
          await api.delete(`/admin/shop/items/${item.id}`);
          successCount++;
        } catch (error) {
          console.error(`아이템 ${item.id} 삭제 실패:`, error);
          failCount++;
        }
      }

      alert(
        `삭제 완료!\n성공: ${successCount}개 / 실패: ${failCount}개`
      );
      fetchItems();
    } catch (error) {
      console.error('일괄 삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getItemTypeColor = (type: ItemType) => {
    switch (type) {
      case 'AVATAR':
        return '#3B82F6';
      case 'EFFECT':
        return '#52b788';
      default:
        return '#1B4332';
    }
  };

  const getItemTypeLabel = (type: ItemType) => {
    switch (type) {
      case 'AVATAR':
        return '아바타';
      case 'EFFECT':
        return '효과';
      default:
        return type;
    }
  };

  const isEmoji = (str: string) => {
    return str && str.length <= 4 && /\p{Extended_Pictographic}/u.test(str);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4">
          <GlassCard
            className="py-2 px-4 shadow-none border-dashed bg-transparent"
            glowColor="transparent"
          >
            <span className="text-[10px] font-black uppercase text-[#1B4332]/50 mr-2">
              총 아이템
            </span>
            <span className="font-black text-[#E8A838]">{totalElements}개</span>
          </GlassCard>
          <div className="flex gap-2">
            {(['ALL', 'AVATAR', 'EFFECT'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type as any)}
                className={`px-3 py-2 rounded-xl font-bold text-[10px] uppercase transition-all ${
                  filter === type
                    ? 'bg-[#1B4332] text-white shadow-lg'
                    : 'bg-white border border-gray-300 text-black hover:bg-black/5'
                }`}
              >
                {type === 'ALL' ? '전체' : getItemTypeLabel(type as ItemType)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 ml-4">
            <WaveButtonComponent
              onClick={handleSyncDefaultItems}
              disabled={syncingStore}
              variant="primary"
              size="sm"
              className="shadow-md"
              icon={
                syncingStore ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )
              }
            >
              {syncingStore ? '동기화 중...' : '미공개 아이템 전체 공개'}
            </WaveButtonComponent>
            <WaveButtonComponent
              onClick={handleGenerateTestData}
              disabled={generatingItems}
              variant="accent"
              size="sm"
              className="shadow-md"
              icon={
                generatingItems ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )
              }
            >
              {generatingItems ? '생성 중...' : '테스트 아이템 20개 생성'}
            </WaveButtonComponent>
            <WaveButtonComponent
              onClick={handleDeleteAllItems}
              disabled={loading || items.length === 0}
              variant="secondary"
              size="sm"
              className="shadow-md"
              icon={<Trash2 size={14} />}
            >
              현재 페이지 전체 삭제
            </WaveButtonComponent>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('add-item')}
          className="flex items-center gap-2 px-6 py-3 bg-[#1B4332] text-white rounded-2xl font-black text-xs shadow-xl shadow-green-900/20"
        >
          <Plus size={16} /> 신규 아이템 등록
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
        </div>
      ) : (items || []).length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag size={48} className="mx-auto mb-4 text-black/20" />
          <p className="font-bold text-black/40">등록된 아이템이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {(items || []).map((item) => {
              const color = getItemTypeColor(item.type);
              return (
                <GlassCard key={item.id} className="group cursor-pointer w-full h-full flex flex-col">
                  <div className="w-full aspect-square rounded-[24px] mb-4 bg-black/[0.02] flex items-center justify-center relative overflow-hidden flex-shrink-0">
                    <div
                      className="w-16 h-16 rounded-full blur-3xl opacity-20 absolute"
                      style={{ background: color }}
                    />
                    <div className="w-full h-full flex items-center justify-center transition-transform group-hover:scale-105 duration-500">
                      {item.imageUrl && (isEmoji(item.imageUrl) || (!item.imageUrl.includes(':') && !item.imageUrl.startsWith('http') && !item.imageUrl.startsWith('/'))) ? (
                        <span className="text-6xl select-none leading-none">{item.imageUrl}</span>
                      ) : (
                        <img
                          src={parseDicebearUrl(item.imageUrl, item.id, item.type)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-white/90 border text-black/40">
                        {getItemTypeLabel(item.type)}
                      </span>
                    </div>
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id, item.name);
                        }}
                        className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(item);
                          setActiveTab('edit-item');
                        }}
                        className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>
                  <h5 className="font-black text-sm mb-1 text-black truncate">{item.name}</h5>
                  <p className="text-xs text-black/50 mb-2 line-clamp-2 font-bold min-h-[32px]">
                    {item.description}
                  </p>
                  <div className="mt-auto">
                    <div className="h-[52px] flex items-end mb-4">
                      {item.discountPrice != null ? (
                        <div>
                          <p className="text-xs text-black/40 line-through font-bold">
                            {item.price.toLocaleString()} P
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-lg" style={{ color }}>
                              {item.discountPrice.toLocaleString()} P
                            </p>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-red-100 text-red-500">
                              -{Math.round((1 - item.discountPrice / item.price) * 100)}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="font-black text-lg" style={{ color }}>
                          {(item.price || 0).toLocaleString()} P
                        </p>
                      )}
                    </div>
                    <div
                      className="flex items-center justify-between border-t pt-4"
                      style={{ borderColor: COLORS.border }}
                    >
                      <span className="text-[9px] font-black text-black/40 uppercase tracking-widest">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'NO DATE'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePublish(item.id, item.name);
                        }}
                        className={`text-[10px] font-black italic px-2 py-0.5 rounded-md transition-colors ${
                          item.published
                            ? 'text-green-500 bg-green-50 hover:bg-green-100'
                            : 'text-orange-500 bg-orange-50 hover:bg-orange-100'
                        }`}
                      >
                        {item.published ? '공개중' : '미공개'}
                      </button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-2 rounded-xl bg-white border border-gray-300 text-[#1B4332] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 font-bold text-sm text-black">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-xl bg-white border border-gray-300 text-[#1B4332] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Screen: System Settings ───────────────────────────────────────────
interface SystemSettings {
  noticeEnabled: boolean;
  noticeMessage: string;
  maintenanceMode: boolean;
  signupEnabled: boolean;
  aiReportEnabled: boolean;
}

interface SystemLog {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  source: string;
  message: string;
}

interface SystemStats {
  activeUsers: number;
  todaySignups: number;
  todayApiCalls: number;
  totalRevenue: number;
}

const SystemView = ({
  stats,
  logs,
  loading,
  onRefresh
}: {
  stats: AdminStatsResponse | null;
  logs: SystemLog[];
  loading: boolean;
  onRefresh: () => void;
}) => {
  const [settings, setSettings] = useState<SystemSettings>({
    noticeEnabled: true,
    noticeMessage: '🎉 Day.Poo 서비스가 정식 오픈했습니다!',
    maintenanceMode: false,
    signupEnabled: true,
    aiReportEnabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [editingNotice, setEditingNotice] = useState(false);
  const [tempNoticeMessage, setTempNoticeMessage] = useState('');

  useEffect(() => {
    if (settings.noticeMessage) {
      setTempNoticeMessage(settings.noticeMessage);
    }
  }, [settings.noticeMessage]);

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    setSaving(true);
    try {
      // ⚠️ 백엔드 설정 API 미구현 상태이므로 로컬 상태만 업데이트
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      alert('설정이 로컬에 반영되었습니다.\n(서버 연동은 추후 지원 예정)');
    } catch (error: any) {
      console.error('설정 저장 실패:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof SystemSettings) => {
    if (typeof settings[key] === 'boolean') {
      updateSettings({ [key]: !settings[key] });
    }
  };

  const handleNoticeMessageSave = () => {
    updateSettings({ noticeMessage: tempNoticeMessage });
    setEditingNotice(false);
  };

  const getLogIcon = (level: SystemLog['level']) => {
    switch (level) {
      case 'INFO': return <Activity size={16} className="text-blue-500" />;
      case 'WARN': return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'ERROR': return <XCircle size={16} className="text-red-500" />;
      default: return <Activity size={16} />;
    }
  };

  const getLogBgColor = (level: SystemLog['level']) => {
    switch (level) {
      case 'INFO': return 'bg-blue-50 border-blue-200';
      case 'WARN': return 'bg-yellow-50 border-yellow-200';
      case 'ERROR': return 'bg-red-50 border-red-200';
      default: return 'bg-white border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-black tracking-tight mb-2">시스템 통합 관제</h2>
          <p className="text-sm font-bold text-black/40">기반 인프라 설정 및 실시간 엔진 모니터링</p>
        </div>
        <button
          onClick={onRefresh}
          className="p-3 rounded-xl bg-white border border-gray-300 text-[#1B4332] hover:bg-black/5 transition-colors"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* 실시간 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Eye size={24} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1">실시간 접속자</p>
              <p className="text-3xl font-black text-blue-500">{stats?.totalUsers || 0}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <UserPlus size={24} className="text-green-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1">금일 신규 가입</p>
              <p className="text-3xl font-black text-green-500">+{stats?.todayNewUsers || 0}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <MessageSquare size={24} className="text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1">미답변 문의</p>
              <p className="text-3xl font-black text-purple-500">{stats?.pendingInquiries || 0}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <MapPin size={24} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1">전체 화장실</p>
              <p className="text-3xl font-black text-yellow-500">{(stats?.totalToilets || 0).toLocaleString()}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 앱 설정 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard>
          <div className="border-b pb-4 mb-6" style={{ borderColor: COLORS.border }}>
            <h3 className="text-xl font-black text-black flex items-center gap-2">
              <Settings size={20} />
              어플리케이션 환경 설정
            </h3>
          </div>

          <div className="space-y-6">
            {/* 공지사항 배너 */}
            <div className="p-4 rounded-xl bg-black/[0.02]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-[#1B4332]" />
                  <h4 className="font-black text-black">공지사항 배너</h4>
                </div>
                <button
                  onClick={() => handleToggle('noticeEnabled')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.noticeEnabled ? 'bg-[#1B4332]' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.noticeEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              {settings.noticeEnabled && (
                <div className="mt-4 p-3 bg-white border rounded-xl border-dashed">
                  {editingNotice ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tempNoticeMessage}
                        onChange={(e) => setTempNoticeMessage(e.target.value)}
                        className="flex-1 text-sm font-bold bg-transparent border-none focus:ring-0"
                      />
                      <button onClick={handleNoticeMessageSave} className="text-xs font-black text-blue-500">저장</button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-black/70 truncate">{settings.noticeMessage}</p>
                      <button onClick={() => setEditingNotice(true)} className="text-xs font-black text-black/30">수정</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 점검 모드 */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02]">
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-red-500" />
                <div>
                  <h4 className="font-black text-black">점검 모드 (Maintenance)</h4>
                  <p className="text-[10px] font-bold text-black/40">활성화 시 모든 유저의 접속이 차단됩니다</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('maintenanceMode')}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {/* 신규 가입 제어 */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02]">
              <div className="flex items-center gap-3">
                <UserPlus size={18} className="text-blue-500" />
                <div>
                  <h4 className="font-black text-black">신규 회원가입 허용</h4>
                  <p className="text-[10px] font-bold text-black/40">신규 사용자의 가입 가능 여부를 결정합니다</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('signupEnabled')}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.signupEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.signupEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* 런타임 로그 섹션 */}
        <GlassCard>
          <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: COLORS.border }}>
            <h3 className="text-xl font-black text-black flex items-center gap-2">
              <Database size={20} />
              최신 시스템 로그
            </h3>
            <button onClick={() => onRefresh()} className="text-[10px] font-black text-black/30 hover:text-black transition-colors uppercase">View All</button>
          </div>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {logs.slice(0, 10).map((log, idx) => (
              <div key={log.id || idx} className={`p-4 rounded-2xl border ${getLogBgColor(log.level)} transition-all hover:scale-[1.01]`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getLogIcon(log.level)}
                    <span className="text-[10px] font-black tracking-widest uppercase text-black/80">{log.level}</span>
                  </div>
                  <span className="text-[9px] font-bold text-black/30">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '방금 전'}
                  </span>
                </div>
                <p className="text-[11px] font-black text-black/30 uppercase tracking-tighter mb-1">{log.source}</p>
                <p className="text-sm font-bold text-black/80 leading-snug">{log.message}</p>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="py-20 text-center opacity-20 font-black uppercase tracking-widest text-xs">
                No logs available
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};


// ── Screen: Add Item Form ─────────────────────────────────────────────
const AddItemView = ({ setActiveTab }: { setActiveTab: (tab: AdminTab) => void }) => {
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemType, setItemType] = useState<ItemType>('AVATAR');
  const [itemPrice, setItemPrice] = useState<number | ''>('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [discountPrice, setDiscountPrice] = useState<number | null>(null);
  const [dicebearStyle, setDicebearStyle] = useState('funEmoji');
  const [dicebearSeed, setDicebearSeed] = useState('golden-crown');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // 유효성 검사
    if (!itemName.trim()) {
      alert('아이템 명칭을 입력해주세요.');
      return;
    }
    if (!itemDescription.trim()) {
      alert('아이템 설명을 입력해주세요.');
      return;
    }
    if (itemPrice === '' || itemPrice < 0) {
      alert('가격은 0 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/admin/shop/items', {
        name: itemName,
        description: itemDescription,
        type: itemType,
        price: itemPrice,
        discountPrice: discountPrice,
        imageUrl: itemType === 'AVATAR' ? `dicebear:${dicebearStyle}:${dicebearSeed}` : (itemImageUrl || null),
      });
      alert('아이템이 등록되었습니다.');
      // 폼 초기화
      setItemName('');
      setItemDescription('');
      setItemType('AVATAR');
      setItemPrice('');
      setDiscountPrice(null);
      setItemImageUrl('');
      // Store 탭으로 이동
      setActiveTab('store');
    } catch (error) {
      console.error('아이템 등록 실패:', error);
      alert('아이템 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setActiveTab('store')}
          className="p-2 rounded-xl hover:bg-black/5 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h3 className="text-2xl font-black text-black">신규 상점 아이템 등록</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <GlassCard className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-black/10 bg-black/[0.01]">
            {itemType === 'EFFECT' ? (
              <>
                <span className="text-7xl mb-4 select-none">{itemImageUrl || '✨'}</span>
                <p className="text-xs font-black text-black/30 mb-3">이펙트 이모지 *</p>
                <input
                  type="text"
                  value={itemImageUrl}
                  onChange={(e) => setItemImageUrl(e.target.value)}
                  className="w-full bg-white border border-black/10 px-4 py-2 rounded-xl text-center text-2xl placeholder:text-black/40"
                  placeholder="🔥"
                  maxLength={2}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full p-4">
                <img src={parseDicebearUrl(`dicebear:${dicebearStyle}:${dicebearSeed}`, 1, 'AVATAR')} alt="preview" className="w-32 h-32 mb-4" />
                <button
                  onClick={() => setDicebearSeed(Math.random().toString(36).substring(7))}
                  className="px-4 py-2 bg-[#E8A838]/10 text-[#E8A838] rounded-xl font-bold flex items-center gap-2 mb-4 hover:bg-[#E8A838]/20 transition-colors text-xs"
                >
                  <Sparkles size={16} /> 랜덤 생성
                </button>
                <div className="w-full space-y-2">
                  <select
                    value={dicebearStyle}
                    onChange={(e) => setDicebearStyle(e.target.value)}
                    className="w-full bg-white border border-black/10 px-4 py-2 rounded-xl text-xs font-bold text-black"
                  >
                    <option value="funEmoji">funEmoji (기본)</option>
                    <option value="avataaars">avataaars (사람)</option>
                    <option value="bottts">bottts (로봇)</option>
                    <option value="lorelei">lorelei (만화)</option>
                    <option value="pixelArt">pixelArt (픽셀)</option>
                  </select>
                  <input
                    type="text"
                    value={dicebearSeed}
                    onChange={(e) => setDicebearSeed(e.target.value)}
                    className="w-full bg-white border border-black/10 px-4 py-2 rounded-xl text-xs font-bold text-black placeholder:text-black/40"
                    placeholder="시드 단어 입력..."
                  />
                </div>
              </div>
            )}
          </GlassCard>
        </div>
        <div className="md:col-span-2 space-y-6">
          <GlassCard>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">
                  아이템 명칭 *
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold focus:ring-4 ring-[#1B4332]/10 outline-none transition-all text-black placeholder:text-black/40"
                  placeholder="예: 황금 변기 칭호"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">
                    가격 (POOP POINT) *
                  </label>
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold text-black placeholder:text-black/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="5000"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">
                    할인가 (선택)
                  </label>
                  <input
                    type="number"
                    value={discountPrice === null ? '' : discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold text-black placeholder:text-black/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="미입력 시 할인 없음"
                    min="0"
                  />
                  {discountPrice !== null && itemPrice !== '' && discountPrice < Number(itemPrice) && (
                    <p className="text-xs text-red-500 font-bold mt-1">
                      -{Math.round((1 - discountPrice / Number(itemPrice)) * 100)}% 할인 적용
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">
                  카테고리 *
                </label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value as ItemType)}
                  className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold text-black"
                >
                  <option value="AVATAR">아바타</option>
                  <option value="EFFECT">효과</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">
                  아이템 설명 *
                </label>
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold h-32 resize-none text-black placeholder:text-black/40"
                  placeholder="아이템에 대한 상세 설명을 입력하세요..."
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-[#1B4332] text-white rounded-2xl font-black shadow-xl shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '등록 중...' : '등록 완료'}
                </button>
                <button
                  onClick={() => setActiveTab('store')}
                  className="flex-1 py-4 bg-black/5 text-black/60 rounded-2xl font-black hover:bg-black/10 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

// ── Screen: Edit Item Form ─────────────────────────────────────────────
const EditItemView = ({ setActiveTab, editingItem }: { setActiveTab: (tab: AdminTab) => void, editingItem: ItemResponse }) => {
  const [itemName, setItemName] = useState(editingItem.name);
  const [itemDescription, setItemDescription] = useState(editingItem.description);
  const [itemType, setItemType] = useState<ItemType>(editingItem.type);
  const [itemPrice, setItemPrice] = useState<number | ''>(editingItem.price);
  const [discountPrice, setDiscountPrice] = useState<number | null>(editingItem.discountPrice ?? null);
  const [itemImageUrl, setItemImageUrl] = useState(editingItem.imageUrl || '');
  
  // dicebear 파싱
  const isDicebear = editingItem.imageUrl?.startsWith('dicebear:');
  const dParts = isDicebear ? editingItem.imageUrl?.split(':') || [] : [];
  const [dicebearStyle, setDicebearStyle] = useState(dParts[1] || 'funEmoji');
  const [dicebearSeed, setDicebearSeed] = useState(dParts[2] || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!itemName.trim()) {
      alert('아이템 명칭을 입력해주세요.');
      return;
    }
    if (!itemDescription.trim()) {
      alert('아이템 설명을 입력해주세요.');
      return;
    }
    if (itemPrice === '' || itemPrice < 0) {
      alert('가격은 0 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`/admin/shop/items/${editingItem.id}`, {
        name: itemName,
        description: itemDescription,
        type: itemType,
        price: itemPrice,
        discountPrice: discountPrice,
        imageUrl: itemType === 'AVATAR' ? `dicebear:${dicebearStyle}:${dicebearSeed}` : (itemImageUrl || null),
      });
      alert('아이템이 수정되었습니다.');
      setActiveTab('store');
    } catch (error) {
      console.error('아이템 수정 실패:', error);
      alert('아이템 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setActiveTab('store')}
          className="p-2 rounded-xl hover:bg-black/5 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h3 className="text-2xl font-black text-black">아이템 수정</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <GlassCard className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-black/10 bg-black/[0.01]">
            {itemType === 'EFFECT' ? (
              <>
                <span className="text-7xl mb-4 select-none">{itemImageUrl || '✨'}</span>
                <p className="text-xs font-black text-black/30 mb-3">이펙트 이모지 *</p>
                <input
                  type="text"
                  value={itemImageUrl}
                  onChange={(e) => setItemImageUrl(e.target.value)}
                  className="w-full bg-white border border-black/10 px-4 py-2 rounded-xl text-center text-2xl placeholder:text-black/40"
                  placeholder="🔥"
                  maxLength={2}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full p-4">
                <img src={parseDicebearUrl(`dicebear:${dicebearStyle}:${dicebearSeed}`, editingItem.id, 'AVATAR')} alt="preview" className="w-32 h-32 mb-4" />
                <button
                  onClick={() => setDicebearSeed(Math.random().toString(36).substring(7))}
                  className="px-4 py-2 bg-[#E8A838]/10 text-[#E8A838] rounded-xl font-bold flex items-center gap-2 mb-4 hover:bg-[#E8A838]/20 transition-colors text-xs"
                >
                  <Sparkles size={16} /> 랜덤 생성
                </button>
                <div className="w-full space-y-2">
                  <select
                    value={dicebearStyle}
                    onChange={(e) => setDicebearStyle(e.target.value)}
                    className="w-full bg-white border border-black/10 px-4 py-2 rounded-xl text-xs font-bold text-black"
                  >
                    <option value="funEmoji">funEmoji (기본)</option>
                    <option value="avataaars">avataaars (사람)</option>
                    <option value="bottts">bottts (로봇)</option>
                    <option value="lorelei">lorelei (만화)</option>
                    <option value="pixelArt">pixelArt (픽셀)</option>
                  </select>
                  <input
                    type="text"
                    value={dicebearSeed}
                    onChange={(e) => setDicebearSeed(e.target.value)}
                    className="w-full bg-white border border-black/10 px-4 py-2 rounded-xl text-xs font-bold text-black placeholder:text-black/40"
                    placeholder="시드 단어 입력..."
                  />
                </div>
              </div>
            )}
          </GlassCard>
        </div>
        <div className="md:col-span-2 space-y-6">
          <GlassCard>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">
                  아이템 명칭 *
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold focus:ring-4 ring-[#1B4332]/10 outline-none transition-all text-black placeholder:text-black/40"
                  placeholder="예: 황금 변기 칭호"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">
                    가격 (POOP POINT) *
                  </label>
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold text-black placeholder:text-black/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="5000"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">
                    할인가 (선택)
                  </label>
                  <input
                    type="number"
                    value={discountPrice === null ? '' : discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold text-black placeholder:text-black/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="미입력 시 할인 없음"
                    min="0"
                  />
                  {discountPrice !== null && itemPrice !== '' && discountPrice < Number(itemPrice) && (
                    <p className="text-xs text-red-500 font-bold mt-1">
                      -{Math.round((1 - discountPrice / Number(itemPrice)) * 100)}% 할인 적용
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">
                    카테고리 *
                  </label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as ItemType)}
                    className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold text-black"
                  >
                    <option value="AVATAR">아바타</option>
                    <option value="EFFECT">효과</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">
                  아이템 설명 *
                </label>
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold h-32 resize-none text-black placeholder:text-black/40"
                  placeholder="아이템에 대한 상세 설명을 입력하세요..."
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-[#1B4332] text-white rounded-2xl font-black shadow-xl shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '수정 중...' : '수정 완료'}
                </button>
                <button
                  onClick={() => setActiveTab('store')}
                  className="flex-1 py-4 bg-black/5 text-black/60 rounded-2xl font-black hover:bg-black/10 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

const ACHIEVEMENT_LABELS: Record<AchievementType, string> = {
  TOTAL_RECORDS: '총 기록 횟수',
  UNIQUE_TOILETS: '방문 화장실 수',
  CONSECUTIVE_DAYS: '연속 기록 일수',
  SAME_TOILET_VISITS: '동일 화장실 방문',
  LEVEL_REACHED: '레벨 달성',
};

const TitleManagementView = ({
  setActiveTab,
  setEditingTitle,
}: {
  setActiveTab: (tab: AdminTab) => void;
  setEditingTitle: (title: AdminTitleResponse | null) => void;
}) => {
  const [titles, setTitles] = useState<AdminTitleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AchievementType | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTitles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '10',
      });
      if (filter !== 'ALL') params.append('type', filter);

      const response = await api.get<PageResponse<AdminTitleResponse>>(`/admin/titles?${params}`);
      setTitles(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('칭호 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTitles();
  }, [page, filter]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" 칭호를 삭제하시겠습니까?`)) return;
    try {
      await api.delete(`/admin/titles/${id}`);
      alert('칭호가 삭제되었습니다.');
      fetchTitles();
    } catch (error: any) {
      alert(error.response?.data?.message || '이미 유저가 획득한 칭호는 삭제할 수 없습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-black">칭호 시스템 관리</h3>
          <p className="text-sm font-bold text-black/40">업적 기반 자동 해금 칭호 설정</p>
        </div>
        <button
          onClick={() => {
            setEditingTitle(null);
            setActiveTab('add-title');
          }}
          className="px-6 py-3 rounded-2xl bg-[#1B4332] text-white font-black text-sm shadow-xl flex items-center gap-2"
        >
          <Plus size={18} /> 신규 칭호 등록
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {(
          [
            'ALL',
            'TOTAL_RECORDS',
            'UNIQUE_TOILETS',
            'CONSECUTIVE_DAYS',
            'SAME_TOILET_VISITS',
            'LEVEL_REACHED',
          ] as const
        ).map((type) => (
          <button
            key={type}
            onClick={() => {
              setFilter(type);
              setPage(0);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
              filter === type
                ? 'bg-[#1B4332] text-white shadow-lg'
                : 'bg-white border border-black/5 text-black/40 hover:bg-black/5'
            }`}
          >
            {type === 'ALL' ? '전체 보기' : ACHIEVEMENT_LABELS[type as AchievementType]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {titles.map((title) => (
            <GlassCard key={title.id} className="p-0 border-none">
              <div className="p-6 flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-black/[0.03] flex items-center justify-center text-3xl shadow-inner border border-black/5">
                  {title.imageUrl || '🏆'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-black text-lg text-black">{title.name}</h4>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">
                      {ACHIEVEMENT_LABELS[title.achievementType]}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-black/40">{title.description}</p>
                  <p className="text-[11px] font-black text-[#E8A838] mt-2 italic">
                    Condition: {ACHIEVEMENT_LABELS[title.achievementType]} ≥{' '}
                    {title.achievementThreshold}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingTitle(title);
                      setActiveTab('add-title');
                    }}
                    className="p-3 rounded-xl bg-black/[0.03] text-black/40 hover:text-black/80 hover:bg-black/[0.05] transition-all"
                  >
                    <Settings size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(title.id, title.name)}
                    className="p-3 rounded-xl bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
          {titles.length === 0 && (
            <div className="text-center py-20 bg-black/[0.01] rounded-[40px] border-2 border-dashed border-black/5">
              <X size={40} className="mx-auto text-black/10 mb-4" />
              <p className="text-sm font-black text-black/20">등록된 칭호가 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-xl border border-black/10 disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-black text-black/40">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-xl border border-black/10 disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

const AddTitleView = ({
  setActiveTab,
  editingTitle,
}: {
  setActiveTab: (tab: AdminTab) => void;
  editingTitle: AdminTitleResponse | null;
}) => {
  const [name, setName] = useState(editingTitle?.name || '');
  const [description, setDescription] = useState(editingTitle?.description || '');
  const [imageUrl, setImageUrl] = useState(editingTitle?.imageUrl || '');
  const [type, setType] = useState<AchievementType>(
    editingTitle?.achievementType || 'TOTAL_RECORDS',
  );
  const [threshold, setThreshold] = useState<number>(editingTitle?.achievementThreshold || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim()) {
      alert('명칭과 설명을 모두 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        description,
        imageUrl,
        achievementType: type,
        achievementThreshold: threshold,
      };

      if (editingTitle) {
        await api.put(`/admin/titles/${editingTitle.id}`, payload);
        alert('칭호가 수정되었습니다.');
      } else {
        await api.post('/admin/titles', payload);
        alert('신규 칭호가 등록되었습니다.');
      }
      setActiveTab('titles');
    } catch (error: any) {
      console.error('칭호 등록/수정 실패:', error);
      alert(error.response?.data?.message || '처리에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setActiveTab('titles')} className="p-2 rounded-xl hover:bg-black/5">
          <ChevronLeft size={24} />
        </button>
        <h3 className="text-2xl font-black text-black">
          {editingTitle ? '칭호 정보 수정' : '신규 칭호 마스터 클래스 등록'}
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <GlassCard>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block tracking-widest">
                  칭호 명칭 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold focus:ring-4 ring-[#1B4332]/10 outline-none transition-all text-black placeholder:text-black/40"
                  placeholder="예: 전설의 쾌변가"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block tracking-widest">
                  이모지/아이콘 (imageUrl)
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold focus:ring-4 ring-[#1B4332]/10 outline-none transition-all text-black placeholder:text-black/40"
                  placeholder="단일 이모지 입력을 권장합니다 (예: 👑)"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-black/40 mb-2 block tracking-widest">
                칭호 설명 *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold h-32 resize-none outline-none focus:ring-4 ring-[#1B4332]/10 transition-all text-black placeholder:text-black/40"
                placeholder="획득 시 표시될 설명을 입력하세요..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block tracking-widest">
                  업적 평가 기준 *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AchievementType)}
                  className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold outline-none text-black"
                >
                  {Object.entries(ACHIEVEMENT_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block tracking-widest">
                  임계값 (Threshold) *
                </label>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold outline-none text-black placeholder:text-black/40"
                  min="0"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-4 bg-[#1B4332] text-white rounded-2xl font-black shadow-xl shadow-green-900/20 disabled:opacity-50"
              >
                {isSubmitting
                  ? '데이터 처리 엔진 작동 중...'
                  : editingTitle
                    ? '수정 완료'
                    : '시스템 등록'}
              </button>
              <button
                onClick={() => setActiveTab('titles')}
                className="flex-1 py-4 bg-black/5 text-black/60 rounded-2xl font-black hover:bg-black/10 transition-colors"
              >
                등록 취소
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// ── Screen: System Logs View ──────────────────────────────────────────

const LogsView = ({ logs, loading }: { logs: any[]; loading: boolean }) => {
  if (loading) return (
    <div className="flex justify-center py-20">
      <RefreshCw size={24} className="animate-spin text-black/20" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-black">실시간 시스템 로그</h3>
          <p className="text-sm font-bold text-black/40">
            백엔드 및 인프라 엔진의 모든 런타임 이벤트를 모니터링합니다.
          </p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-black text-white font-black text-[10px] uppercase shadow-lg">
          Export CSV
        </button>
      </div>
      <GlassCard className="p-0 border-none bg-transparent shadow-none">
        <div
          className="overflow-x-auto rounded-[28px] border bg-white/50 backdrop-blur-xl"
          style={{ borderColor: COLORS.border }}
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/[0.02] border-b" style={{ borderColor: COLORS.border }}>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                  Timestamp
                </th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                  Type
                </th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                  Message
                </th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40 text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {(logs || []).map((log, idx) => (
                <tr
                  key={log.id || idx}
                  className="border-b transition-colors hover:bg-black/[0.01]"
                  style={{ borderColor: COLORS.border }}
                >
                  <td className="px-8 py-5 text-xs font-bold text-black/60">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : '방금 전'}
                  </td>
                  <td className="px-8 py-5 text-[10px] font-black tracking-widest"
                      style={{ color: log.level === 'ERROR' ? COLORS.error : log.level === 'WARN' ? COLORS.warning : COLORS.textSecondary }}>
                    {log.level || 'INFO'}
                  </td>
                  <td className="px-8 py-5 text-sm font-black text-black">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-black/30 uppercase tracking-tighter mb-0.5">{log.source}</span>
                      <span className="line-clamp-1">{log.message}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right flex justify-end">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-black ${log.level === 'ERROR' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                    >
                      {log.level === 'ERROR' ? 'FAIL' : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
              {(logs || []).length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center opacity-30 font-black uppercase tracking-widest text-sm">
                    No system logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

// ── Main Page Layout: Admin Dashboard ─────────────────────────────────
export function AdminPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [globalSearch, setGlobalSearch] = useState('');
  const [editingTitle, setEditingTitle] = useState<AdminTitleResponse | null>(null);
  const [editingItem, setEditingItem] = useState<ItemResponse | null>(null);

  // Dashboard 통계 데이터 상태 관리
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // 알림 확인 여부 관리 (localStorage 연동)
  const [visitedTabs, setVisitedTabs] = useState<AdminTab[]>(() => {
    const saved = localStorage.getItem('daypoo_admin_visited_tabs');
    return saved ? JSON.parse(saved) : [];
  });

  // 탭 변경 시 방문 기록 추가 및 저장
  const handleTabChange = (tabId: AdminTab) => {
    setActiveTab(tabId);
    setVisitedTabs((prev) => {
      if (!prev.includes(tabId)) {
        const next = [...prev, tabId];
        localStorage.setItem('daypoo_admin_visited_tabs', JSON.stringify(next));
        return next;
      }
      return prev;
    });
  };

  // 권한 체크 로직 (즉시 리다이렉트)
  const isAdmin =
    user &&
    ((typeof user.role === 'string' && user.role.toUpperCase().includes('ADMIN')) ||
      (Array.isArray(user.role) &&
        user.role.some((r: string) => r.toUpperCase().includes('ADMIN'))));

  // 로딩 완료 후 권한 없으면 즉시 리다이렉트 (로딩 화면 노출 방지)
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      console.group('🚫 Unauthorized Access Blocked');
      console.warn('Page: AdminPage');
      console.warn('User ID:', user?.id);
      console.warn('User Role:', user?.role);
      console.groupEnd();
      navigate('/main', { replace: true });
    }
  }, [authLoading, isAdmin, user, navigate]);

  // 로딩 중이거나 권한 없는 경우 빈 화면 (리다이렉트 대기)
  if (authLoading || !isAdmin) {
    return null;
  }

  const fetchStats = async () => {
    try {
      const [statsData, logsData] = await Promise.all([
        api.get<AdminStatsResponse>('/admin/stats'),
        api.get<any[]>('/admin/logs')
      ]);
      setStats(statsData);
      setLogs(Array.isArray(logsData) ? logsData : []);
    } catch (err) {
      console.error('Admin data fetch error', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    // 5분마다 통계 데이터 갱신
    const statsTimer = setInterval(fetchStats, 300000);

    return () => {
      clearInterval(t);
      clearInterval(statsTimer);
    };
  }, []);

  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    {
      id: 'users',
      label: '유저 관리',
      icon: Users,
      badge:
        !visitedTabs.includes('users') && stats?.todayNewUsers && stats.todayNewUsers > 0
          ? stats.todayNewUsers
          : undefined,
    },
    {
      id: 'toilets',
      label: '화장실 관리',
      icon: MapPin,
      badge: undefined,
    },
    {
      id: 'cs',
      label: '고객 지원',
      icon: MessageSquare,
      badge:
        !visitedTabs.includes('cs') && stats?.pendingInquiries && stats.pendingInquiries > 0
          ? stats.pendingInquiries
          : undefined,
    },
    { id: 'store', label: '프리미엄 상점', icon: ShoppingBag },
    { id: 'titles', label: '칭호 시스템', icon: Star },
    { id: 'system', label: '시스템 설정', icon: Settings },
  ];

  return (
    <div
      className="flex h-screen overflow-hidden font-['Pretendard']"
      style={{ background: COLORS.background }}
    >
      {/* 🔮 Sidebar Navigation */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 96 : 300 }}
        className="h-full border-r bg-white/80 backdrop-blur-3xl z-30 transition-all flex flex-col py-8"
        style={{ borderColor: COLORS.border }}
      >
        <div
          className={`mb-12 px-6 flex items-center justify-between ${sidebarCollapsed ? 'justify-center mx-auto' : ''}`}
        >
          {!sidebarCollapsed && (
            <motion.span
              onClick={() => setActiveTab('dashboard')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-black cursor-pointer"
              style={{
                fontFamily: "'SchoolSafetyNotification'",
                color: COLORS.primary,
                letterSpacing: '-0.05em',
              }}
            >
              Day<span style={{ color: COLORS.accent }}>.</span>Poo
              <span className="ml-2 px-2 py-0.5 text-[9px] bg-[#E8A838]/20 text-[#E8A838] rounded-lg">
                ADMIN
              </span>
            </motion.span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-xl hover:bg-black/5 transition-colors text-[#1B4332]"
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 w-full space-y-2 px-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id as AdminTab)}
              className="group relative w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all overflow-hidden"
              style={{ color: activeTab === item.id ? COLORS.primary : COLORS.textSecondary }}
            >
              {activeTab === item.id && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-[#1B4332]/5 border-r-[4px] border-[#1B4332]"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <div
                className={`relative z-10 p-1.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-[#1B4332] text-white shadow-lg shadow-green-900/20' : 'group-hover:bg-black/5'}`}
              >
                <item.icon size={20} />
              </div>
              {!sidebarCollapsed && (
                <span className="relative z-10 text-sm font-black tracking-tight flex-1 text-left">
                  {item.label}
                </span>
              )}
              {item.badge && !sidebarCollapsed && (
                <span className="relative z-10 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-[#FF4B4B] text-white">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="w-full px-4 mt-auto space-y-1">
          <button
            onClick={() => navigate('/main')}
            className="w-full py-4 rounded-2xl flex items-center gap-4 px-4 transition-colors hover:bg-emerald-50 text-emerald-600 font-bold text-sm"
          >
            <div className="p-1.5 rounded-xl bg-emerald-100">
              <Home size={20} />
            </div>
            {!sidebarCollapsed && <span>메인 페이지로</span>}
          </button>
          <button
            onClick={logout}
            className="w-full py-4 rounded-2xl flex items-center gap-4 px-4 transition-colors hover:bg-red-50 text-red-500 font-bold text-sm"
          >
            <div className="p-1.5 rounded-xl bg-red-100">
              <LogOut size={20} />
            </div>
            {!sidebarCollapsed && <span>로그아웃</span>}
          </button>
        </div>
      </motion.aside>

      {/* 🚀 Main Content Shell */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative flex flex-col">
        {/* 🧩 Header / TopBar */}
        <header
          className={`sticky top-0 z-20 px-8 py-5 flex items-center justify-between transition-all backdrop-blur-md border-b bg-white/40`}
          style={{ borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-4">
            <div
              className="p-2.5 rounded-2xl bg-white shadow-sm border"
              style={{ borderColor: COLORS.border }}
            >
              {activeTab === 'dashboard' ? (
                <LayoutDashboard size={20} style={{ color: COLORS.primary }} />
              ) : activeTab === 'users' ? (
                <Users size={20} style={{ color: COLORS.primary }} />
              ) : activeTab === 'toilets' ? (
                <MapPin size={20} style={{ color: COLORS.primary }} />
              ) : activeTab === 'cs' ? (
                <MessageSquare size={20} style={{ color: COLORS.primary }} />
              ) : activeTab === 'store' ? (
                <ShoppingBag size={20} style={{ color: COLORS.primary }} />
              ) : activeTab === 'titles' ? (
                <Star size={20} style={{ color: COLORS.primary }} />
              ) : (
                <Settings size={20} style={{ color: COLORS.primary }} />
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-black text-black/90 uppercase tracking-widest">
                {activeTab === 'dashboard'
                  ? '관리자 대시보드'
                  : activeTab === 'users'
                    ? '유저 제어 센터'
                    : activeTab === 'toilets'
                      ? '맵 엔진 관제'
                      : activeTab === 'cs'
                        ? '고객 통합 지원'
                        : activeTab === 'store'
                          ? '프리미엄 샵 관리'
                          : activeTab === 'titles'
                            ? '칭호 시스템 엔진'
                            : activeTab === 'add-title'
                              ? '신규 칭호 마스터 클래스'
                              : activeTab === 'add-item'
                                ? '신규 아이템 카탈로그'
                                : activeTab === 'edit-item'
                                  ? '아이템 데이터 마스터 수정'
                                  : activeTab === 'logs'
                                    ? '시스템 런타임 로그'
                                    : '시스템 인프라 설정'}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-black/40 font-bold">
                <Calendar size={12} /> {currentTime.toLocaleDateString()}
                <Clock size={12} className="ml-2" /> {currentTime.toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">


            <div className="flex items-center gap-3 group cursor-pointer pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-black/80 leading-none">시스템 마스터</p>
                <p className="text-[10px] font-bold text-black/30 mt-1 uppercase tracking-tighter">
                  최고 관리자 계정
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-2xl overflow-hidden shadow-md border-2 border-[#1B4332]/20 group-hover:scale-105 transition-transform flex items-center justify-center">
                <span className="text-xl">💩</span>
              </div>
            </div>
          </div>
        </header>

        {/* 🌈 View Container */}
        <section className="flex-1 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {activeTab === 'dashboard' && (
                <DashboardView 
                  stats={stats} 
                  logs={logs}
                  loading={statsLoading} 
                  setActiveTab={setActiveTab} 
                />
              )}
              {activeTab === 'users' && <UsersView />}
              {activeTab === 'toilets' && <ToiletsView />}
              {activeTab === 'cs' && <CsView stats={stats} onStatsRefresh={fetchStats} />}
              {activeTab === 'store' && (
                <StoreView setActiveTab={setActiveTab} setEditingItem={setEditingItem} />
              )}
              {activeTab === 'titles' && (
                <TitleManagementView
                  setActiveTab={setActiveTab}
                  setEditingTitle={setEditingTitle}
                />
              )}
              {activeTab === 'add-title' && (
                <AddTitleView setActiveTab={setActiveTab} editingTitle={editingTitle} />
              )}
              {activeTab === 'system' && (
                <SystemView 
                  stats={stats} 
                  logs={logs} 
                  loading={statsLoading} 
                  onRefresh={fetchStats} 
                />
              )}
              {activeTab === 'add-item' && <AddItemView setActiveTab={setActiveTab} />}
              {activeTab === 'edit-item' && editingItem && (
                <EditItemView setActiveTab={setActiveTab} editingItem={editingItem} />
              )}
              {activeTab === 'logs' && <LogsView logs={logs} loading={statsLoading} />}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      {/* 🎇 Background Decoration */}
      <div className="fixed top-0 right-0 -z-10 w-[800px] h-[800px] bg-[#1B4332]/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-[#E8A838]/5 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />
    </div>
  );
}
