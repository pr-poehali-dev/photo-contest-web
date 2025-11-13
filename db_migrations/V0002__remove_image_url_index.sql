-- Удаляем индекс с image_url, так как мы храним base64 изображения (слишком большие для индекса)
DROP INDEX IF EXISTS idx_photos_image_url;

-- Изменяем тип колонки на TEXT для больших base64 данных
ALTER TABLE photos ALTER COLUMN image_url TYPE TEXT;