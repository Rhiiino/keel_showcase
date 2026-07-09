// keel_web/src/modules/games/games/tower-of-hanoi/lib/levels.ts

export const MAX_LEVEL = 15;
export const TARGET_PEG_INDEX = 2;

export function diskCount(level: number): number {
  return 2 + level;
}

export function isValidLevel(level: number): boolean {
  return Number.isInteger(level) && level >= 1 && level <= MAX_LEVEL;
}

export function formatLevelLabel(level: number): string {
  return `Level ${level}`;
}
