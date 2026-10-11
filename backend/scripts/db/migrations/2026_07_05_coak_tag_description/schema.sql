-- Optional description text on coak tags.

ALTER TABLE coak_tags
    ADD COLUMN IF NOT EXISTS description TEXT;
