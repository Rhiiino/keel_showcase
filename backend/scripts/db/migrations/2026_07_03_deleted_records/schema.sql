-- Global recently-deleted (trash) snapshots for restorable deletes.

CREATE TABLE deleted_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    display_label TEXT NOT NULL,
    payload JSONB NOT NULL,
    purge_group_id UUID,
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    permanently_deleted_at TIMESTAMPTZ,
    CONSTRAINT deleted_records_payload_object CHECK (jsonb_typeof(payload) = 'object')
);

CREATE INDEX idx_deleted_records_user_active
    ON deleted_records (user_id, deleted_at DESC)
    WHERE permanently_deleted_at IS NULL;

CREATE INDEX idx_deleted_records_expires_active
    ON deleted_records (expires_at)
    WHERE permanently_deleted_at IS NULL;

INSERT INTO job_schedules (
    name,
    task_name,
    enabled,
    queue,
    recurrence,
    minute,
    hour,
    timezone
)
VALUES (
    'purge-expired-deleted-records-daily',
    'jobs.tasks.maintenance.purge_expired_deleted_records',
    TRUE,
    'default',
    'daily',
    30,
    3,
    'America/New_York'
);
