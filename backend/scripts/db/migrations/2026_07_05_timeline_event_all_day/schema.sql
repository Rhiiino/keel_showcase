-- Explicit all-day flag on timeline events (replaces timestamp inference on calendar).

ALTER TABLE timeline_events
    ADD COLUMN all_day BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill rows that were intended as all-day (including promote's 23:59:59Z end).
UPDATE timeline_events SET all_day = TRUE
WHERE (start_date AT TIME ZONE 'UTC')::time = TIME '00:00:00'
  AND (
    end_date IS NULL
    OR (end_date AT TIME ZONE 'UTC')::time IN (TIME '00:00:00', TIME '23:59:59')
  );
