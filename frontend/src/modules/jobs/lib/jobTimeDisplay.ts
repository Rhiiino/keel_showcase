// keel_web/src/modules/jobs/lib/jobTimeDisplay.ts

export const JOBS_DISPLAY_TIMEZONE = "America/New_York";
export const JOBS_DISPLAY_TIMEZONE_LABEL = "ET";

/** Format an ISO timestamp for jobs lists in Eastern Time. */
export function formatJobsTimestamp(value: string | null): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  const formatted = date.toLocaleString("en-US", {
    timeZone: JOBS_DISPLAY_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${formatted} ${JOBS_DISPLAY_TIMEZONE_LABEL}`;
}
