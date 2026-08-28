import { describe, expect, it } from 'vitest';
import { toToiletData } from './toiletMapper';

const nearbyItem = {
  id: 12,
  name: '서대문구청 공중화장실',
  address: '서울 서대문구 연희로 248',
  latitude: 37.5791,
  longitude: 126.9368,
  openHours: '상시개방',
  is24h: true,
  distance: 142.5,
};

describe('toToiletData', () => {
  it('반경 조회 응답의 개방 시간 필드를 화면용 이름으로 옮긴다', () => {
    const result = toToiletData(nearbyItem);

    expect(result.id).toBe('12');
    expect(result.roadAddress).toBe('서울 서대문구 연희로 248');
    expect(result.lat).toBe(37.5791);
    expect(result.lng).toBe(126.9368);
    expect(result.openTime).toBe('상시개방');
    expect(result.isOpen24h).toBe(true);
  });

  it('개방 시간 필드가 없는 텍스트 검색 응답은 24시간 개방이 아닌 것으로 다룬다', () => {
    const result = toToiletData({
      id: 34,
      name: '연희동 어린이공원 화장실',
      address: '서울 서대문구 연희동 188',
      latitude: 37.5712,
      longitude: 126.9291,
    });

    expect(result.isOpen24h).toBe(false);
    expect(result.openTime).toBeUndefined();
  });

  it('방문·즐겨찾기 집합에 담긴 id 를 표시한다', () => {
    const result = toToiletData(nearbyItem, {
      visitedIds: new Set(['12']),
      favoriteIds: new Set(['99']),
    });

    expect(result.isVisited).toBe(true);
    expect(result.isFavorite).toBe(false);
  });

  it('집합을 넘기지 않으면 방문·즐겨찾기를 모두 거짓으로 둔다', () => {
    const result = toToiletData(nearbyItem);

    expect(result.isVisited).toBe(false);
    expect(result.isFavorite).toBe(false);
  });

  it('이름과 주소가 비어 있으면 기본 문구로 채운다', () => {
    const result = toToiletData({ id: 7, latitude: 0, longitude: 0 });

    expect(result.name).toBe('이름없음');
    expect(result.roadAddress).toBe('');
  });
});
