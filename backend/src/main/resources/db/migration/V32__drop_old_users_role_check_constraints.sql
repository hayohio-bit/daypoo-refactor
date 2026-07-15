-- V32__drop_old_users_role_check_constraints.sql
-- 기존의 중복/잘못된 제약 조건들을 삭제하고, ROLE_ADMIN이 포함된 올바른 제약 조건만 적용합니다.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check1;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check2;

ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ROLE_USER', 'ROLE_PRO', 'ROLE_PREMIUM', 'ROLE_ADMIN'));
