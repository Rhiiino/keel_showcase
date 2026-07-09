-- Shared demo account for Keel Showcase (Enter login — no OAuth).
-- SHOWCASE_USER_ID in backend/.env should match this row (default id=1).

INSERT INTO users (
    id,
    provider,
    provider_user_id,
    email,
    display_name,
    picture_url
)
VALUES (
    1,
    'showcase',
    'demo',
    'showcase@keel.demo',
    'Keel Demo',
    NULL
)
ON CONFLICT (provider, provider_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    updated_at = NOW();

SELECT setval(
    pg_get_serial_sequence('users', 'id'),
    GREATEST((SELECT MAX(id) FROM users), 1)
);
