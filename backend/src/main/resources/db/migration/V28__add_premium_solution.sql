-- health_report_snapshots 테이블에 premium_solution 컬럼 추가
ALTER TABLE health_report_snapshots
ADD COLUMN IF NOT EXISTS premium_solution TEXT;