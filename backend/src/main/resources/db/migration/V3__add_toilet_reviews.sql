-- 화장실 리뷰 시스템 스키마 추가 (V3)
-- PostgreSQL 호환 고도화

-- 1. 화장실 리뷰 테이블 생성
CREATE TABLE IF NOT EXISTS toilet_reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    toilet_id BIGINT NOT NULL,
    rating INT NOT NULL,
    emoji_tags TEXT,
    comment TEXT,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_toilet FOREIGN KEY (toilet_id) REFERENCES toilets (id) ON DELETE CASCADE
);

-- 코멘트 추가 (PostgreSQL 방식)
COMMENT ON COLUMN toilet_reviews.rating IS '1-5 별점';
COMMENT ON COLUMN toilet_reviews.emoji_tags IS '이모지 태그 (쉼표 구분)';
COMMENT ON COLUMN toilet_reviews.helpful_count IS '도움됨 클릭 수';

-- 2. 화장실 테이블에 통계 및 AI 요약 컬럼 추가
ALTER TABLE toilets ADD COLUMN IF NOT EXISTS avg_rating DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE toilets ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;
ALTER TABLE toilets ADD COLUMN IF NOT EXISTS ai_summary TEXT;


-- 3. 검색 성능 향상을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_reviews_toilet_created ON toilet_reviews (toilet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON toilet_reviews (user_id);
