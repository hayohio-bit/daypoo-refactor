import { Activity, RefreshCw, Sparkles } from 'lucide-react';

interface DailyGuideSectionProps {
  reportData: any;
  isFetchLoading: boolean;
}

/** 오늘 하루의 장 상태 요약 */
export const DailyGuideSection = ({ reportData, isFetchLoading }: DailyGuideSectionProps) => {
  const hasData = reportData != null;

  return (
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
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Daily Poo Insight
            </p>
            <p className="text-base sm:text-xl font-bold leading-relaxed relative z-10 tracking-tight">
              "{reportData?.summary || '기록을 분석하고 있습니다. 화장실 기록을 남겨주세요!'}"
            </p>
            {reportData?.solution && (
              <p className="mt-3 sm:mt-4 text-emerald-200 text-sm sm:text-lg italic">
                💡 {reportData.solution}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
