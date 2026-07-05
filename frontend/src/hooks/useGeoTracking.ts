import { useState, useEffect, useRef } from 'react';
import { getDistance } from '../utils/geoUtils';
import { ToiletData } from '../types/toilet';
import { api } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

interface GeoPosition {
  lat: number;
  lng: number;
}

const DEFAULT_POS: GeoPosition = { lat: 37.5172, lng: 127.0473 };

/**
 * 전역 위치 트래킹 및 자동 체크인(Fast Check-in) 훅
 *
 * iOS Safari 호환성 설계:
 * - navigator.permissions.query는 iOS Safari에서 미지원 → catch 블록에서 직접 watchPosition 시도
 * - localStorage 플래그('location_consented')는 UX 흐름 제어용이며, 브라우저 실제 권한이 최우선
 * - 커스텀 모달을 이미 본 사용자(location_prompted=true)는 localStorage 플래그와 무관하게 추적 시도
 */
export function useGeoTracking(
  toilets: ToiletData[],
  onAutoCheckIn?: (remainedSeconds: number) => void,
  isEnabled: boolean = true
) {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [granted, setGranted] = useState(false);
  const lastCheckInRef = useRef<Map<string, number>>(new Map());
  const toiletsRef = useRef(toilets);
  const { refreshUser } = useAuth();

  useEffect(() => {
    toiletsRef.current = toilets;
  }, [toilets]);

  useEffect(() => {
    // isEnabled가 false면 위치 추적 안함
    if (!isEnabled || !navigator.geolocation) return;

    let watchId: number | null = null;
    let permissionStatus: PermissionStatus | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    // ── 실제 위치 추적 시작 ─────────────────────────────────────
    const startWatching = () => {
      if (watchId !== null) return; // Already watching

      watchId = navigator.geolocation.watchPosition(
        (p) => {
          const newPos = { lat: p.coords.latitude, lng: p.coords.longitude };
          setPosition(newPos);
          setGranted(true);

          // 위치 추적 성공 시 localStorage 동기화 (다음 방문 시 즉시 시작되도록)
          if (localStorage.getItem('location_consented') !== 'true') {
            localStorage.setItem('location_consented', 'true');
            localStorage.setItem('location_prompted', 'true');
          }

          const isLogged = !!(localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken'));
          if (!isLogged) return;

          toiletsRef.current.forEach((toilet) => {
            const dist = getDistance(newPos.lat, newPos.lng, toilet.lat, toilet.lng);
            if (dist <= 150) {
              const now = Date.now();
              const lastTime = lastCheckInRef.current.get(toilet.id) || 0;
              if (now - lastTime > 120000) {
                lastCheckInRef.current.set(toilet.id, now);
                console.log(`[Fast Check-in] ${toilet.name} 진입 감지 (${Math.round(dist)}m). 체크인 핑 전송.`);

                api.post('/records/check-in', {
                  toiletId: Number(toilet.id),
                  latitude: newPos.lat,
                  longitude: newPos.lng
                })
                .then(async (res: any) => {
                  await refreshUser();
                  if (onAutoCheckIn && res && typeof res.remainedSeconds === 'number') {
                    onAutoCheckIn(res.remainedSeconds);
                  }
                })
                .catch(err => {
                  console.warn('[Fast Check-in] 체크인 API 호출 실패:', err.message);
                });
              }
            }
          });
        },
        (err) => {
          console.error('[GeoTracking] 위치 추적 실패:', err);
          setGranted(false);
          // functional update로 stale closure 방지
          setPosition(prev => prev ?? DEFAULT_POS);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    // ── 권한 상태 확인 후 추적 시작 ─────────────────────────────
    const initTracking = async () => {
      if ('permissions' in navigator) {
        try {
          permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });

          if (permissionStatus.state === 'granted') {
            startWatching();
          } else if (permissionStatus.state === 'denied') {
            // 권한 거부 상태 → fallback 좌표 즉시 설정
            setGranted(false);
            setPosition(prev => prev ?? DEFAULT_POS);
          } else {
            // 'prompt' 상태 → onchange 대기하되, iOS에서 onchange 미발화 대비 안전 타임아웃
            fallbackTimer = setTimeout(() => {
              if (watchId === null) startWatching();
            }, 5000);
          }

          permissionStatus.onchange = () => {
            console.log('[GeoTracking] Permission state changed:', permissionStatus?.state);
            if (permissionStatus?.state === 'granted') {
              if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
              startWatching();
            } else if (permissionStatus?.state === 'denied') {
              if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
              if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
              }
              setGranted(false);
              setPosition(prev => prev ?? DEFAULT_POS);
            }
          };
        } catch (e) {
          // iOS Safari 등 permissions.query 미지원 → watchPosition으로 직접 시도
          console.warn('[GeoTracking] Permissions API 미지원, 직접 위치 추적 시도');
          startWatching();
        }
      } else {
        // Fallback for Safari/Legacy
        startWatching();
      }
    };

    // ── 추적 시작 결정 로직 (3-Case) ────────────────────────────
    const hasConsented = localStorage.getItem('location_consented') === 'true';
    const hasBeenPrompted = localStorage.getItem('location_prompted') === 'true';

    if (hasConsented) {
      // Case 1: 사용자가 커스텀 모달에서 명시적으로 동의하고 OS 프롬프트도 허용한 이력
      // → 즉시 추적 시작
      initTracking();

    } else if (hasBeenPrompted) {
      // Case 2: 커스텀 모달은 봤지만 동의하지 않았거나, OS 프롬프트를 거부한 경우
      // → 브라우저의 실제 권한 상태를 확인하여, 가능하면 추적 시작
      //   (iOS Safari에서는 permissions.query 미지원이므로 catch에서 직접 시도)
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'geolocation' as PermissionName })
          .then((perm) => {
            if (perm.state === 'granted') {
              // 브라우저가 이미 위치를 허용한 상태 → localStorage 동기화 후 추적 시작
              localStorage.setItem('location_consented', 'true');
              initTracking();
            } else {
              // 미허용(denied 또는 prompt) → 폴백 좌표만 설정
              setPosition(prev => prev ?? DEFAULT_POS);
            }
          })
          .catch(() => {
            // iOS Safari: permissions.query 미지원
            // → initTracking 직접 호출 (이미 권한이 있으면 프롬프트 없이 작동)
            initTracking();
          });
      } else {
        // permissions API 자체가 없는 브라우저 → 직접 시도
        initTracking();
      }

    } else {
      // Case 3: 아직 커스텀 모달도 안 뜬 완전 첫 방문 상태
      // → 폴백 좌표만 설정하고, LocationConsentBanner가 뜨기를 대기
      setPosition(prev => prev ?? DEFAULT_POS);
    }

    // LocationConsentBanner에서 동의 이벤트를 발생시키면 Tracking 시작
    const onLocationConsented = () => {
      initTracking();
    };

    window.addEventListener('locationConsented', onLocationConsented);

    return () => {
      window.removeEventListener('locationConsented', onLocationConsented);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (permissionStatus) permissionStatus.onchange = null;
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [isEnabled, refreshUser]); // toilets 제거: toiletsRef를 통해 실시간 참조하므로 불필요한 watch 재시작 방지

  return { position, granted };
}
