import React, {
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
  memo,
} from 'react';
import { ToiletData } from '../../types/toilet';

declare global {
  interface Window {
    setSelectedToiletByIdGlobal?: (id: string) => void;
  }
}

interface MapViewProps {
  toilets: ToiletData[];
  pos: { lat: number; lng: number };
  onSelectToilet: (toilet: ToiletData) => void;
  onBoundsChange: (bounds: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
    timestamp: number;
  }) => void;
  onLevelChange: (level: number) => void;
}

export interface MapViewHandle {
  panTo: (lat: number, lng: number) => void;
}

// ── 카카오맵 마커 생성 헬퍼 ─────────────────────────────────────────
function createToiletMarker(kakao: any, toilet: ToiletData) {
  const emoji = toilet.isVisited ? '💩' : '🚻';
  const markerBg = toilet.isVisited ? '#1B4332' : '#8a9a8a';

  // H8: JSON.stringify 대신 ID만 전달하여 XSS 방지
  const content = `
    <div onclick="window.setSelectedToiletByIdGlobal('${toilet.id}')" style="
      position:relative;
      display:flex;flex-direction:column;align-items:center;
      cursor:pointer;
      width:36px; height:44px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    ">
      <div style="
        width:36px;height:36px;border-radius:50%;
        background:${markerBg};
        display:flex;align-items:center;justify-content:center;
        font-size:18px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15), 0 0 0 0.5px rgba(0,0,0,0.05);
        border:2.5px solid #fff;
        backface-visibility: hidden;
      ">${emoji}</div>
      <div style="
        width:0;height:0;
        border-left:6px solid transparent;
        border-right:6px solid transparent;
        border-top:8px solid ${markerBg};
        margin-top:-1px;
        filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));
      "></div>
    </div>`;

  const marker = new kakao.maps.Marker({
    position: new kakao.maps.LatLng(toilet.lat, toilet.lng),
    zIndex: toilet.isVisited ? 5 : 3,
    image: new kakao.maps.MarkerImage(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      new kakao.maps.Size(1, 1),
    ),
  });

  const overlay = new kakao.maps.CustomOverlay({
    content,
    position: marker.getPosition(),
    yAnchor: 1.15,
    zIndex: toilet.isVisited ? 5 : 3,
    clickable: true,
  });

  return { marker, overlay };
}

