import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useToilets } from '../hooks/useToilets';
import { EmergencySheetPreview } from './EmergencySheetPreview';

interface EmergencySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    kakao: any;
  }
}

// 거리 계산 유틸리티 (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // 지구 반지름 (m)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// 도보 시간 계산 (평균 4.5km/h -> 1px/s 약 75m/min)
const calculateWalkTime = (meters: number) => {
  const minutes = Math.ceil(meters / 75);
  return minutes < 1 ? '1분 미만' : `${minutes}분`;
};

function MiniMap({ userPos, toilets }: { userPos: { lat: number; lng: number } | null, toilets: any[] }) {
  const miniMapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[MiniMap] useEffect triggered', {
      hasKakao: !!window.kakao,
      hasRef: !!miniMapRef.current,
      hasUserPos: !!userPos,
      toiletsCount: toilets.length
    });

    if (!window.kakao) {
      const error = 'Kakao Maps API가 로드되지 않았습니다';
      console.error('[MiniMap]', error);
      setMapError(error);
      return;
    }

    if (!miniMapRef.current) {
      console.log('[MiniMap] Map ref not ready yet');
      return;
    }

    if (!userPos) {
      console.log('[MiniMap] User position not available yet');
      return;
    }

    console.log('[MiniMap] Calling kakao.maps.load()');
    try {
      window.kakao.maps.load(() => {
        console.log('[MiniMap] kakao.maps.load() callback executed');
        if (miniMapRef.current) miniMapRef.current.innerHTML = '';

        const center = new window.kakao.maps.LatLng(userPos.lat, userPos.lng);
        console.log('[MiniMap] Creating map at:', userPos);
        const map = new window.kakao.maps.Map(miniMapRef.current, {
          center,
          level: 3,
          draggable: false,
          scrollwheel: false,
        });
        mapInstance.current = map;
        setMapError(null);
        console.log('[MiniMap] Map created successfully');

      // 현재 위치 (파란 원)
      new window.kakao.maps.CustomOverlay({
        position: center,
        content: `<div style="
          width:14px;height:14px;border-radius:50%;
          background:#3B82F6;border:2.5px solid white;
          box-shadow:0 0 0 4px rgba(59,130,246,0.25);
        "></div>`,
        zIndex: 10,
      }).setMap(map);

      // 화장실 마커들 (최대 3개)
      console.log('[MiniMap] Adding toilet markers, count:', Math.min(toilets.length, 3));
      toilets.slice(0, 3).forEach((t, i) => {
        const RANK_COLORS = ['#E85D5D', '#E8A838', '#2D6A4F'];
        const pos = new window.kakao.maps.LatLng(t.lat, t.lng);
        console.log(`[MiniMap] Adding marker ${i + 1} at:`, t.lat, t.lng);
        new window.kakao.maps.CustomOverlay({
          position: pos,
          content: `<div style="
            background:${RANK_COLORS[i]};
            color:white;
            border-radius:50%;
            width:24px;height:24px;
            display:flex;align-items:center;justify-content:center;
            font-size:11px;font-weight:900;
            border:2px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
          ">${i + 1}</div>`,
          zIndex: 5,
        }).setMap(map);
      });

      // 마커들이 다 보이도록 범위 재설정
      if (toilets.length > 0) {
        const bounds = new window.kakao.maps.LatLngBounds();
        bounds.extend(center);
        toilets.slice(0, 3).forEach(t => bounds.extend(new window.kakao.maps.LatLng(t.lat, t.lng)));
        map.setBounds(bounds, 40); // 40px padding
      }
      });
    } catch (e) {
      console.error('[MiniMap] Error:', e);
      setMapError('지도를 불러오는 중 오류가 발생했습니다.');
    }
  }, [userPos, toilets]);

  return (
    <div
      ref={miniMapRef}
      style={{
        width: '100%',
        height: '180px',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '2px solid rgba(82,183,136,0.3)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(82,183,136,0.1)'
      }}
    />
  );
}

