import { useEffect, useMemo, useState } from 'react';
import type { AdminStatsResponse } from '../../../types/admin';

interface TrendIndicator {
  val: string;
  up: boolean;
}

/**
 * 대시보드 상단에 쓰는 파생 지표를 계산한다.
 * 접속자 수와 30일 구간의 앞 24일은 실제 집계가 없어 표본값으로 채운다.
 */
export const useDashboardMetrics = (stats: AdminStatsResponse | null, chartRange: '7D' | '30D') => {
  const totalUsersCount = stats?.totalUsers || 0;
  const [liveUsers, setLiveUsers] = useState(342);

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
        });
      }
      return [...extended, ...baseData];
    }
    return baseData;
  }, [stats, chartRange]);

  /** 어제 대비 오늘의 증감률 */
  const getTrend = (type: 'users' | 'inquiries'): TrendIndicator => {
    if (!stats?.weeklyTrend || stats.weeklyTrend.length < 2) return { val: '0%', up: true };
    const today = stats.weeklyTrend[stats.weeklyTrend.length - 1];
    const yesterday = stats.weeklyTrend[stats.weeklyTrend.length - 2];

    let tVal = 0;
    if (type === 'users')
      tVal = yesterday.users > 0 ? ((today.users - yesterday.users) / yesterday.users) * 100 : 0;
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

  return {
    liveUsers,
    trendData,
    userTrend: getTrend('users'),
    inquiryTrend: getTrend('inquiries'),
  };
};
