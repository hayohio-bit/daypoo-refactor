import { useCallback, useEffect, useRef, useState } from 'react';
import { getReport } from '../../../services/reportService';

export type ReportSubTab = 'daily' | 'weekly' | 'monthly';

/**
 * 선택한 기간의 컨디션 리포트를 조회한다.
 * 오늘 가이드(daily)는 기록이 추가되면 바로 반영돼야 하므로 캐시하지 않는다.
 */
export const useHealthReport = (subTab: ReportSubTab) => {
  const [reportData, setReportData] = useState<any>(null);
  const [isFetchLoading, setIsFetchLoading] = useState(false);
  const reportCacheRef = useRef<Record<string, any>>({});

  const fetchReport = useCallback(async (type: ReportSubTab) => {
    setReportData(null);

    if (type !== 'daily' && reportCacheRef.current[type]) {
      setReportData(reportCacheRef.current[type]);
      return;
    }

    setIsFetchLoading(true);
    try {
      const res = await getReport(type);
      reportCacheRef.current[type] = res;
      setReportData(res);
    } catch (err) {
      console.error('리포트 조회 실패:', err);
    } finally {
      setIsFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(subTab);
  }, [subTab, fetchReport]);

  return { reportData, isFetchLoading };
};
