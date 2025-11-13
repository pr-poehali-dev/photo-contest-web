-- Удаляем UNIQUE constraint, который включает image_url (не может работать с большими base64 данными)
ALTER TABLE photos DROP CONSTRAINT IF EXISTS photos_user_id_category_id_image_url_key;