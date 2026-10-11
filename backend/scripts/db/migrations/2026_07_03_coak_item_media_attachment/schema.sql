-- Remove file item kind; allow optional media_id on folder, note, and flash items.

ALTER TABLE coak_items DROP CONSTRAINT IF EXISTS coak_items_kind_fields_valid;

UPDATE coak_items SET kind = 'note' WHERE kind = 'file';

ALTER TABLE coak_items DROP CONSTRAINT IF EXISTS coak_items_kind_valid;

ALTER TABLE coak_items
    ADD CONSTRAINT coak_items_kind_valid CHECK (kind IN ('folder', 'note', 'flash'));
