// keel_web/src/modules/games/games/tower-of-hanoi/lib/rules.ts

import { TARGET_PEG_INDEX, diskCount } from "./levels";
import type { Pegs } from "./types";

export function getTopDisk(peg: number[]): number | null {
  return peg.length > 0 ? peg[0] : null;
}

export function canPlaceDisk(disk: number, targetPeg: number[]): boolean {
  const top = getTopDisk(targetPeg);
  return top === null || disk < top;
}

export function canMoveFromPeg(pegs: Pegs, sourceIndex: number): boolean {
  return pegs[sourceIndex].length > 0;
}

export function canMoveToPeg(pegs: Pegs, sourceIndex: number, targetIndex: number): boolean {
  if (sourceIndex === targetIndex) {
    return false;
  }
  const disk = getTopDisk(pegs[sourceIndex]);
  if (disk === null) {
    return false;
  }
  return canPlaceDisk(disk, pegs[targetIndex]);
}

export function applyMove(pegs: Pegs, sourceIndex: number, targetIndex: number): Pegs {
  const next: Pegs = [ [...pegs[0]], [...pegs[1]], [...pegs[2]] ];
  const disk = next[sourceIndex].shift();
  if (disk === undefined) {
    return pegs;
  }
  next[targetIndex].unshift(disk);
  return next;
}

export function isWin(pegs: Pegs, level: number): boolean {
  const expected = diskCount(level);
  const target = pegs[TARGET_PEG_INDEX];
  if (target.length !== expected) {
    return false;
  }
  for (let index = 0; index < expected; index += 1) {
    if (target[index] !== index + 1) {
      return false;
    }
  }
  return true;
}

export function computeElapsedMs(state: { timerStartedAt: string; elapsedMs: number }): number {
  const started = Date.parse(state.timerStartedAt);
  if (Number.isNaN(started)) {
    return state.elapsedMs;
  }
  return state.elapsedMs + Math.max(0, Date.now() - started);
}

export function freezeTimer(state: {
  timerStartedAt: string;
  elapsedMs: number;
}): { timerStartedAt: string; elapsedMs: number } {
  return {
    timerStartedAt: new Date().toISOString(),
    elapsedMs: computeElapsedMs(state),
  };
}
