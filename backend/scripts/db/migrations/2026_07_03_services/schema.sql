-- HTTP service health monitors (URL probes, status tracking).

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    url TEXT NOT NULL,
    check_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    expected_status_code INTEGER NOT NULL DEFAULT 200,
    failure_threshold INTEGER NOT NULL DEFAULT 3,
    last_status TEXT,
    last_checked_at TIMESTAMPTZ,
    response_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT services_name_nonempty CHECK (char_length(trim(service_name)) > 0),
    CONSTRAINT services_url_nonempty CHECK (char_length(trim(url)) > 0),
    CONSTRAINT services_url_http CHECK (url ~* '^https?://'),
    CONSTRAINT services_last_status_valid CHECK (
        last_status IS NULL OR last_status IN ('up', 'down', 'caution')
    ),
    CONSTRAINT services_expected_status_valid CHECK (
        expected_status_code BETWEEN 100 AND 599
    ),
    CONSTRAINT services_failure_threshold_positive CHECK (failure_threshold >= 1),
    CONSTRAINT services_consecutive_failures_nonnegative CHECK (consecutive_failures >= 0),
    CONSTRAINT services_user_name_type_unique UNIQUE (user_id, service_name, service_type)
);

CREATE INDEX idx_services_user_id ON services (user_id);

CREATE INDEX idx_services_check_enabled ON services (check_enabled) WHERE check_enabled = TRUE;
