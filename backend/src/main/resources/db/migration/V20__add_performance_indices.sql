-- 화장실 리뷰 조회 성능을 위한 복합 인덱스 (화장실 ID + 생성일 역순)
CREATE INDEX idx_toilet_reviews_id_created_at ON toilet_reviews (toilet_id, created_at DESC);

-- 인벤토리 아이템 조회 및 장착 상태 필터링 성능을 위한 복합 인덱스 (유저 ID + 장착 여부)
CREATE INDEX idx_inventories_user_id_is_equipped ON inventories (user_id, is_equipped);
