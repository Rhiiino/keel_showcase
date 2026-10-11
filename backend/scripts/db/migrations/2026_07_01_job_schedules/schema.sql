-- Configurable recurring job schedules (Celery Beat source of truth).

CREATE TABLE job_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    task_name TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    queue TEXT NOT NULL DEFAULT 'default',
    recurrence TEXT NOT NULL,
    minute SMALLINT NOT NULL DEFAULT 0,
    hour SMALLINT NOT NULL DEFAULT 0,
    days_of_week SMALLINT[],
    day_of_month SMALLINT,
    month_of_year SMALLINT,
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    task_kwargs JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT job_schedules_recurrence_valid CHECK (
        recurrence IN ('daily', 'weekly', 'monthly', 'yearly')
    ),
    CONSTRAINT job_schedules_queue_valid CHECK (queue IN ('default', 'heavy')),
    CONSTRAINT job_schedules_minute_valid CHECK (minute >= 0 AND minute <= 59),
    CONSTRAINT job_schedules_hour_valid CHECK (hour >= 0 AND hour <= 23),
    CONSTRAINT job_schedules_days_of_week_valid CHECK (
        days_of_week IS NULL OR (
            cardinality(days_of_week) >= 1
            AND cardinality(days_of_week) <= 7
            AND days_of_week <@ ARRAY[0, 1, 2, 3, 4, 5, 6]::SMALLINT[]
        )
    ),
    CONSTRAINT job_schedules_day_of_month_valid CHECK (
        day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)
    ),
    CONSTRAINT job_schedules_month_of_year_valid CHECK (
        month_of_year IS NULL OR (month_of_year >= 1 AND month_of_year <= 12)
    )
);

CREATE INDEX idx_job_schedules_enabled ON job_schedules (enabled)
    WHERE enabled = TRUE;

ALTER TABLE job_runs
    ADD COLUMN schedule_id UUID REFERENCES job_schedules (id) ON DELETE SET NULL;

CREATE INDEX idx_job_runs_schedule_id ON job_runs (schedule_id)
    WHERE schedule_id IS NOT NULL;

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
    'purge-expired-sessions-daily',
    'jobs.tasks.maintenance.purge_expired_sessions',
    TRUE,
    'default',
    'daily',
    0,
    3,
    'America/New_York'
);
