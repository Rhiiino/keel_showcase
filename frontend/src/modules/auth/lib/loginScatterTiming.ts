// keel_web/src/modules/auth/lib/loginScatterTiming.ts

// Shared timing for scatter login title + intro sailor sequencing.

export const SCATTER_LOGIN_LETTER_COUNT = 4;
export const SCATTER_LOGIN_FADE_DURATION_S = 1.8;
export const SCATTER_LOGIN_LETTER_STAGGER_S = 0.33;
export const SCATTER_LOGIN_INITIAL_DELAY_S = 0.3;
export const LOGIN_SCATTER_INTRO_SAILOR_MS = 4500;
export const SCATTER_LOGIN_SHEEN_MIN_MS = 4500;
export const SCATTER_LOGIN_SHEEN_MAX_MS = 7500;
export const SCATTER_LOGIN_SHEEN_DURATION_MS = 1350;

export function scatterLoginTitleCompleteMs(): number {
  return (
    (SCATTER_LOGIN_INITIAL_DELAY_S +
      (SCATTER_LOGIN_LETTER_COUNT - 1) * SCATTER_LOGIN_LETTER_STAGGER_S +
      SCATTER_LOGIN_FADE_DURATION_S) *
    1000
  );
}

export function scatterLoginSheenDelayMs(): number {
  const span = SCATTER_LOGIN_SHEEN_MAX_MS - SCATTER_LOGIN_SHEEN_MIN_MS;
  return SCATTER_LOGIN_SHEEN_MIN_MS + Math.floor(Math.random() * (span + 1));
}
