-- Scope contacts and relationships per user; assign existing rows to user 1.

ALTER TABLE contacts
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users (id) ON DELETE CASCADE;

UPDATE contacts
SET user_id = 1
WHERE user_id IS NULL;

ALTER TABLE contacts
    ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts (user_id);

DROP INDEX IF EXISTS idx_contacts_one_self;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_one_self_per_user
    ON contacts (user_id)
    WHERE is_self = TRUE;

ALTER TABLE contact_relationships
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users (id) ON DELETE CASCADE;

UPDATE contact_relationships AS cr
SET user_id = c.user_id
FROM contacts AS c
WHERE c.id = cr.from_contact_id
  AND cr.user_id IS NULL;

ALTER TABLE contact_relationships
    ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contact_relationships_user_id
    ON contact_relationships (user_id);

UPDATE users AS u
SET contact_id = c.id
FROM contacts AS c
WHERE c.user_id = u.id
  AND c.is_self = TRUE
  AND u.id = 1
  AND u.contact_id IS NULL;
