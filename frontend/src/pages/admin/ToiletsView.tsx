import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Database,
  Navigation,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import WaveButtonComponent from '../../components/WaveButton';
import { GlassCard } from '../../components/common/GlassCard';
import { useToilets } from '../../hooks/useToilets';
import { api } from '../../services/apiClient';
import type {
  AdminToiletListResponse,
  PageResponse,
  SyncStatusResponse,
} from '../../types/admin';
import type { ToiletData } from '../../types/toilet';
import { COLORS } from './adminCommons';

// ── Recent Toilets Panel Component ────────────────────────────────────

const RecentToiletsPanel = () => {
  const [recentToilets, setRecentToilets] = useState<AdminToiletListResponse[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchRecentToilets = async () => {
      try {
        const response = await api.get<PageResponse<AdminToiletListResponse>>(
          '/admin/toilets?page=0&size=5&sort=id,desc',
        );
        setRecentToilets(response?.content || []);
        setTotalCount(response?.totalElements || 0);
      } catch (error) {
        console.error('최근 화장실 목록 조회 실패:', error);
        setRecentToilets([]);
        setTotalCount(0);
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
            총 {totalCount.toLocaleString()}개 중 5개
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

export const ToiletsView = () => {
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
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // 화장실 선택 시 리뷰 요약 가져오기
  useEffect(() => {
    if (!selectedToilet) return;
    setLoadingDetail(true);
    api
      .get(`/toilets/${selectedToilet.id}/reviews/summary`)
      .then((res: any) => {
        setReviewSummary(res);
        setToiletReviews(Array.isArray(res?.recentReviews) ? res.recentReviews : []);
      })
      .catch(() => {
        setReviewSummary(null);
        setToiletReviews([]);
      })
      .finally(() => setLoadingDetail(false));
  }, [selectedToilet?.id]);

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

  const toilets = apiToilets;

  const startPolling = () => {
    pollingRef.current = setInterval(async () => {
      try {
        const status = await api.get<SyncStatusResponse>('/admin/sync-toilets/status');
        if (status.status === 'COMPLETED') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setSyncing(false);
          setSyncResult(
            `동기화 완료! 총 ${status.totalCount}건 처리 (신규 ${status.insertedCount ?? 0}건 / 업데이트 ${status.updatedCount ?? 0}건)`,
          );
          refetch();
        } else if (status.status === 'FAILED') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setSyncing(false);
          alert('동기화 실패: ' + status.errorMessage);
        }
      } catch {
        if (pollingRef.current) clearInterval(pollingRef.current);
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
      startPolling();
    } catch (error: any) {
      setSyncing(false);
      console.error('동기화 시작 실패:', error);
      alert('동기화 시작 실패: ' + (error.message || '오류가 발생했습니다.'));
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let retryCount = 0;
    const MAX_SDK_RETRIES = 100;

    const initMap = () => {
      const { kakao } = window as any;
      if (!kakao?.maps) {
        if (retryCount++ >= MAX_SDK_RETRIES) {
          console.error('[ToiletsView] Kakao Maps SDK 로드 타임아웃.');
          return;
        }
        setTimeout(initMap, 100);
        return;
      }

      kakao.maps.load(() => {
        if (!mapContainerRef.current) return;
        const options = {
          center: new kakao.maps.LatLng(mapCenter.lat, mapCenter.lng),
          level: mapScale,
        };
        const map = new kakao.maps.Map(mapContainerRef.current, options);
        mapRef.current = map;

        kakao.maps.event.addListener(map, 'idle', () => {
          const center = map.getCenter();
          setMapCenter({ lat: center.getLat(), lng: center.getLng() });
          setMapScale(map.getLevel());
        });
      });
    };

    initMap();
  }, []);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !toilets) return;
    const { kakao } = window as any;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

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
            <div id="map" ref={mapContainerRef} className="w-full h-full" />

            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-10 whitespace-nowrap">
              <WaveButtonComponent
                onClick={handleSyncToilets}
                disabled={syncing}
                variant={syncing ? 'accent' : 'primary'}
                size="md"
                className="shadow-xl backdrop-blur-md animate-none"
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
              <button
                onClick={async () => {
                  if (
                    !confirm(
                      '리뷰 5개 이상 & AI 요약 미생성 화장실에 대해 일괄 생성합니다. 진행할까요?',
                    )
                  )
                    return;
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

            {syncResult && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-[#1B4332]/95 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl border-2 border-white/20">
                  <p className="text-xs font-bold">{syncResult}</p>
                </div>
              </div>
            )}

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
                      className={`w-2.5 h-2.5 rounded-full ${
                        loading ? 'bg-amber-400' : 'bg-green-500'
                      } animate-pulse`}
                    />
                    <span className="text-[10px] font-black uppercase text-black/60">
                      {loading ? 'Syncing...' : 'Sync OK'}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>

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

                  {reviewSummary?.aiSummary && (
                    <div className="mb-6 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-600 mb-1 uppercase">
                        AI 리뷰 요약
                      </p>
                      <p className="text-xs font-bold text-[#1A2B27]">{reviewSummary.aiSummary}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-black text-black/30 mb-3 uppercase">최근 리뷰</p>
                    {loadingDetail ? (
                      <p className="text-xs text-black/40 font-bold py-4 text-center">
                        불러오는 중...
                      </p>
                    ) : toiletReviews.length > 0 ? (
                      <div className="space-y-2">
                        {toiletReviews.slice(0, 5).map((review: any, i: number) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-black/[0.02] border flex items-start gap-3"
                          >
                            <div className="flex-shrink-0 text-[#E8A838] text-xs font-black">
                              ★ {review.rating}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-[#1A2B27] truncate">
                                {review.comment || '댓글 없음'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-black/40 font-bold">
                                  {review.nickname || '익명'}
                                </span>
                                {review.emojiTags && (
                                  <span className="text-[10px] text-black/30">{review.emojiTags}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-black/30 font-bold py-4 text-center">
                        리뷰가 없습니다
                      </p>
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
export default ToiletsView;
