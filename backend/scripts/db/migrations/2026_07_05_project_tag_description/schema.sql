-- Optional description text on project tags.

ALTER TABLE project_tags
    ADD COLUMN IF NOT EXISTS description TEXT;
