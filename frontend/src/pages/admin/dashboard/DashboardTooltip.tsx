import { motion } from 'framer-motion';

/** recharts 차트 위에 띄우는 커스텀 툴팁 */
export const DashboardTooltip = ({ active, payload, label }: any) => {
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
