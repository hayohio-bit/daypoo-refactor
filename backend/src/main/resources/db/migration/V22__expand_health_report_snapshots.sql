-- V22__expand_health_report_snapshots.sql
ALTER TABLE health_report_snapshots 
    ADD COLUMN most_frequent_bristol  INT,
    ADD COLUMN most_frequent_condition VARCHAR(255),
    ADD COLUMN most_frequent_diet      VARCHAR(255),
    ADD COLUMN healthy_ratio           INT,
    ADD COLUMN weekly_health_scores    VARCHAR(255),
    ADD COLUMN improvement_trend       VARCHAR(255),
    ADD COLUMN bristol_distribution    TEXT,
    ADD COLUMN avg_daily_record_count  DOUBLE PRECISION;
