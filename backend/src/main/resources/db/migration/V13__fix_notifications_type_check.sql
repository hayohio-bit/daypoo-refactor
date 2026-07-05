-- notifications_type_check 제약조건에 ACHIEVEMENT 타입 추가
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('HEALTH', 'SOCIAL', 'SYSTEM', 'EMERGENCY', 'ACHIEVEMENT'));
