-- Background job run history (Celery task tracking).

CREATE TABLE job_runs (
    id UUID PRIMARY KEY,
    celery_task_id TEXT NOT NULL UNIQUE,
    task_name TEXT NOT NULL,
    queue TEXT NOT NULL DEFAULT 'default',
    status TEXT NOT NULL DEFAULT 'pending',
    triggered_by TEXT NOT NULL,
    user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    result JSONB,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    CONSTRAINT job_runs_status_valid CHECK (
        status IN ('pending', 'running', 'success', 'failure', 'retry')
    ),
    CONSTRAINT job_runs_triggered_by_valid CHECK (
        triggered_by IN ('api', 'beat', 'manual')
    ),
    CONSTRAINT job_runs_queue_valid CHECK (queue IN ('default', 'heavy'))
);

CREATE INDEX idx_job_runs_status ON job_runs (status);

CREATE INDEX idx_job_runs_task_name_created_at ON job_runs (task_name, created_at DESC);

CREATE INDEX idx_job_runs_user_id ON job_runs (user_id)
    WHERE user_id IS NOT NULL;
