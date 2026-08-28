import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { CountUp } from '../../../components/common/CountUp';
import { GlassCard } from '../../../components/common/GlassCard';
import { COLORS } from '../adminCommons';

export const StatWidget = ({
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
