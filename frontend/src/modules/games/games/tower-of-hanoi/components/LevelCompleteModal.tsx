// keel_web/src/modules/games/games/tower-of-hanoi/components/LevelCompleteModal.tsx

import { diskCount, formatLevelLabel } from "../lib/levels";
import type { CompletionSummary } from "../lib/types";

type LevelCompleteModalProps = {
  summary: CompletionSummary;
  onNextLevel: () => void;
  onPlayAgain: () => void;
};

function formatDuration(totalMs: number): string {
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }
  return `${seconds}s`;
}

const SPARKS = [
  { left: "12%", top: "18%", dx: "-28px", dy: "-36px", color: "#a3e635" },
  { left: "78%", top: "22%", dx: "32px", dy: "-24px", color: "#e879f9" },
  { left: "20%", top: "72%", dx: "-22px", dy: "30px", color: "#22d3ee" },
  { left: "85%", top: "68%", dx: "26px", dy: "28px", color: "#fbbf24" },
  { left: "50%", top: "8%", dx: "8px", dy: "-40px", color: "#fb7185" },
  { left: "62%", top: "80%", dx: "18px", dy: "34px", color: "#84cc16" },
] as const;

export function LevelCompleteModal({
  summary,
  onNextLevel,
  onPlayAgain,
}: LevelCompleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-[2px]">
      <style>{`
        @keyframes toh-modal-pop {
          0% { opacity: 0; transform: scale(0.82) rotate(-2deg); }
          55% { opacity: 1; transform: scale(1.04) rotate(1deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes toh-graffiti-burst {
          0% { opacity: 0; transform: scale(0.4) rotate(-12deg); }
          40% { opacity: 1; transform: scale(1.15) rotate(4deg); }
          100% { opacity: 0.85; transform: scale(1) rotate(-3deg); }
        }
        @keyframes toh-spark {
          0% { opacity: 0; transform: translate(0, 0) scale(0.4); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1.2); }
        }
        @keyframes toh-stamp {
          0% { opacity: 0; transform: scale(1.6) rotate(-18deg); }
          60% { opacity: 1; transform: scale(0.95) rotate(-8deg); }
          100% { opacity: 1; transform: scale(1) rotate(-10deg); }
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="level-complete-title"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-lime-500/30 bg-stone-950 shadow-[0_0_0_1px_rgba(132,204,22,0.12),0_24px_80px_rgba(0,0,0,0.65)]"
        style={{ animation: "toh-modal-pop 420ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute -right-6 -top-4 text-6xl font-black uppercase tracking-tighter text-lime-400/25"
            style={{
              animation: "toh-graffiti-burst 700ms ease-out both",
              fontFamily: "Impact, Haettenschweiler, 'Arial Black', sans-serif",
              transform: "rotate(-12deg)",
            }}
          >
            YES!
          </div>
          <div
            className="absolute -left-2 top-16 text-4xl font-black uppercase text-fuchsia-400/20"
            style={{
              animation: "toh-graffiti-burst 780ms 80ms ease-out both",
              fontFamily: "Impact, Haettenschweiler, 'Arial Black', sans-serif",
              transform: "rotate(8deg)",
            }}
          >
            CLEAR
          </div>
          <div
            className="absolute bottom-24 right-4 text-3xl font-black uppercase text-cyan-300/20"
            style={{
              animation: "toh-graffiti-burst 820ms 120ms ease-out both",
              fontFamily: "Impact, Haettenschweiler, 'Arial Black', sans-serif",
              transform: "rotate(-6deg)",
            }}
          >
            NICE
          </div>
          {SPARKS.map((spark, index) => (
            <span
              key={index}
              className="absolute h-2 w-2 rounded-full"
              style={{
                left: spark.left,
                top: spark.top,
                background: spark.color,
                boxShadow: `0 0 10px ${spark.color}`,
                ["--dx" as string]: spark.dx,
                ["--dy" as string]: spark.dy,
                animation: `toh-spark 900ms ${80 + index * 40}ms ease-out both`,
              }}
            />
          ))}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-lime-500/15 to-transparent" />
        </div>

        <div className="relative px-6 pb-6 pt-7">
          <div
            className="absolute right-5 top-5 rounded-md border-2 border-lime-400/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-lime-300"
            style={{ animation: "toh-stamp 500ms 180ms ease-out both" }}
          >
            Cleared
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lime-400/80">
            Tower of Hanoi
          </p>
          <h2
            id="level-complete-title"
            className="mt-1 text-3xl font-black tracking-tight text-stone-50"
            style={{ fontFamily: "Impact, Haettenschweiler, 'Arial Black', sans-serif" }}
          >
            Level complete!
          </h2>
          <p className="mt-1.5 text-sm text-stone-400">
            {formatLevelLabel(summary.level)} · {diskCount(summary.level)} disks stacked
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <StatTile label="Level" value={String(summary.level)} />
            <StatTile label="Disks" value={String(diskCount(summary.level))} />
            <StatTile label="Time" value={formatDuration(summary.durationMs)} accent />
            <StatTile label="Moves" value={String(summary.moveCount)} accent />
          </div>

          <div className="mt-7 flex w-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={onPlayAgain}
              className={[
                "rounded-xl border border-stone-600 bg-stone-900/80 px-5 py-2.5 text-sm font-semibold text-stone-100",
                "transition hover:border-lime-500/50 hover:text-lime-200",
              ].join(" ")}
            >
              Play Again
            </button>
            {summary.nextLevel ? (
              <button
                type="button"
                onClick={onNextLevel}
                className={[
                  "rounded-xl bg-lime-400 px-5 py-2.5 text-sm font-bold text-stone-950",
                  "shadow-[0_0_24px_rgba(163,230,53,0.35)] transition hover:bg-lime-300",
                ].join(" ")}
              >
                Next level
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border px-3.5 py-3",
        "border-stone-700/70 bg-gradient-to-b from-stone-900/90 to-stone-950/90",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
      ].join(" ")}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
        {label}
      </div>
      <div
        className={[
          "mt-1 font-mono text-xl tabular-nums",
          accent ? "text-lime-300" : "text-stone-50",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}
