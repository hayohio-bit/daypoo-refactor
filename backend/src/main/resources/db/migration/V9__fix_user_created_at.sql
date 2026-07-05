-- V5: Fix user created_at timestamps
-- 기존 사용자 데이터의 created_at이 NULL이거나 통일되어 있는 문제 해결

-- created_at이 NULL인 사용자들에 대해 ID 기반으로 분산된 과거 날짜 설정
UPDATE users
SET created_at = CURRENT_TIMESTAMP - (id * INTERVAL '1 day')
WHERE created_at IS NULL;

-- 만약 created_at이 모두 같은 날짜로 되어 있는 경우를 대비하여
-- 생성일이 수정일과 동일한 경우(초기 데이터) ID 기반으로 재설정
UPDATE users
SET created_at = CURRENT_TIMESTAMP - (id * INTERVAL '1 day')
WHERE created_at = updated_at
  AND created_at < CURRENT_TIMESTAMP - INTERVAL '1 hour';