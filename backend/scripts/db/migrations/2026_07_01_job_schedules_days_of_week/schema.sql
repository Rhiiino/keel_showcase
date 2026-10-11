-- Replace job_schedules.day_of_week with days_of_week array for multi-day weekly recurrence.

ALTER TABLE job_schedules
    ADD COLUMN IF NOT EXISTS days_of_week SMALLINT[];

UPDATE job_schedules
SET days_of_week = ARRAY[day_of_week]
WHERE day_of_week IS NOT NULL
  AND days_of_week IS NULL;

ALTER TABLE job_schedules
    DROP CONSTRAINT IF EXISTS job_schedules_day_of_week_valid;

ALTER TABLE job_schedules
    DROP COLUMN IF EXISTS day_of_week;

ALTER TABLE job_schedules
    DROP CONSTRAINT IF EXISTS job_schedules_days_of_week_valid;

ALTER TABLE job_schedules
    ADD CONSTRAINT job_schedules_days_of_week_valid CHECK (
        days_of_week IS NULL OR (
            cardinality(days_of_week) >= 1
            AND cardinality(days_of_week) <= 7
            AND days_of_week <@ ARRAY[0, 1, 2, 3, 4, 5, 6]::SMALLINT[]
        )
    );
