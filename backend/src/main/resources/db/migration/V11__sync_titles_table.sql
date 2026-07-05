-- titles 테이블을 엔티티 구조에 맞게 최신화
ALTER TABLE titles ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
ALTER TABLE titles ADD COLUMN IF NOT EXISTS achievement_type VARCHAR(50) NOT NULL DEFAULT 'TOTAL_RECORDS';
ALTER TABLE titles ADD COLUMN IF NOT EXISTS achievement_threshold INTEGER NOT NULL DEFAULT 0;

-- 불필요한 구형 컬럼 제거 (선택 사항이나, 정합성을 위해 유지하거나 제거 가능)
-- ALTER TABLE titles DROP COLUMN IF EXISTS required_level;
-- ALTER TABLE titles DROP COLUMN IF EXISTS price;
