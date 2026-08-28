import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { toToiletData } from '../../services/toiletMapper';
import { ToiletPopup } from './ToiletPopup';

vi.mock('../../services/reviewService', () => ({
  getToiletReviewSummary: vi.fn().mockResolvedValue(null),
}));

/**
 * 실제 `GET /api/v1/toilets` 응답에서 그대로 가져온 항목이다.
 * 응답이 24시간 개방 여부를 `is24h` 로 내려준다는 점이 이 검증의 핵심이다.
 */
const apiItem = {
  id: 28204,
  name: '강남치매안심센터 공영노외',
  latitude: 37.510183,
  longitude: 127.046539,
  address: '서울특별시 선릉로108길 27',
  openHours: '상시',
  is24h: true,
  distance: 783.1375573,
};

const noop = () => {};

function renderPopup(isOpen24h: boolean) {
  const toilet = { ...toToiletData(apiItem), isOpen24h };
  render(
    <ToiletPopup
      toilet={toilet}
      onClose={noop}
      onFavoriteToggle={noop}
      onVisitRequest={noop}
      userPosition={{ lat: 37.5172, lng: 127.0473 }}
      distanceInMeters={783}
      openAuth={noop}
      onReviewUpdate={noop}
    />,
  );
}

describe('ToiletPopup 의 24시간 개방 배지', () => {
  it('반경 조회 응답의 is24h 가 참이면 24H 배지를 보여준다', () => {
    expect(toToiletData(apiItem).isOpen24h).toBe(true);

    renderPopup(true);

    expect(screen.getByText('24H')).toBeInTheDocument();
  });

  it('24시간 개방이 아니면 배지를 보여주지 않는다', () => {
    renderPopup(false);

    expect(screen.queryByText('24H')).not.toBeInTheDocument();
  });
});
