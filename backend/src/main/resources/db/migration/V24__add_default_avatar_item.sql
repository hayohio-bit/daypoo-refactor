-- 0. 안전장치: system_settings 테이블이 없다면 먼저 생성하고, 기본 데이터 1줄을 넣어줍니다.
CREATE TABLE IF NOT EXISTS system_settings (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- 설정 테이블은 주로 단일 row(1줄)만 사용하므로, 데이터가 아예 없다면 빈 데이터 1줄을 생성합니다.
INSERT INTO system_settings (created_at, updated_at)
SELECT NOW(),
    NOW()
WHERE NOT EXISTS (
        SELECT 1
        FROM system_settings
    );
-- 1. 기본 아바타 아이템 등록 (상점 판매 아이템이 아닌 시스템 기본 아이템)
INSERT INTO items (
        name,
        description,
        type,
        price,
        image_url,
        created_at,
        updated_at
    )
VALUES (
        '기본 아바타',
        '모든 회원에게 기본 지급되는 프로필 아바타',
        'AVATAR',
        0,
        '/assets/default-avatar.svg',
        NOW(),
        NOW()
    );
-- 2. system_settings에 default_avatar_item_id 컬럼 추가
ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS default_avatar_item_id BIGINT;
-- 3. 방금 등록한 기본 아바타 아이템 ID를 system_settings에 세팅
UPDATE system_settings
SET default_avatar_item_id = (
        SELECT id
        FROM items
        WHERE name = '기본 아바타'
            AND type = 'AVATAR'
            AND price = 0
        LIMIT 1
    );
-- 4. 기존 유저 중 장착된 아바타가 없는 유저에게 기본 아바타 자동 지급 + 장착
INSERT INTO inventories (
        user_id,
        item_id,
        is_equipped,
        created_at,
        updated_at
    )
SELECT u.id,
    (
        SELECT id
        FROM items
        WHERE name = '기본 아바타'
            AND type = 'AVATAR'
            AND price = 0
        LIMIT 1
    ), TRUE,
    NOW(),
    NOW()
FROM users u
WHERE NOT EXISTS (
        SELECT 1
        FROM inventories inv
            JOIN items it ON inv.item_id = it.id
        WHERE inv.user_id = u.id
            AND inv.is_equipped = TRUE
            AND it.type = 'AVATAR'
    );