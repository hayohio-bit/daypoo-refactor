-- ddl-auto: update가 몰래 추가해온 mng_no 컬럼을 Flyway로 정식 관리
ALTER TABLE toilets ADD COLUMN IF NOT EXISTS mng_no VARCHAR(100);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_toilets_mng_no'
    ) THEN
        ALTER TABLE toilets ADD CONSTRAINT uk_toilets_mng_no UNIQUE (mng_no);
    END IF;
END $$;

-- location NOT NULL 제약 해제 (공공데이터 중 좌표 없는 화장실 대응)
ALTER TABLE toilets ALTER COLUMN location DROP NOT NULL;
