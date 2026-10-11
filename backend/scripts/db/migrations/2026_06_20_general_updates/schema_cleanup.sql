-- keel_api/scripts/db/migrations/2026_06_20_general_updates/schema_cleanup.sql
-- Drop legacy media tables and inline columns after data.py.

BEGIN;

ALTER TABLE projects
    DROP COLUMN IF EXISTS cover_media_id,
    DROP COLUMN IF EXISTS cover_storage_key,
    DROP COLUMN IF EXISTS cover_mime_type,
    DROP COLUMN IF EXISTS cover_byte_size,
    DROP COLUMN IF EXISTS cover_updated_at;

ALTER TABLE shop_items
    DROP COLUMN IF EXISTS cover_media_id,
    DROP COLUMN IF EXISTS cover_storage_key,
    DROP COLUMN IF EXISTS cover_mime_type,
    DROP COLUMN IF EXISTS cover_byte_size,
    DROP COLUMN IF EXISTS cover_updated_at;

ALTER TABLE shop_merchants
    DROP COLUMN IF EXISTS image_storage_key,
    DROP COLUMN IF EXISTS image_mime_type,
    DROP COLUMN IF EXISTS image_byte_size,
    DROP COLUMN IF EXISTS image_updated_at;

ALTER TABLE contacts
    DROP COLUMN IF EXISTS photo_storage_key,
    DROP COLUMN IF EXISTS photo_mime_type,
    DROP COLUMN IF EXISTS photo_byte_size,
    DROP COLUMN IF EXISTS photo_updated_at;

DROP TABLE IF EXISTS project_media;
DROP TABLE IF EXISTS shop_item_media;

COMMIT;
