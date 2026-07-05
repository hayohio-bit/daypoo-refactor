-- Phase 1-4: DB 마이그레이션
-- TITLE 타입 items의 inventory 레코드 삭제 (칭호 중 인벤토리 방식으로 등록된 것들 정리)
DELETE FROM inventories 
WHERE item_id IN (SELECT id FROM items WHERE type = 'TITLE');

-- TITLE 타입 items 삭제 (이제 칭호는 별도의 Title 엔티티로 관리)
DELETE FROM items WHERE type = 'TITLE';
