import type { ToiletData } from '../types/toilet';

/**
 * 백엔드 화장실 응답 항목.
 *
 * 반경 조회(`GET /toilets`)는 `ToiletResponse` 를, 텍스트 검색(`GET /toilets/search`)은
 * `ToiletSearchResultResponse` 를 돌려준다. 후자에는 개방 시간 관련 필드가 없으므로
 * `openHours` 와 `is24h` 를 선택 속성으로 두어 두 응답을 하나의 타입으로 받는다.
 */
export interface ToiletApiItem {
  id: number | string;
  name?: string;
  address?: string;
  latitude: number;
  longitude: number;
  openHours?: string;
  is24h?: boolean;
  distance?: number;
}

export interface ToiletDataFlags {
  /** 방문 인증한 화장실 id 집합 */
  visitedIds?: ReadonlySet<string>;
  /** 즐겨찾기한 화장실 id 집합 */
  favoriteIds?: ReadonlySet<string>;
}

/**
 * 백엔드 응답 항목을 화면용 `ToiletData` 로 변환한다.
 *
 * 이 변환이 세 곳(`ToiletContext` 의 반경 조회, `MapPage` 의 텍스트 검색과 최근접 화장실 열기)에
 * 흩어져 있으면서 24시간 개방 필드를 서로 다른 이름으로 읽어 값이 어긋났기 때문에 한곳으로 모았다.
 */
export function toToiletData(
  item: ToiletApiItem,
  { visitedIds, favoriteIds }: ToiletDataFlags = {},
): ToiletData {
  const id = String(item.id);
  return {
    id,
    name: item.name || '이름없음',
    roadAddress: item.address || '',
    lat: item.latitude,
    lng: item.longitude,
    openTime: item.openHours,
    isOpen24h: item.is24h ?? false,
    isVisited: visitedIds?.has(id) ?? false,
    isFavorite: favoriteIds?.has(id) ?? false,
    // 아래 편의 시설 항목은 두 응답 어디에도 없어 항상 false 로 채운다.
    // 백엔드가 필드를 추가하면 이 함수만 고치면 된다.
    isMixedGender: false,
    hasDiaperTable: false,
    hasEmergencyBell: false,
    hasCCTV: false,
  };
}
