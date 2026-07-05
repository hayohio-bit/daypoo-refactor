CREATE TABLE IF NOT EXISTS system_log (
    id BIGSERIAL PRIMARY KEY,
    level VARCHAR(10) NOT NULL,
    source VARCHAR(50) NOT NULL,
    message VARCHAR(500) NOT NULL,
    created_at TIMESTAMP
);
