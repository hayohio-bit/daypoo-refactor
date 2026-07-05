-- V27: 배변 기록 테이블의 화장실 ID 제약 조건 완화
-- 목적: 화장실 방문 없이 사용자가 직접 건강 기록을 남길 수 있도록 지원
ALTER TABLE poo_records
ALTER COLUMN toilet_id DROP NOT NULL;