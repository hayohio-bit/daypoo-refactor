import { motion } from 'framer-motion';
import { Activity, AlertCircle, Brain, Droplets, RefreshCw, Trophy } from 'lucide-react';
import { MonthlyTrendSection } from './MonthlyTrendSection';
import type { ReportSubTab } from './useHealthReport';

interface PeriodReportSectionProps {
  reportData: any;
  isFetchLoading: boolean;
  subTab: Exclude<ReportSubTab, 'daily'>;
}

/** 7일·30일 리포트 본문 */
export const PeriodReportSection = ({
  reportData,
  isFetchLoading,
  subTab,
}: PeriodReportSectionProps) => (
  <div className="space-y-6">
    {isFetchLoading ? (
      <div className="rounded-[24px] sm:rounded-[40px] p-6 sm:p-12 bg-white border border-gray-100 shadow-sm flex items-center justify-center py-20 sm:py-32">
        <RefreshCw size={44} className="animate-spin text-amber-500 opacity-40" />
      </div>
    ) : (
      <div className="rounded-[24px] sm:rounded-[40px] p-5 sm:p-12 bg-white border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-10">
          <h3 className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-[0.2em]">
            {subTab === 'weekly' ? '7일 정밀 분석 리포트' : '30일 컨디션 트렌드 리포트'}
          </h3>
        </div>

        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="relative">
            <svg
              width="160"
              height="160"
              viewBox="0 0 200 200"
              className="sm:w-[200px] sm:h-[200px]"
            >
              <circle cx="100" cy="100" r="90" fill="none" stroke="#f3f4f6" strokeWidth="16" />
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
                  strokeDashoffset: 2 * Math.PI * 90 * (1 - (reportData?.healthScore || 0) / 100),
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

        {subTab === 'monthly' && <MonthlyTrendSection reportData={reportData} />}
      </div>
    )}
  </div>
);