export function EmergencySheet({ isOpen, onClose }: EmergencySheetProps) {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  // 현재 위치 가져오기
  useEffect(() => {
    console.log('[EmergencySheet] isOpen changed:', isOpen);
    if (isOpen) {
      console.log('[EmergencySheet] Getting user position...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log('[EmergencySheet] User position obtained:', pos.coords.latitude, pos.coords.longitude);
          setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (error) => {
          console.log('[EmergencySheet] Geolocation error, using default:', error);
          setUserPos({ lat: 37.5666, lng: 126.9784 }); // 서울 시청 기본값
        }
      );
    }
  }, [isOpen]);

  // 실시간 데이터 가져오기 (반경 1km)
  const { toilets, loading, error } = useToilets({
    lat: userPos?.lat || 37.5666,
    lng: userPos?.lng || 126.9784,
    radius: 1000,
  });

  useEffect(() => {
    console.log('[EmergencySheet] Toilets data updated:', {
      count: toilets.length,
      loading,
      error,
      userPos
    });
  }, [toilets, loading, error, userPos]);

  // 급똥 우선순위에 따른 정렬 및 가공
  const processedToilets = useMemo(() => {
    if (!userPos || !toilets) return [];

    return toilets
      .map(t => ({
        ...t,
        distanceMeters: calculateDistance(userPos.lat, userPos.lng, t.lat, t.lng)
      }))
      .sort((a, b) => {
        // 급똥 상황에서는 무조건 가까운 곳 우선!
        return a.distanceMeters - b.distanceMeters;
      })
      .slice(0, 5) // 상위 5개만 노출
      .map((t, index) => ({
        ...t,
        rank: index + 1,
        distanceStr: t.distanceMeters >= 1000 
          ? `${(t.distanceMeters / 1000).toFixed(1)}km` 
          : `${t.distanceMeters}m`,
        timeStr: calculateWalkTime(t.distanceMeters)
      }));
  }, [userPos, toilets]);

  const openNav = (toilet: any) => {
    const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(toilet.name)},${toilet.lat},${toilet.lng}`;
    window.open(kakaoUrl, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 300,
              mass: 0.8
            }}
            className="fixed inset-0 z-[1001] flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-2xl rounded-[32px]"
              style={{
                background: 'linear-gradient(180deg, #1B4332 0%, #0D2820 100%)',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(82,183,136,0.3)',
                border: '2px solid rgba(82,183,136,0.3)'
              }}
            >
            <div className="w-full px-5 md:px-6 py-6 md:py-8 pb-12 text-white">
              <div className="w-12 h-1.5 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent rounded-full mx-auto mb-6" />

              <div className="max-w-sm mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                      style={{
                        backgroundColor: 'rgba(232,93,93,0.3)',
                        border: '1px solid rgba(232,93,93,0.4)'
                      }}
                    >
                      <AlertTriangle size={20} style={{ color: '#FF6B6B' }} />
                    </motion.div>
                    <div>
                      <h2 className="text-lg font-black text-white leading-tight tracking-tight">
                        지금 가장 가까운 곳
                      </h2>
                      <p className="text-emerald-300/60 text-[10px] mt-0.5 font-medium">실시간 개방 정보</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* ── 실시간 미니맵 ── */}
                <div className="relative">
                  <MiniMap userPos={userPos} toilets={processedToilets} />
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl backdrop-blur-sm" style={{ background: 'rgba(27,67,50,0.7)' }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-3xl">🚨</motion.div>
                    </div>
                  )}
                </div>
              </div>

              <div className="max-w-sm mx-auto">
                {/* ── 최적 경로 추천 부문 ── */}
                <EmergencySheetPreview
                  processedToilets={processedToilets as any}
                  openNav={openNav}
                />

                <p className="mt-6 text-center text-emerald-400/30 text-[10px] tracking-widest font-medium">
                  현재 위치 기반 실시간 데이터 분석 · 도보 이동 시간 기준 정렬
                </p>
              </div>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
