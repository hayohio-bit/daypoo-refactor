import { motion } from 'framer-motion';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

interface MonthlyTrendSectionProps {
  reportData: any;
}

/** 30일 리포트에서만 보여 주는 주차별 추이와 브리스톨 분포 */
export const MonthlyTrendSection = ({ reportData }: MonthlyTrendSectionProps) => (
  <div className="mt-5 sm:mt-8 p-4 sm:p-8 rounded-[20px] sm:rounded-[40px] bg-gray-50 border border-gray-100 shadow-inner">
    <div className="flex items-center justify-between mb-5 sm:mb-8">
      <h4 className="text-base sm:text-lg font-black text-[#1A2B27]">30일 심층 트렌드</h4>
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
          {(reportData?.weeklyHealthScores || [0, 0, 0, 0]).map((score: number, i: number) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
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
              <span className="text-[10px] font-bold text-gray-400 mt-1">{i + 1}주</span>
            </div>
          ))}
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
              const total = Object.values(reportData?.bristolDistribution || {}).reduce(
                (a: any, b: any) => a + b,
                0,
              ) as number;
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
          <span className="text-emerald-600">{reportData?.avgDailyRecordCount || 0}회</span>
        </p>
      </div>
    </div>
  </div>
);
