-- V18__update_user_role_check_constraint.sql
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ROLE_USER', 'ROLE_PRO', 'ROLE_PREMIUM', 'ROLE_ADMIN'));
