-- user_titles 테이블에 BaseTimeEntity 필드 추가 및 컬럼 정리
ALTER TABLE user_titles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_titles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 기존 acquired_at 데이터를 created_at으로 복사 (만약 존재한다면)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_titles' AND column_name='acquired_at') THEN
        UPDATE user_titles SET created_at = acquired_at WHERE created_at IS NULL;
        -- ALTER TABLE user_titles DROP COLUMN IF EXISTS acquired_at;
    END IF;
END $$;
