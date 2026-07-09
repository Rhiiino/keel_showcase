// stack_sandbox/frontend_web/src/modules/home/lib/quoteInterval.ts

// Resolves how long each home quote stays visible before rotating.

export const DEFAULT_HOME_QUOTE_INTERVAL_SECONDS = 3;
export const MIN_HOME_QUOTE_INTERVAL_SECONDS = 2;
export const MAX_HOME_QUOTE_INTERVAL_SECONDS = 60;

export function resolveHomeQuoteIntervalSeconds(
  value: number | null | undefined,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_HOME_QUOTE_INTERVAL_SECONDS;
  }
  const rounded = Math.round(value);
  return Math.min(
    MAX_HOME_QUOTE_INTERVAL_SECONDS,
    Math.max(MIN_HOME_QUOTE_INTERVAL_SECONDS, rounded),
  );
}
