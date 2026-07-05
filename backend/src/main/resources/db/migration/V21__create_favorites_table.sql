-- 즐겨찾기 테이블 생성
CREATE TABLE IF NOT EXISTS favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    toilet_id BIGINT NOT NULL REFERENCES toilets(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_favorite_user_toilet UNIQUE (user_id, toilet_id)
);

-- 유저별 즐겨찾기 조회 성능을 위한 인덱스
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
