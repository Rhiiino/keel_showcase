// keel_web/src/modules/games/games/tower-of-hanoi/lib/initialState.ts

import { diskCount } from "./levels";
import type { Pegs, TowerOfHanoiState } from "./types";

export function buildInitialPegs(level: number): Pegs {
  const count = diskCount(level);
  return [Array.from({ length: count }, (_, index) => index + 1), [], []];
}

export function buildInitialState(level: number): TowerOfHanoiState {
  return {
    version: 1,
    pegs: buildInitialPegs(level),
    timerStartedAt: "",
    elapsedMs: 0,
  };
}

export function parsePegs(raw: unknown): Pegs | null {
  if (!Array.isArray(raw) || raw.length !== 3) {
    return null;
  }
  const pegs: number[][] = [];
  for (const peg of raw) {
    if (!Array.isArray(peg)) {
      return null;
    }
    const parsed = peg.filter((disk): disk is number => typeof disk === "number" && disk > 0);
    if (parsed.length !== peg.length) {
      return null;
    }
    pegs.push(parsed);
  }
  return pegs as Pegs;
}

export function parseTowerState(raw: Record<string, unknown>): TowerOfHanoiState | null {
  const pegs = parsePegs(raw.pegs);
  if (!pegs) {
    return null;
  }
  const timerStartedAt = typeof raw.timerStartedAt === "string" ? raw.timerStartedAt : "";
  const elapsedMs = typeof raw.elapsedMs === "number" && raw.elapsedMs >= 0 ? raw.elapsedMs : 0;
  return {
    version: typeof raw.version === "number" ? raw.version : 1,
    pegs,
    timerStartedAt,
    elapsedMs,
  };
}

export function serializeTowerState(state: TowerOfHanoiState): Record<string, unknown> {
  return {
    version: state.version,
    pegs: state.pegs,
    timerStartedAt: state.timerStartedAt,
    elapsedMs: state.elapsedMs,
  };
}
