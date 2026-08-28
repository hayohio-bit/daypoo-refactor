import { AnimatePresence, motion, useInView } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import WaveButtonComponent from '../../components/WaveButton';
import { DailyGuideSection } from './report/DailyGuideSection';
import { PeriodReportSection } from './report/PeriodReportSection';
import { type ReportSubTab, useHealthReport } from './report/useHealthReport';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export interface ReportTabProps {
  onAddRecord?: () => void;
}

export const ReportTab = ({ onAddRecord }: ReportTabProps) => {
  const [activeSubTab, setActiveSubTab] = useState<ReportSubTab>('daily');
  const { reportData, isFetchLoading } = useHealthReport(activeSubTab);

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
          { key: 'daily', label: '오늘 가이드' },
          { key: 'weekly', label: '7일 리포트' },
          { key: 'monthly', label: '30일 트렌드' },
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
            <DailyGuideSection reportData={reportData} isFetchLoading={isFetchLoading} />
          </motion.div>
        ) : (
          <motion.div
            key="pro-sections"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="relative min-h-[600px] sm:min-h-[800px]"
          >
            <PeriodReportSection
              reportData={reportData}
              isFetchLoading={isFetchLoading}
              subTab={activeSubTab}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default ReportTab;
