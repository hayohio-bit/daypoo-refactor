-- V15__add_visit_logs.sql
CREATE TABLE visit_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    toilet_id       BIGINT NOT NULL,
    event_type      VARCHAR(20) NOT NULL,  -- CHECK_IN, RECORD_CREATED, VERIFICATION_FAILED
    arrival_at      TIMESTAMP,             -- 최초 도착 시각
    completed_at    TIMESTAMP,             -- 기록 완료 시각
    dwell_seconds   INT,                   -- 실제 체류 시간(초)
    user_latitude   DOUBLE PRECISION,      -- 사용자 GPS 위도
    user_longitude  DOUBLE PRECISION,      -- 사용자 GPS 경도
    distance_meters DOUBLE PRECISION,      -- 화장실까지 거리
    poo_record_id   BIGINT,                -- RECORD_CREATED 시 FK
    failure_reason  VARCHAR(50),           -- 실패 사유: OUT_OF_RANGE, STAY_TIME_NOT_MET
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_visit_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_visit_log_toilet FOREIGN KEY (toilet_id) REFERENCES toilets(id) ON DELETE CASCADE,
    CONSTRAINT fk_visit_log_record FOREIGN KEY (poo_record_id) REFERENCES poo_records(id) ON DELETE SET NULL
);

CREATE INDEX idx_visit_logs_user_created ON visit_logs(user_id, created_at DESC);
CREATE INDEX idx_visit_logs_event_type ON visit_logs(event_type, created_at DESC);
CREATE INDEX idx_visit_logs_toilet ON visit_logs(toilet_id, created_at DESC);
