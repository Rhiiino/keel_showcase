// keel_web/src/modules/games/games/tower-of-hanoi/lib/types.ts

export type Pegs = [number[], number[], number[]];

export type TowerOfHanoiState = {
  version: number;
  pegs: Pegs;
  timerStartedAt: string;
  elapsedMs: number;
};

export type CompletionSummary = {
  durationMs: number;
  moveCount: number;
  level: number;
  nextLevel: number | null;
};
