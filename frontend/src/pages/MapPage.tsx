import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { LocateFixed } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ToiletPopup } from '../components/map/ToiletPopup';
import { useToilets } from '../hooks/useToilets';
import { useGeoTracking } from '../hooks/useGeoTracking';
import { ToiletData } from '../types/toilet';
import { VisitModal, VisitModalResult } from '../components/map/VisitModal';
import { CreateRecordRequest } from '../types/api';
import { api } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { MapView, MapViewHandle } from '../components/map/MapView';
import { ToiletSearchBar } from '../components/map/ToiletSearchBar';
import { calculateDistance } from '../utils/distance';

type FilterMode = 'all' | 'favorite' | 'visited';

export function MapPage({ openAuth }: { openAuth: (mode: 'login' | 'signup') => void }) {
  const mapViewRef = useRef<MapViewHandle>(null);
  const [searchParams] = useSearchParams();
  const openNearest = searchParams.get('openNearest') === 'true';

  // 상태 관리
  const [selectedToilet, setSelectedToilet] = useState<ToiletData | null>(null);
  const [targetForVisit, setTargetForVisit] = useState<ToiletData | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ToiletData[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [bounds, setBounds] = useState<any>(null);
  const [mapLevel, setMapLevel] = useState(4);
  const [checkInTime, setCheckInTime] = useState<number | null>(null);
  const [visitCounts, setVisitCounts] = useState<Record<string, number>>({});
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [hasTriedOpenNearest, setHasTriedOpenNearest] = useState(false);

  // visitCounts로부터 visitedIds Set 생성 (메모이제이션)
  const visitedIds = useMemo(() => {
    return new Set(Object.keys(visitCounts).filter((id) => visitCounts[id] > 0));
  }, [visitCounts]);

  const { refreshUser, isAuthenticated } = useAuth();

  // ── 비즈니스 로직 ──────────────────────────────────────────

  const handleSelectToilet = useCallback((toilet: ToiletData | null) => {
    if (toilet) {
      // useToilets 훅에서 관리하는 toilets 배열은 MapPage 컨텍스트 내에서 이미 hooks/useToilets를 통해 업데이트되고 있음
      setSelectedToilet(toilet);
      sessionStorage.setItem('lastSelectedToilet', JSON.stringify(toilet));
    } else {
      setSelectedToilet(null);
      sessionStorage.removeItem('lastSelectedToilet');
    }
  }, []);

  const handleFavoriteToggle = useCallback(
    async (id: string) => {
      if (!isAuthenticated) {
        openAuth('login');
        return;
      }

      // 1. 낙관적 업데이트: favoriteIds (SSOT) 즉시 변경 → sync useEffect가 마커 isFavorite 갱신
      const wasAdded = !favoriteIds.has(id);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        wasAdded ? next.add(id) : next.delete(id);
        return next;
      });
      // 2. 팝업 즉시 반영 (selectedToilet은 sync useEffect 대상 아님)
      setSelectedToilet((prev) => {
        if (prev && prev.id === id) {
          const updated = { ...prev, isFavorite: wasAdded };
          sessionStorage.setItem('lastSelectedToilet', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });

      try {
        const isAdded = await api.post<boolean>(`/favorites/${id}`);
        // 3. 서버 응답으로 재동기화 (낙관적 추측과 다를 경우만 보정)
        if (isAdded !== wasAdded) {
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            isAdded ? next.add(id) : next.delete(id);
            return next;
          });
          setSelectedToilet((prev) => {
            if (prev && prev.id === id) {
              const updated = { ...prev, isFavorite: isAdded };
              sessionStorage.setItem('lastSelectedToilet', JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
        }
      } catch (e) {
        // 4. 실패 시 롤백
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          wasAdded ? next.delete(id) : next.add(id);
          return next;
        });
        setSelectedToilet((prev) => {
          if (prev && prev.id === id) {
            const updated = { ...prev, isFavorite: !wasAdded };
            sessionStorage.setItem('lastSelectedToilet', JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
        console.error('즐겨찾기 처리 실패:', e);
        alert('즐겨찾기 처리에 실패했습니다.');
      }
    },
    [favoriteIds, openAuth, isAuthenticated],
  );

  // 데이터 훅
  const { toilets, markVisited, refetch } = useToilets({
    lat: 37.5172,
    lng: 127.0473,
    bounds,
    level: mapLevel,
    visitedIds,
    favoriteIds,
  });

  const handleAutoCheckIn = useCallback((remainedSeconds: number) => {
    const startTime = Date.now() - (60 - remainedSeconds) * 1000;
    setCheckInTime(startTime);
  }, []);

  const DEFAULT_POS = { lat: 37.5172, lng: 127.0473 };
  const { position } = useGeoTracking(toilets, handleAutoCheckIn);
  const pos = position ?? DEFAULT_POS;
  const hasReceivedRealPos = useRef(false);

  // ── 실제 위치 수신 시 지도 자동 이동 ──────────────────────────
  useEffect(() => {
    if (position && !hasReceivedRealPos.current) {
      hasReceivedRealPos.current = true;
      mapViewRef.current?.panTo(position.lat, position.lng);
    }
  }, [position]);

  // ── 방문 횟수 데이터 가져오기 ──────────────────────────────
  useEffect(() => {
    const fetchVisitCounts = async () => {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      if (!token) {
        setVisitCounts({});
        return;
      }
      try {
        const data = await api.get<Record<string, number>>('/records/my-visit-counts');
        setVisitCounts(data || {});
      } catch (e) {
        console.warn('방문 횟수 조회 실패:', e);
        setVisitCounts({});
      }
    };
    fetchVisitCounts();
  }, []);

  // ── 즐겨찾기 목록 가져오기 ──────────────────────────────
  useEffect(() => {
    const fetchFavorites = async () => {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      if (!token) return; // 비로그인 상태면 기존 상태 유지 (sync useEffect 트리거 방지)
      try {
        const data = await api.get<number[]>('/favorites');
        setFavoriteIds(new Set((data || []).map((id) => String(id))));
      } catch (e) {
        console.warn('즐겨찾기 조회 실패:', e);
        // 실패 시 setFavoriteIds 호출 안 함: 빈 Set으로 덮어쓰면 sync useEffect가 전체 초기화함
      }
    };
    fetchFavorites();
  }, []);

  // ── OpenSearch 텍스트 검색 (디바운스 300ms) ──────────────────
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed === '') {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const locationParams = pos ? `&latitude=${pos.lat}&longitude=${pos.lng}` : '';
        const data = await api.get<any[]>(
          `/toilets/search?q=${encodeURIComponent(trimmed)}&size=20${locationParams}`,
        );
        const results: ToiletData[] = (data || []).map((item: any) => ({
          id: String(item.id),
          name: item.name || '이름없음',
          roadAddress: item.address || '',
          lat: item.latitude,
          lng: item.longitude,
          isOpen24h: false,
          isMixedGender: false,
          hasDiaperTable: false,
          hasEmergencyBell: false,
          hasCCTV: false,
          isVisited: visitedIds.has(String(item.id)),
          isFavorite: favoriteIds.has(String(item.id)),
        }));
        setSearchResults(results);
      } catch (e) {
        console.warn('검색 실패:', e);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, visitedIds, favoriteIds]);

  // ── Nearest Toilet 자동 오픈 (openNearest=true 파라미터 대응) ──
  useEffect(() => {
    if (openNearest && pos && !hasTriedOpenNearest) {
      const findAndOpenNearest = async () => {
        try {
          // 현재 위치 기준 5km 반경 화장실 검색 (API 사용)
          const data = await api.get<any[]>(
            `/toilets?latitude=${pos.lat}&longitude=${pos.lng}&radius=5000`,
          );
          if (data && data.length > 0) {
            const mappedToilets: ToiletData[] = data.map((item: any) => ({
              id: String(item.id),
              name: item.name || '이름없음',
              roadAddress: item.address || '',
              lat: item.latitude,
              lng: item.longitude,
              isOpen24h: item.open_24h || false,
              isMixedGender: item.mixed_gender || false,
              hasDiaperTable: item.diaper_table || false,
              hasEmergencyBell: item.emergency_bell || false,
              hasCCTV: item.cctv || false,
              isVisited: visitedIds.has(String(item.id)),
              isFavorite: favoriteIds.has(String(item.id)),
            }));

            // 가장 가까운 화장실 계산
            let nearest = mappedToilets[0];
            let minD = calculateDistance(pos.lat, pos.lng, nearest.lat, nearest.lng);

            mappedToilets.forEach((t) => {
              const d = calculateDistance(pos.lat, pos.lng, t.lat, t.lng);
              if (d < minD) {
                minD = d;
                nearest = t;
              }
            });

            // 화장실 선택 및 지도 중심 이동
            handleSelectToilet(nearest);
            mapViewRef.current?.panTo(nearest.lat, nearest.lng);
          }
        } catch (e) {
          console.error('가장 가까운 화장실 찾기 실패:', e);
        } finally {
          setHasTriedOpenNearest(true);
        }
      };
      findAndOpenNearest();
    }
  }, [openNearest, pos, hasTriedOpenNearest, visitedIds, favoriteIds, handleSelectToilet]);

  const handleVisitRequest = useCallback(async () => {
    if (!isAuthenticated) {
      if (selectedToilet)
        sessionStorage.setItem('lastSelectedToilet', JSON.stringify(selectedToilet));
      handleSelectToilet(null);
      openAuth('login');
      return;
    }

    if (!selectedToilet || !pos) return;

    try {
      const res: any = await api.post('/records/check-in', {
        toiletId: Number(selectedToilet.id),
        latitude: pos.lat,
        longitude: pos.lng,
      });

      await refreshUser();

      if (res && typeof res.remainedSeconds === 'number') {
        setCheckInTime(Date.now() - (60 - res.remainedSeconds) * 1000);
      } else {
        setCheckInTime(Date.now());
      }
    } catch (e: any) {
      console.warn('체크인 호출 오류:', e.message);
      setCheckInTime(Date.now());
    }

    setTargetForVisit(selectedToilet);
    handleSelectToilet(null);
  }, [selectedToilet, openAuth, pos, handleSelectToilet, isAuthenticated, refreshUser]);

  const handleVisitComplete = useCallback(
    async (result: VisitModalResult) => {
      // 1. 위치 정보(pos) 방어 로직 추가
      if (!pos) {
        console.error('인증 실패: 사용자 위치 정보를 찾을 수 없습니다.');
        alert('📍 현재 위치 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      try {
        const payload: CreateRecordRequest = {
          toiletId: Number(result.toiletId),
          conditionTags: result.conditionTags,
          dietTags: result.foodTags,
          latitude: pos.lat,
          longitude: pos.lng,
          // Fast-Track: bristolType / color가 null이면 AI 자동 분석
          ...(result.bristolType !== null && { bristolScale: result.bristolType }),
          ...(result.color !== null && { color: result.color }),
          ...(result.imageBase64 && { imageBase64: result.imageBase64 }),
        };

        await api.post('/records', payload);
        await refreshUser();
        markVisited(String(result.toiletId));
        setVisitCounts((prev) => ({
          ...prev,
          [String(result.toiletId)]: (prev[String(result.toiletId)] || 0) + 1,
        }));
        // setTargetForVisit(null); // HealthLogModal에서 성공 화면을 보여주므로 여기서 닫지 않음
        // alert('방문 인증이 완료되었습니다! 💩✨');
      } catch (e: any) {
        const code = e.code || 'UNKNOWN';
        const errorMsg = e.message || (typeof e === 'string' ? e : JSON.stringify(e));
        
        switch (code) {
          case 'R007':
            throw e; // VisitModal에서 카메라 복귀 처리
          case 'R005': // STAY_TIME_NOT_MET
            alert('⏳ 아직 1분이 지나지 않았습니다. 잠시 후 다시 시도해주세요!');
            break;
          case 'R001': // LOCATION_OUT_OF_RANGE
          case 'R006': // OUT_OF_RANGE
            alert('📍 화장실 근처(150m 이내)에서만 인증이 가능합니다.');
            break;
          case 'R003': // AI_SERVICE_ERROR
            alert('🤖 AI 분석 서비스에 일시적 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
            break;
          default:
            console.error('인증 실패:', e);
            alert(`인증 오류: ${errorMsg}\n\n(문제가 지속되면 고객센터로 문의해주세요.)`);
        }
      }
    },
    [markVisited, pos, refreshUser],
  );

  // visitCount 병합
  const toiletsWithVisitCount = toilets.map((t) => ({
    ...t,
    visitCount: visitCounts[t.id] || 0,
  }));

  // 검색어가 있으면 ES 결과 사용, 없으면 지도 반경 내 화장실에 필터만 적용
  const filteredToilets =
    searchQuery.trim() !== ''
      ? searchResults
      : toiletsWithVisitCount.filter((t) =>
          filter === 'all'
            ? true
            : filter === 'favorite'
              ? t.isFavorite
              : filter === 'visited'
                ? t.isVisited
                : true,
        );

  return (
    <div className="relative h-screen flex flex-col" style={{ background: '#F2F7F4' }}>
      <Navbar openAuth={openAuth} />
      <div className="flex-1 relative overflow-hidden">
        <MapView
          ref={mapViewRef}
          toilets={filteredToilets}
          pos={pos}
          onSelectToilet={handleSelectToilet}
          onBoundsChange={setBounds}
          onLevelChange={setMapLevel}
        />

        <ToiletSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filter={filter}
          onFilterChange={setFilter}
        />

        {/* 검색 결과 목록 */}
        <AnimatePresence>
          {searchQuery.trim() !== '' && (searchLoading || filteredToilets.length > 0) && (
            <m.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-[220px] md:top-[200px] left-1/2 -translate-x-1/2 z-20 w-full px-4"
              style={{ maxWidth: '600px' }}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl overflow-hidden"
                style={{ maxHeight: '400px', border: '1.5px solid rgba(27,67,50,0.1)' }}
              >
                <div className="p-4 border-b border-gray-100">
                  <p className="text-sm font-bold text-[#1B4332]">
                    {searchLoading ? '검색 중...' : `검색 결과 ${filteredToilets.length}개`}
                  </p>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
                  {filteredToilets.slice(0, 10).map((toilet) => (
                    <button
                      key={toilet.id}
                      onClick={() => {
                        handleSelectToilet(toilet);
                        mapViewRef.current?.panTo(toilet.lat, toilet.lng);
                        setSearchQuery(''); // 검색어 초기화
                      }}
                      className="w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0">🚽</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#1A2B27] mb-1 truncate">{toilet.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {toilet.roadAddress || toilet.jibunAddress}
                          </p>
                          {pos && (
                            <p className="text-xs text-[#7a9e8a] mt-1">
                              내 위치에서{' '}
                              {Math.round(
                                calculateDistance(pos.lat, pos.lng, toilet.lat, toilet.lng),
                              )}
                              m
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        <div
          className="absolute right-4 z-[30]"
          style={{ bottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))' }}
        >
          <button
            onClick={() => {
              if (localStorage.getItem('location_consented') !== 'true') {
                window.dispatchEvent(new Event('forceLocationConsent'));
              }
              mapViewRef.current?.panTo(pos.lat, pos.lng);
            }}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-lg active:scale-95 transition-transform"
          >
            <LocateFixed size={20} style={{ color: '#1B4332' }} />
          </button>
        </div>

        <AnimatePresence>
          {selectedToilet && pos && (
            <div className="absolute inset-0 z-[1001] pointer-events-none flex items-end sm:items-center justify-center">
              <div className="pointer-events-auto w-full sm:w-auto px-4 mb-12 sm:m-0">
                <ToiletPopup
                  toilet={selectedToilet}
                  onClose={() => handleSelectToilet(null)}
                  onFavoriteToggle={handleFavoriteToggle}
                  onVisitRequest={handleVisitRequest}
                  userPosition={pos}
                  distanceInMeters={calculateDistance(
                    pos.lat,
                    pos.lng,
                    selectedToilet.lat,
                    selectedToilet.lng,
                  )}
                  openAuth={openAuth}
                  onReviewUpdate={refetch}
                />
              </div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {targetForVisit && (
            <VisitModal
              toilet={targetForVisit}
              onClose={() => setTargetForVisit(null)}
              onComplete={handleVisitComplete}
              checkInTime={checkInTime}
            />
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes mypulse {
          0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          70%  { box-shadow: 0 0 0 14px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
      `}</style>
    </div>
  );
}
