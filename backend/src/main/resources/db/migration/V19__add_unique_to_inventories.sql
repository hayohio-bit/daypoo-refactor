-- 중복 데이터 제거 (만약 존재할 경우, 가장 예전 데이터만 유지)
DELETE FROM inventories a
USING inventories b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.item_id = b.item_id;

-- (user_id, item_id) 복합 유니크 제약 조건 추가
ALTER TABLE inventories ADD CONSTRAINT uk_inventories_user_item UNIQUE (user_id, item_id);
