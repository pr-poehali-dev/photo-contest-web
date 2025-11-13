-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы активности (обновляется ежемесячно)
CREATE TABLE IF NOT EXISTS user_activity (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    activity_count INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE
);

-- Создание таблицы тем
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_order INTEGER NOT NULL
);

-- Вставка тем
INSERT INTO categories (name, display_order) VALUES
    ('природа', 1),
    ('город', 2),
    ('животные', 3),
    ('люди', 4),
    ('разное', 5)
ON CONFLICT (name) DO NOTHING;

-- Создание таблицы фотографий
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    category_id INTEGER NOT NULL REFERENCES categories(id),
    image_url TEXT NOT NULL,
    rating INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category_id, image_url)
);

CREATE INDEX IF NOT EXISTS idx_photos_category ON photos(category_id);
CREATE INDEX IF NOT EXISTS idx_photos_user ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_rating ON photos(rating DESC);

-- Создание таблицы голосований (для отслеживания показанных фото)
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    photo1_id INTEGER NOT NULL REFERENCES photos(id),
    photo2_id INTEGER NOT NULL REFERENCES photos(id),
    winner_photo_id INTEGER NOT NULL REFERENCES photos(id),
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, photo1_id, photo2_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);

-- Создание таблицы для отслеживания показанных фото пользователю
CREATE TABLE IF NOT EXISTS shown_photos (
    user_id INTEGER NOT NULL REFERENCES users(id),
    photo_id INTEGER NOT NULL REFERENCES photos(id),
    shown_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id, photo_id)
);

-- Создание таблицы для ежедневных снапшотов (обновляется в 6:00 по Барнаулу)
CREATE TABLE IF NOT EXISTS daily_stats (
    id SERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_id INTEGER REFERENCES users(id),
    photo_id INTEGER REFERENCES photos(id),
    activity_count INTEGER,
    photo_rating INTEGER,
    UNIQUE(snapshot_date, user_id, photo_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(snapshot_date DESC);