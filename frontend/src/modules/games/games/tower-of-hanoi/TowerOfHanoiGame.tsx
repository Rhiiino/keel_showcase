// keel_web/src/modules/games/games/tower-of-hanoi/TowerOfHanoiGame.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { AppShellContent } from "../../../../app/shell/AppShellContent";
import { ApiError } from "../../../../lib/api";
import {
  createGameSession,
  fetchActiveSession,
  fetchResumeSession,
  type GameSession,
} from "../../api";
import type { GamePlayProps } from "../../gameRegistry";
import { useGameSession } from "../../hooks/useGameSession";
import { Disk } from "./components/Disk";
import { GameTimer } from "./components/GameTimer";
import { LevelCompleteModal } from "./components/LevelCompleteModal";
import { LevelSelector } from "./components/LevelSelector";
import { PegColumn } from "./components/PegColumn";
import { useTowerOfHanoiDrag } from "./hooks/useTowerOfHanoiDrag";
import {
  buildInitialPegs,
  buildInitialState,
  parseTowerState,
  serializeTowerState,
} from "./lib/initialState";
import { MAX_LEVEL, diskCount } from "./lib/levels";
import { applyMove, freezeTimer, isWin } from "./lib/rules";
import type { CompletionSummary, Pegs } from "./lib/types";

const DEAL_STEP_MS = 95;

