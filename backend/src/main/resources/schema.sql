-- Init PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    nickname VARCHAR(50) UNIQUE NOT NULL,
    equipped_title_id BIGINT,
    level INT DEFAULT 1,
    exp BIGINT DEFAULT 0,
    points BIGINT DEFAULT 0,
    role VARCHAR(20) DEFAULT 'ROLE_USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items (Shop catalog)
CREATE TABLE IF NOT EXISTS items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- EnumType.STRING (HEAD, HAND, BODY, etc.)
    price BIGINT NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory (User owned items)
CREATE TABLE IF NOT EXISTS inventories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Title items catalog
CREATE TABLE IF NOT EXISTS titles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    required_level INT DEFAULT 1,
    price BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User titles intersection (Inventory for titles)
CREATE TABLE IF NOT EXISTS user_titles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title_id BIGINT NOT NULL,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (title_id) REFERENCES titles(id)
);

-- Toilets (Public data & User Reports)
CREATE TABLE IF NOT EXISTS toilets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    location geometry(Point, 4326) NOT NULL, -- PostGIS Spatial type
    open_hours VARCHAR(100),
    is_24h BOOLEAN DEFAULT FALSE,
    is_unisex BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for fast geospatial queries
CREATE INDEX IF NOT EXISTS idx_toilets_location ON toilets USING GIST(location);

-- Poo Records (Authentication logs)
CREATE TABLE IF NOT EXISTS poo_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    toilet_id BIGINT NOT NULL,
    bristol_scale INT CHECK (bristol_scale BETWEEN 1 AND 7),
    color VARCHAR(20),
    condition_tags TEXT,
    diet_tags TEXT,
    region_name VARCHAR(50), -- Matching field name in PooRecord entity
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (toilet_id) REFERENCES toilets(id)
);

-- Payments (Toss Payments history)
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    user_id BIGINT NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    amount BIGINT NOT NULL,
    payment_key VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Notifications (User alerts)
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL, -- EnumType.STRING (ACHIEVEMENT, SYSTEM, etc.)
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    redirect_url VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Support Inquiries
CREATE TABLE IF NOT EXISTS inquiries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(1000) NOT NULL,
    content TEXT NOT NULL,
    answer TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indices for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- Pagination for user records
CREATE INDEX IF NOT EXISTS idx_poo_records_user_created ON poo_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poo_records_toilet ON poo_records(toilet_id);

-- Unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Payment history
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);

-- Inventory lookup
CREATE INDEX IF NOT EXISTS idx_inventories_user ON inventories(user_id, item_id);
