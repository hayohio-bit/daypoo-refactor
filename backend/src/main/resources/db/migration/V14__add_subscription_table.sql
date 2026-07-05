-- 구독 관리 테이블 생성 (V14 리팩토링 버전)
CREATE TABLE subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    plan VARCHAR(20) NOT NULL,       -- BASIC, PRO, PREMIUM
    status VARCHAR(20) NOT NULL,     -- ACTIVE, CANCELLED, EXPIRED
    billing_cycle VARCHAR(20),       -- MONTHLY, YEARLY
    is_auto_renewal BOOLEAN NOT NULL DEFAULT TRUE,
    start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    last_payment_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subscription_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_subscription_last_payment FOREIGN KEY (last_payment_id) REFERENCES payments(id) ON DELETE SET NULL
);

CREATE INDEX idx_subscription_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscription_status ON subscriptions(status);