export const MapView = memo(
  forwardRef<MapViewHandle, MapViewProps>(
    ({ toilets, pos, onSelectToilet, onBoundsChange, onLevelChange }, ref) => {
      const mapContainerRef = useRef<HTMLDivElement>(null);
      const mapRef = useRef<any>(null);
      const clustererRef = useRef<any>(null);
      const markersRef = useRef<Map<string, { marker: any; overlay: any }>>(new Map());
      const myOverlayRef = useRef<any>(null);

      useImperativeHandle(ref, () => ({
        panTo: (lat: number, lng: number) => {
          if (mapRef.current) {
            mapRef.current.panTo(new window.kakao.maps.LatLng(lat, lng));
          }
        },
      }));

      const updateBounds = useCallback(() => {
        if (!mapRef.current) return;
        const b = mapRef.current.getBounds();
        const sw = b.getSouthWest();
        const ne = b.getNorthEast();
        const level = mapRef.current.getLevel();

        onLevelChange(level);
        onBoundsChange({
          swLat: sw.getLat(),
          swLng: sw.getLng(),
          neLat: ne.getLat(),
          neLng: ne.getLng(),
          timestamp: Date.now(),
        });
      }, [onBoundsChange, onLevelChange]);

      const updateMarkersVisibility = useCallback(() => {
        if (!mapRef.current) return;
        const level = mapRef.current.getLevel();
        markersRef.current.forEach((item) => {
          if (level >= 5) item.overlay.setMap(null);
          else item.overlay.setMap(mapRef.current);
        });
      }, []);

      useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        let retryCount = 0;
        const MAX_SDK_RETRIES = 100; // 100 * 100ms = 최대 10초 대기

        const initMap = () => {
          if (!window.kakao?.maps) {
            if (retryCount++ >= MAX_SDK_RETRIES) {
              // SDK 로드 실패 (네트워크 오류, iOS PWA 등) — 무한 루프 방지
              console.error('[MapView] Kakao Maps SDK 로드 타임아웃. 네트워크 연결을 확인해 주세요.');
              return;
            }
            setTimeout(initMap, 100);
            return;
          }

          window.kakao.maps.load(() => {
            if (!mapContainerRef.current) return;

            const center = new window.kakao.maps.LatLng(pos.lat, pos.lng);
            const map = new window.kakao.maps.Map(mapContainerRef.current, {
              center,
              level: 4,
              draggable: true,
              scrollwheel: true,
            });

            map.setDraggable(true);
            map.setZoomable(true);
            mapRef.current = map;

            const clusterer = new window.kakao.maps.MarkerClusterer({
              map,
              averageCenter: true,
              minLevel: 5,
              gridSize: 70,
              styles: [
                {
                  width: '60px',
                  height: '60px',
                  background: 'rgba(27, 67, 50, 0.9)',
                  borderRadius: '50%',
                  color: '#fff',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  lineHeight: '60px',
                  border: '3px solid rgba(255,255,255,0.8)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                  fontSize: '16px',
                },
              ],
            });
            clustererRef.current = clusterer;

            window.kakao.maps.event.addListener(map, 'idle', updateBounds);
            window.kakao.maps.event.addListener(map, 'zoom_changed', updateMarkersVisibility);

            window.kakao.maps.event.addListener(map, 'tilesloaded', () => {
              map.setDraggable(true);
              map.setZoomable(true);
            });

            updateBounds();

            requestAnimationFrame(() => {
              setTimeout(() => {
                if (mapRef.current) {
                  mapRef.current.relayout();
                  mapRef.current.setDraggable(true);
                  mapRef.current.setZoomable(true);
                }
              }, 100);
            });

            const myOverlay = new window.kakao.maps.CustomOverlay({
              position: center,
              content: `
              <div style="display:flex;flex-direction:column;align-items:center;">
                <div style="
                  width:40px;height:40px;border-radius:50%;
                  background:linear-gradient(135deg,#3B82F6,#60a5fa);
                  display:flex;align-items:center;justify-content:center;
                  font-size:22px;
                  box-shadow:0 0 0 4px rgba(59,130,246,0.25),0 4px 14px rgba(59,130,246,0.4);
                  border:2.5px solid #fff;
                  animation:mypulse 2s infinite;
                ">🧑</div>
              </div>`,
              zIndex: 10,
            });
            myOverlay.setMap(map);
            myOverlayRef.current = myOverlay;
          });
        };

        initMap();

        return () => {
          delete window.setSelectedToiletByIdGlobal;
        };
      }, []);

      useEffect(() => {
        if (!mapRef.current || !pos || !myOverlayRef.current) return;
        const center = new window.kakao.maps.LatLng(pos.lat, pos.lng);
        myOverlayRef.current.setPosition(center);
      }, [pos]);

      useEffect(() => {
        if (!mapRef.current || !clustererRef.current) return;

        // H8: ID로 화장실을 선택하는 안전한 전역 함수 등록
        window.setSelectedToiletByIdGlobal = (id: string) => {
          const toilet = toilets.find((t) => t.id === id);
          if (toilet) onSelectToilet(toilet);
        };

        const level = mapRef.current.getLevel();
        const currentToiletsIds = new Set(toilets.map((t) => t.id));

        // 제거할 마커 식별
        const toRemoveMarkers: any[] = [];
        markersRef.current.forEach((item, id) => {
          if (!currentToiletsIds.has(id)) {
            item.overlay.setMap(null);
            toRemoveMarkers.push(item.marker);
            markersRef.current.delete(id);
          }
        });

        if (toRemoveMarkers.length > 0) {
          clustererRef.current.removeMarkers(toRemoveMarkers);
        }

        // 추가 또는 갱신할 마커 식별
        const newMarkers: any[] = [];
        const currentLevel = mapRef.current.getLevel();

        toilets.forEach((toilet) => {
          const existing = markersRef.current.get(toilet.id);

          if (existing) {
            // 마커 내용물(이모지)이 현재 상태와 맞는지 확인 (💩 포함 여부 기준)
            const contentStr =
              typeof existing.overlay.getContent() === 'string'
                ? existing.overlay.getContent()
                : '';
            const wasVisited = contentStr.includes('💩');

            if (wasVisited !== toilet.isVisited) {
              // 상태가 변했다면 삭제 후 재생성 대상
              existing.overlay.setMap(null);
              clustererRef.current.removeMarker(existing.marker);
              markersRef.current.delete(toilet.id);
            } else {
              // 변경사항 없으면 스킵
              if (currentLevel < 5) existing.overlay.setMap(mapRef.current);
              return;
            }
          }

          // 새 마커 생성 (추가 또는 갱신된 경우)
          const { marker, overlay } = createToiletMarker(window.kakao, toilet);
          if (currentLevel < 5) overlay.setMap(mapRef.current);
          markersRef.current.set(toilet.id, { marker, overlay });
          newMarkers.push(marker);
        });

        if (newMarkers.length > 0) {
          clustererRef.current.addMarkers(newMarkers);
        }
        clustererRef.current.redraw();
      }, [toilets, onSelectToilet]);

      return (
        <div
          ref={mapContainerRef}
          className="w-full h-full relative z-0"
          style={{
            borderRadius: '0',
            willChange: 'transform',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            touchAction: 'pan-x pan-y pinch-zoom',
          }}
        />
      );
    },
  ),
);

MapView.displayName = 'MapView';
