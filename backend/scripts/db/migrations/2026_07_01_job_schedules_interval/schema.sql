-- Minute-based recurrence for job schedules.

ALTER TABLE job_schedules
    ADD COLUMN interval_minutes INTEGER;

ALTER TABLE job_schedules
    DROP CONSTRAINT job_schedules_recurrence_valid;

ALTER TABLE job_schedules
    ADD CONSTRAINT job_schedules_recurrence_valid CHECK (
        recurrence IN ('daily', 'weekly', 'monthly', 'yearly', 'interval')
    );

ALTER TABLE job_schedules
    ADD CONSTRAINT job_schedules_interval_minutes_valid CHECK (
        interval_minutes IS NULL
        OR (interval_minutes >= 1 AND interval_minutes <= 1440)
    );

ALTER TABLE job_schedules
    ADD CONSTRAINT job_schedules_interval_recurrence_fields CHECK (
        (recurrence = 'interval' AND interval_minutes IS NOT NULL)
        OR (recurrence <> 'interval' AND interval_minutes IS NULL)
    );
