-- V16__add_health_report_snapshots.sql
CREATE TABLE health_report_snapshots (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    report_type     VARCHAR(20) NOT NULL,  -- DAILY, WEEKLY, MONTHLY
    health_score    INT NOT NULL,
    summary         TEXT NOT NULL,
    solution        TEXT,
    insights        TEXT,                  -- JSON 문자열
    record_count    INT NOT NULL,          -- 분석에 사용된 기록 수
    period_start    TIMESTAMP NOT NULL,
    period_end      TIMESTAMP NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_snapshot_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_report_snapshots_user_type ON health_report_snapshots(user_id, report_type, created_at DESC);
