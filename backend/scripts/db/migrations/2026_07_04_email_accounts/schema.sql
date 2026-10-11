-- Connected third-party mailboxes (Gmail today; OAuth tokens added in a later phase).

CREATE TABLE email_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'gmail',
    email_address TEXT NOT NULL,
    nickname TEXT NOT NULL DEFAULT '',
    provider_account_id TEXT,
    refresh_token_encrypted TEXT,
    access_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT,
    status TEXT NOT NULL DEFAULT 'disconnected',
    connected_at TIMESTAMPTZ,
    disconnected_at TIMESTAMPTZ,
    last_token_refresh_at TIMESTAMPTZ,
    last_api_call_at TIMESTAMPTZ,
    last_error_at TIMESTAMPTZ,
    last_error_message TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT email_accounts_provider_valid CHECK (
        provider IN ('gmail')
    ),
    CONSTRAINT email_accounts_status_valid CHECK (
        status IN ('connected', 'needs_reauth', 'disconnected')
    ),
    CONSTRAINT email_accounts_email_nonempty CHECK (
        char_length(trim(email_address)) > 0
    ),
    CONSTRAINT email_accounts_user_provider_email_unique UNIQUE (
        user_id, provider, email_address
    )
);

CREATE INDEX idx_email_accounts_user_id ON email_accounts (user_id);
CREATE INDEX idx_email_accounts_user_status ON email_accounts (user_id, status);
