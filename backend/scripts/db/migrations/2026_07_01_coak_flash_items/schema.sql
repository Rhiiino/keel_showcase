-- Add flash card item kind and front/back content columns to coak_items.

ALTER TABLE coak_items
    ADD COLUMN IF NOT EXISTS flash_front TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS flash_back TEXT NOT NULL DEFAULT '';

ALTER TABLE coak_items DROP CONSTRAINT IF EXISTS coak_items_kind_valid;

ALTER TABLE coak_items
    ADD CONSTRAINT coak_items_kind_valid
    CHECK (kind IN ('file', 'folder', 'note', 'flash'));

ALTER TABLE coak_items DROP CONSTRAINT IF EXISTS coak_items_kind_fields_valid;

ALTER TABLE coak_items
    ADD CONSTRAINT coak_items_kind_fields_valid
    CHECK (
        (kind = 'file' AND media_id IS NOT NULL)
        OR (kind = 'folder' AND media_id IS NULL)
        OR (kind = 'note' AND media_id IS NULL)
        OR (kind = 'flash' AND media_id IS NULL)
    );
