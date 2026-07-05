-- 봇 유저 식별 (BotUserPool 쿼리용)
CREATE INDEX IF NOT EXISTS idx_users_email_pattern ON users(email) WHERE email LIKE 'bot%@daypoo.sim';

-- 리뷰 통계 집계 최적화
CREATE INDEX IF NOT EXISTS idx_reviews_toilet_rating ON toilet_reviews(toilet_id, rating);

-- 지역별 집계 (랭킹, 리포트)
CREATE INDEX IF NOT EXISTS idx_poo_records_region ON poo_records(region_name);

-- 건강 리포트 커버링 인덱스
CREATE INDEX IF NOT EXISTS idx_poo_records_user_created_covering
  ON poo_records(user_id, created_at DESC)
  INCLUDE (bristol_scale, color, condition_tags, diet_tags, region_name);

-- 결제 날짜 범위 쿼리
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- 유저-화장실별 최신 기록 (쿨다운 검증 최적화)
CREATE INDEX IF NOT EXISTS idx_poo_records_user_toilet_created
  ON poo_records(user_id, toilet_id, created_at DESC);
