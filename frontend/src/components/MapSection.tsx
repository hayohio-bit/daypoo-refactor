import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Maximize2, Navigation, Clock, Search, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { useToilets } from '../hooks/useToilets';
import { ToiletData } from '../types/toilet';

declare global {
  interface Window {
    kakao: any;
  }
}

export function MapSection() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const navigate = useNavigate();
  
  const [selectedToilet, setSelectedToilet] = useState<ToiletData | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5666, lng: 126.9784 });
  const [mapBounds, setMapBounds] = useState<any>(null);

  const { toilets, loading } = useToilets({
    lat: mapCenter.lat,
    lng: mapCenter.lng,
    radius: 1000,
    bounds: mapBounds
  });

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(overlay => overlay.setMap(null));
    markersRef.current = [];
  }, []);

  useEffect(() => {
    if (!window.kakao || !mapRef.current || mapInstance.current) return;

    window.kakao.maps.load(() => {
      if (!mapRef.current || mapInstance.current) return;
      mapRef.current.innerHTML = '';
      
      const initMap = (lat: number, lng: number) => {
        if (mapInstance.current) return;
        const center = new window.kakao.maps.LatLng(lat, lng);
        const map = new window.kakao.maps.Map(mapRef.current, {
          center,
          level: 4,
        });
        mapInstance.current = map;

        const currentOverlay = new window.kakao.maps.CustomOverlay({
          position: center,
          content: `
            <div style="position:relative;width:24px;height:24px;">
              <div style="position:absolute;inset:0;background:#3B82F6;opacity:0.2;border-radius:50%;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
              <div style="position:relative;width:12px;height:12px;margin:6px;background:#3B82F6;border:2.5px solid white;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.5);"></div>
            </div>`,
          zIndex: 10,
        });
        currentOverlay.setMap(map);

        window.kakao.maps.event.addListener(map, 'idle', () => {
          const bounds = map.getBounds();
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          setMapBounds({
            swLat: sw.getLat(), swLng: sw.getLng(),
            neLat: ne.getLat(), neLng: ne.getLng(),
          });
          const centerPos = map.getCenter();
          setMapCenter({ lat: centerPos.getLat(), lng: centerPos.getLng() });
        });
        setMapLoaded(true);
      };

      // We removed the automatic geolocation prompt to avoid double-pops
      // The map will start at Seoul and update once permission is granted via banner
      initMap(37.5666, 126.9784);
    });

    return () => { mapInstance.current = null; };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !toilets) return;
    clearMarkers();

    toilets.forEach((toilet) => {
      const pos = new window.kakao.maps.LatLng(toilet.lat, toilet.lng);
      const color = toilet.isOpen24h ? '#1B4332' : '#D4922A';
      const toiletIcon = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;">
          <path d="M7 21v-6m0-5V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5m0 5v6M4 11h16" />
        </svg>
      `;

      const overlay = new window.kakao.maps.CustomOverlay({
        position: pos,
        content: `
          <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;" id="marker-${toilet.id}">
            <div style="
              background:${color};
              color:white;
              border-radius:14px;
              padding:6px 12px;
              font-size:11px;
              font-weight:900;
              box-shadow:0 8px 20px rgba(0,0,0,0.18);
              white-space:nowrap;
              border:2px solid white;
              display:flex;
              align-items:center;
              transition:transform 0.2s ease;
            ">
              ${toiletIcon}
              <span>${toilet.isOpen24h ? '24H' : '운영중'}</span>
            </div>
            <div style="border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid ${color};margin-top:-1px;"></div>
          </div>`,
        yAnchor: 1.2,
        zIndex: 5,
      });

      overlay.setMap(mapInstance.current);
      markersRef.current.push(overlay);
      setTimeout(() => {
        const el = document.getElementById(`marker-${toilet.id}`);
        if (el) el.onclick = () => setSelectedToilet(toilet);
      }, 100);
    });
  }, [toilets, clearMarkers]);

  return (
    <section className="px-4 sm:px-6 md:px-12 pt-4 sm:pt-40 pb-20 sm:pb-56 relative overflow-hidden" style={{ background: '#F8FAF9' }}>
      {/* 배경 장식 원 */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#1B4332]/[0.02] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8 sm:mb-16 space-y-4 sm:space-y-6"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1B4332]/[0.05] border border-[#1B4332]/[0.1] shadow-sm">
              <MapPin size={14} className="text-[#1B4332]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">Local Explorer</span>
            </div>
            <h2 className="text-xl sm:text-4xl md:text-6xl font-black text-[#1A2B27] tracking-tight leading-[1.1]">
              내 주변 <span className="text-[#1B4332]">화장실 지도</span>
            </h2>
            <p className="text-[13px] sm:text-lg md:text-xl text-[#1A2B27]/50 max-w-2xl mx-auto leading-relaxed">
              지금 바로 당신 곁의 가장 쾌적한 공간을 확인하세요.<br className="hidden md:block" />
              <span className="font-bold text-[#1B4332]">실시간 데이터</span>를 기반으로 가장 가까운 대안을 제시합니다.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          {/* 지도 영역 (7/12) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, filter: 'blur(12px)' }}
            whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.4, margin: "-120px" }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="lg:col-span-8 relative group"
            style={{ 
              borderRadius: '32px', 
              overflow: 'hidden', 
              border: '1px solid rgba(26,43,39,0.08)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.08)' 
            }}
          >
            <div ref={mapRef} className="h-[450px] md:h-[580px] w-full" />
            
            {/* 데이터 로딩 표시 */}
            <AnimatePresence>
              {(loading || !mapLoaded) && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center z-20" 
                  style={{ backgroundColor: 'rgba(248, 250, 249, 0.7)', backdropFilter: 'blur(8px)' }}
                >
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} 
                    className="mb-4"
                  >
                    <Loader2 size={40} className="text-[#1B4332]" />
                  </motion.div>
                  <p className="text-sm font-bold text-[#1B4332]/60 animate-pulse">지도를 불러오고 있어요</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 지도 위 플로팅 범례 */}
            <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2">
              {[
                { label: '24시간 개방', color: '#1B4332' },
                { label: '현재 운영 중', color: '#D4922A' },
                { label: '내 위치', color: '#3B82F6' }
              ].map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                  key={item.label} 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-black/10 shadow-md text-[10px] font-black"
                  style={{ color: '#1A2B27' }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 목록 영역 (5/12) */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-full lg:h-[580px]">
            {/* 전체 지도 모드 버튼 (Compact) */}
            <motion.button
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/map')}
              className="group flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all shadow-md bg-[#1B4332] text-white hover:shadow-[#1B4332]/20"
            >
              전체 지도 모드 <Maximize2 size={14} className="group-hover:rotate-12 transition-transform" />
            </motion.button>

            {/* 상태 바 */}
            <div className="flex items-center justify-between px-2">
              <h4 className="text-sm font-black text-[#1A2B27]">근처 화장실 목록</h4>
              <span className="text-[10px] font-bold text-[#1B4332] px-2 py-1 rounded-lg bg-[#1B4332]/[0.05]">
                {toilets.length} Available
              </span>
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              <AnimatePresence mode="popLayout">
                {selectedToilet && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    className="p-6 rounded-[24px] shrink-0 relative overflow-hidden"
                    style={{ 
                      backgroundColor: '#fff', 
                      border: '2px solid #1B4332',
                      boxShadow: '0 12px 30px rgba(27,67,50,0.12)' 
                    }}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#1B4332]/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <h4 className="font-black text-xl text-[#1A2B27] mb-3 leading-tight">{selectedToilet.name}</h4>
                    <div className="flex flex-wrap gap-2 mb-5">
                      {selectedToilet.isOpen24h && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1B4332]/[0.08] text-[#1B4332] text-[10px] font-black uppercase">
                          <Clock size={10} /> Always Open
                        </div>
                      )}
                      <div className="w-full text-[11px] text-[#1A2B27]/40 font-medium leading-relaxed">
                        {selectedToilet.roadAddress || '상세 주소를 확인하려면 길찾기를 이용해 주세요.'}
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
                      style={{ backgroundColor: '#1B4332', color: 'white' }}
                      onClick={() => {
                        const url = `https://map.kakao.com/link/to/${selectedToilet.name},${selectedToilet.lat},${selectedToilet.lng}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <Navigation size={16} /> 길찾기 시작
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 스크롤 가능한 목록 */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                <AnimatePresence mode="popLayout">
                  {toilets.length === 0 && !loading ? (
                    <motion.div 
                      layout
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-48 text-center text-[#1A2B27]/30"
                    >
                      <Search size={32} className="mb-2 opacity-20" />
                      <p className="text-sm font-bold">주변 화장실이 없습니다</p>
                    </motion.div>
                  ) : (
                    toilets.slice(0, 15).map((toilet, i) => (
                      <motion.div
                        layout
                        key={toilet.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedToilet(toilet);
                          mapInstance.current?.setCenter(new window.kakao.maps.LatLng(toilet.lat, toilet.lng));
                        }}
                        className={`group p-4 rounded-2xl cursor-pointer transition-all border border-transparent ${i >= 3 ? 'hidden md:block' : ''}`}
                        style={{
                          backgroundColor: selectedToilet?.id === toilet.id ? '#1B4332' : 'white',
                          boxShadow: selectedToilet?.id === toilet.id ? '0 8px 20px rgba(27,67,50,0.15)' : '0 4px 12px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-lg"
                              style={{ backgroundColor: selectedToilet?.id === toilet.id ? 'rgba(255,255,255,0.1)' : '#f8faf9' }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: toilet.isOpen24h ? '#1B4332' : '#D4922A', filter: selectedToilet?.id === toilet.id ? 'brightness(2)' : 'none' }} />
                            </div>
                            <div className="overflow-hidden">
                              <h5 className={`font-black text-sm truncate transition-colors ${selectedToilet?.id === toilet.id ? 'text-white' : 'text-[#1A2B27]'}`}>
                                {toilet.name}
                              </h5>
                              <p className={`text-[10px] font-bold truncate transition-colors ${selectedToilet?.id === toilet.id ? 'text-white/60' : 'text-[#1A2B27]/30'}`}>
                                {toilet.roadAddress || '상세 주소 확인 불가'}
                              </p>
                            </div>
                          </div>
                          <ChevronRight size={14} className={`transition-transform group-hover:translate-x-1 ${selectedToilet?.id === toilet.id ? 'text-white/40' : 'text-[#1A2B27]/20'}`} />
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              <motion.button 
                whileHover={{ y: -2 }}
                onClick={() => navigate('/map')} 
                className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#1B4332] transition-all bg-white border border-[#1B4332]/[0.1] hover:bg-[#1B4332]/[0.02]"
              >
                + Explore More Toilets
              </motion.button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