function StatChip({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="inline-flex items-baseline gap-1.5 px-1.5 sm:px-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        {label}
      </span>
      <span
        className={[
          "font-mono text-sm tabular-nums",
          accent ? "text-lime-300" : "text-stone-100",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function isFreshBoard(record: GameSession): boolean {
  if (record.move_count !== 0) {
    return false;
  }
  const parsed = parseTowerState(record.state);
  if (!parsed) {
    return true;
  }
  const expected = buildInitialPegs(record.level);
  return (
    parsed.pegs[0].length === expected[0].length &&
    parsed.pegs[0].every((disk, index) => disk === expected[0][index]) &&
    parsed.pegs[1].length === 0 &&
    parsed.pegs[2].length === 0
  );
}

export function TowerOfHanoiGame({ gameKey }: GamePlayProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const dealTimerRef = useRef<number | null>(null);
  const dealFinishRef = useRef<number | null>(null);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pegs, setPegs] = useState<Pegs>(buildInitialState(1).pegs);
  const [timerState, setTimerState] = useState({
    timerStartedAt: new Date().toISOString(),
    elapsedMs: 0,
  });
  const [moveCount, setMoveCount] = useState(0);
  const [completionSummary, setCompletionSummary] = useState<CompletionSummary | null>(
    null,
  );
  const [bootError, setBootError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  /** null = fully revealed; otherwise count of largest disks shown during deal-in. */
  const [dealRevealCount, setDealRevealCount] = useState<number | null>(null);

  const sessionHook = useGameSession({
    gameKey,
    sessionId,
  });

  const clearDealTimer = useCallback(() => {
    if (dealTimerRef.current !== null) {
      window.clearInterval(dealTimerRef.current);
      dealTimerRef.current = null;
    }
    if (dealFinishRef.current !== null) {
      window.clearTimeout(dealFinishRef.current);
      dealFinishRef.current = null;
    }
  }, []);

  const startDealAnimation = useCallback(
    (level: number) => {
      clearDealTimer();
      const total = diskCount(level);
      setDealRevealCount(0);
      let revealed = 0;
      dealTimerRef.current = window.setInterval(() => {
        revealed += 1;
        setDealRevealCount(revealed);
        if (revealed >= total) {
          if (dealTimerRef.current !== null) {
            window.clearInterval(dealTimerRef.current);
            dealTimerRef.current = null;
          }
          dealFinishRef.current = window.setTimeout(() => {
            dealFinishRef.current = null;
            setDealRevealCount(null);
          }, 320);
        }
      }, DEAL_STEP_MS);
    },
    [clearDealTimer],
  );

  const applySession = useCallback(
    (record: GameSession, options?: { deal?: boolean }) => {
      const parsed = parseTowerState(record.state) ?? buildInitialState(record.level);
      const shouldDeal = options?.deal ?? isFreshBoard(record);
      setSessionId(record.id);
      setActiveLevel(record.level);
      setSelectedLevel(record.level);
      setPegs(parsed.pegs);
      setTimerState(
        record.move_count === 0
          ? { timerStartedAt: "", elapsedMs: 0 }
          : {
              timerStartedAt: parsed.timerStartedAt,
              elapsedMs: parsed.elapsedMs,
            },
      );
      setMoveCount(record.move_count);
      setCompletionSummary(null);
      if (shouldDeal) {
        startDealAnimation(record.level);
      } else {
        clearDealTimer();
        setDealRevealCount(null);
      }
    },
    [clearDealTimer, startDealAnimation],
  );

  useEffect(() => {
    return () => clearDealTimer();
  }, [clearDealTimer]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setIsBootstrapping(true);
      setBootError(null);
      try {
        try {
          const resumed = await fetchResumeSession(gameKey);
          if (!cancelled) {
            applySession(resumed);
          }
          return;
        } catch (error) {
          if (!(error instanceof ApiError && error.status === 404)) {
            throw error;
          }
        }
        if (!cancelled) {
          setActiveLevel(null);
        }
      } catch (error) {
        if (!cancelled) {
          setBootError(error instanceof Error ? error.message : "Failed to load game.");
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [applySession, gameKey]);

  const loadLevel = useCallback(
    async (level: number) => {
      setBootError(null);
      setIsBootstrapping(true);
      try {
        let record: GameSession | null = null;
        try {
          record = await fetchActiveSession(gameKey, level);
        } catch (error) {
          if (!(error instanceof ApiError && error.status === 404)) {
            throw error;
          }
        }
        if (!record) {
          record = await createGameSession(gameKey, level);
          applySession(record, { deal: true });
        } else {
          applySession(record);
        }
      } catch (error) {
        setBootError(error instanceof Error ? error.message : "Failed to load level.");
      } finally {
        setIsBootstrapping(false);
      }
    },
    [applySession, gameKey],
  );

  const persistState = useCallback(
    (nextPegs: Pegs, nextMoveCount: number, nextTimer = timerState) => {
      if (!sessionId) {
        return;
      }
      const payload = serializeTowerState({
        version: 1,
        pegs: nextPegs,
        timerStartedAt: nextTimer.timerStartedAt,
        elapsedMs: nextTimer.elapsedMs,
      });
      sessionHook.queueSave(payload, nextMoveCount);
    },
    [sessionHook, sessionId, timerState],
  );

  const handleMove = useCallback(
    async (sourcePeg: number, targetPeg: number) => {
      const nextPegs = applyMove(pegs, sourcePeg, targetPeg);
      const nextMoveCount = moveCount + 1;
      const nextTimer =
        moveCount === 0
          ? { timerStartedAt: new Date().toISOString(), elapsedMs: 0 }
          : timerState;

      setPegs(nextPegs);
      setMoveCount(nextMoveCount);
      if (moveCount === 0) {
        setTimerState(nextTimer);
      }
      persistState(nextPegs, nextMoveCount, nextTimer);

      if (activeLevel !== null && isWin(nextPegs, activeLevel) && sessionId) {
        const frozen = freezeTimer(nextTimer);
        setTimerState(frozen);
        const payload = serializeTowerState({
          version: 1,
          pegs: nextPegs,
          timerStartedAt: frozen.timerStartedAt,
          elapsedMs: frozen.elapsedMs,
        });
        try {
          const result = await sessionHook.completeLevel(payload, nextMoveCount);
          setCompletionSummary({
            durationMs: result.duration_ms,
            moveCount: nextMoveCount,
            level: activeLevel,
            nextLevel: result.next_level,
          });
        } catch (error) {
          setBootError(error instanceof Error ? error.message : "Failed to save completion.");
        }
      }
    },
    [
      activeLevel,
      moveCount,
      pegs,
      persistState,
      sessionHook,
      sessionId,
      timerState,
    ],
  );

  const isDealing = dealRevealCount !== null;

  const { drag, highlightPeg, beginDrag } = useTowerOfHanoiDrag({
    pegs,
    boardRef,
    disabled:
      completionSummary !== null ||
      isBootstrapping ||
      activeLevel === null ||
      isDealing,
    onMove: (source, target) => {
      void handleMove(source, target);
    },
  });

  const handleRestart = useCallback(async () => {
    if (!sessionId) {
      return;
    }
    setBootError(null);
    try {
      const restarted = await sessionHook.restartLevel();
      applySession(restarted, { deal: true });
    } catch (error) {
      setBootError(error instanceof Error ? error.message : "Failed to restart level.");
    }
  }, [applySession, sessionHook, sessionId]);

  const handleNextLevel = useCallback(async () => {
    if (!completionSummary?.nextLevel) {
      setCompletionSummary(null);
      return;
    }
    await loadLevel(completionSummary.nextLevel);
    setCompletionSummary(null);
  }, [completionSummary, loadLevel]);

  const handlePlayAgain = useCallback(async () => {
    setCompletionSummary(null);
    await handleRestart();
  }, [handleRestart]);

  const maxDisk = activeLevel ? diskCount(activeLevel) : diskCount(selectedLevel);
  const boardCapacity = diskCount(MAX_LEVEL);
  const timerRunning =
    completionSummary === null &&
    activeLevel !== null &&
    !isDealing &&
    moveCount > 0;

  return (
    <AppShellContent>
      <div className="mx-auto flex w-full max-w-6xl flex-col">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link to="/games" className="text-sm text-stone-500 hover:text-stone-300">
              ← Games
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-stone-50">Tower of Hanoi</h1>
            <p className="mt-1 max-w-xl text-sm text-stone-500">
              Move all disks to the rightmost peg. Larger disks cannot sit on smaller ones.
            </p>
          </div>
          {activeLevel !== null ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <GameTimer
                timerStartedAt={timerState.timerStartedAt}
                elapsedMs={timerState.elapsedMs}
                running={timerRunning}
              />
              <LevelSelector
                level={selectedLevel}
                onChange={(level) => {
                  void loadLevel(level);
                }}
                disabled={isBootstrapping || isDealing}
              />
              <button
                type="button"
                onClick={() => {
                  void handleRestart();
                }}
                disabled={sessionHook.isRestarting || isDealing}
                className={[
                  "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium",
                  "border-stone-700/80 bg-gradient-to-b from-stone-800/90 to-stone-950/90 text-stone-200",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.35)]",
                  "transition hover:border-lime-500/40 hover:text-lime-200",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                ].join(" ")}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="h-3.5 w-3.5"
                  aria-hidden
                >
                  <path
                    d="M4.5 6.5A6 6 0 0 1 16 10M15.5 13.5A6 6 0 0 1 4 10"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4.5 3.5v3.2H7.7M15.5 16.5v-3.2h-3.2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Restart
              </button>
            </div>
          ) : null}
        </div>

        {bootError ? (
          <p className="mt-6 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {bootError}
          </p>
        ) : null}

        {isBootstrapping && activeLevel === null ? (
          <p className="mt-10 text-sm text-stone-500">Loading game…</p>
        ) : null}

        {activeLevel === null && !isBootstrapping ? (
          <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-stone-800 bg-stone-950/60 p-6">
            <LevelSelector level={selectedLevel} onChange={setSelectedLevel} />
            <button
              type="button"
              onClick={() => {
                void loadLevel(selectedLevel);
              }}
              disabled={sessionHook.isStarting}
              className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-stone-950 hover:bg-lime-400 disabled:opacity-50"
            >
              Start level
            </button>
          </div>
        ) : null}

        {activeLevel !== null ? (
          <div className="relative mt-10">
            <style>{`
              @keyframes toh-disk-drop {
                0% { opacity: 0; transform: translateY(-28px) scale(0.92); }
                70% { opacity: 1; transform: translateY(2px) scale(1.02); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>
            <div
              className={[
                "mb-3 inline-flex w-fit max-w-full flex-wrap items-center gap-2 sm:gap-3",
                "rounded-xl border border-stone-800/80 bg-gradient-to-r from-stone-950/80 via-stone-900/50 to-stone-950/80",
                "px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
              ].join(" ")}
            >
              <StatChip label="Level" value={String(activeLevel)} />
              <span className="hidden h-4 w-px bg-stone-700/70 sm:block" aria-hidden />
              <StatChip label="Disks" value={String(diskCount(activeLevel))} />
              <span className="hidden h-4 w-px bg-stone-700/70 sm:block" aria-hidden />
              <StatChip label="Moves" value={String(moveCount)} accent />
            </div>

            <div
              ref={boardRef}
              className={[
                "relative grid grid-cols-3 gap-3 rounded-2xl border border-stone-800",
                "bg-gradient-to-b from-stone-900/70 via-stone-950/80 to-stone-950 p-3 sm:gap-4 sm:p-5",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_40px_rgba(0,0,0,0.35)]",
              ].join(" ")}
            >
              {pegs.map((pegDisks, pegIndex) => (
                <PegColumn
                  key={pegIndex}
                  pegIndex={pegIndex}
                  disks={pegDisks}
                  maxDisk={maxDisk}
                  boardCapacity={boardCapacity}
                  highlighted={highlightPeg === pegIndex}
                  draggingDisk={drag ? { pegIndex: drag.sourcePeg, disk: drag.disk } : null}
                  dealRevealCount={dealRevealCount}
                  onPointerDownTopDisk={(peg, event) => beginDrag(peg, event)}
                />
              ))}

              {drag ? (
                <div
                  className="pointer-events-none absolute z-20 flex justify-center"
                  style={{
                    left: drag.x,
                    top: drag.y,
                    width: drag.pegWidth,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <Disk
                    size={drag.disk}
                    maxDisk={maxDisk}
                    className="scale-105 shadow-2xl ring-2 ring-lime-300/50"
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {completionSummary ? (
          <LevelCompleteModal
            summary={completionSummary}
            onNextLevel={() => {
              void handleNextLevel();
            }}
            onPlayAgain={() => {
              void handlePlayAgain();
            }}
          />
        ) : null}
      </div>
    </AppShellContent>
  );
}
