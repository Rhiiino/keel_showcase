// keel_web/src/modules/deleted/lib/deletedDaysLeft.ts

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getDeletedDaysLeft(expiresAt: string, nowMs = Date.now()): number {
  const expiresMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresMs)) {
    return 0;
  }

  const msLeft = expiresMs - nowMs;
  if (msLeft <= 0) {
    return 0;
  }

  return Math.ceil(msLeft / MS_PER_DAY);
}

export function formatDeletedDaysLeft(expiresAt: string, nowMs = Date.now()): string {
  const daysLeft = getDeletedDaysLeft(expiresAt, nowMs);
  return String(daysLeft);
}
