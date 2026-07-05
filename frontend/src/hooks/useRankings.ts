import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/apiClient';

interface EquippedItemResponse {
  icon: string;          // 백엔드에서 null 방지 처리됨 (imageUrl이 없으면 dicebear seed 자동 생성)
  name: string;
  type: 'AVATAR' | 'EFFECT';
  iconType: 'URL' | 'DICEBEAR' | 'EMOJI';  // 추가
}

interface UserRankResponse {
  userId: number;
  nickname: string;
  titleName: string;
  level: number;
  score: number;
  rank: number;
  equippedItems: EquippedItemResponse[]; // 신규 추가
  equippedAvatarUrl?: string | null; // 신규 추가
}

interface RankingResponse {
  topRankers: UserRankResponse[];
  myRank: UserRankResponse;
  activeUserCount: number; // 신규 추가
}

export function useRankings(tab: 'total' | 'local' | 'health', regionName?: string) {
  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = useCallback(async () => {
    // local 탭인데 regionName이 없으면 API 호출하지 않음
    if (tab === 'local' && !regionName) {
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let endpoint = '';
      if (tab === 'total') endpoint = '/rankings/global';
      else if (tab === 'health') endpoint = '/rankings/health';
      else endpoint = `/rankings/region?regionName=${encodeURIComponent(regionName!)}`;

      const res = await api.get(endpoint);
      setData(res as RankingResponse);
    } catch (e: any) {
      console.error('[useRankings] Error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, regionName]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  return { data, loading, error, refetch: fetchRankings };
}
