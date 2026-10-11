-- Link each user to a contacts row for profile data (e.g. birth date).

ALTER TABLE users
    ADD COLUMN contact_id INTEGER REFERENCES contacts (id) ON DELETE SET NULL;

-- Seed: link user 1 to contact 4 (dev/local primary user).
UPDATE users
SET contact_id = 4
WHERE id = 1;
