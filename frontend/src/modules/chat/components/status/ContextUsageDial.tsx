// stack_sandbox/frontend_web/src/modules/chat/components/status/ContextUsageDial.tsx

// Circular context usage indicator for the selected conversation.

type ContextUsageDialProps = {
  tokensUsed: number;
  maxTokens: number;
  disabled?: boolean;
};

const SIZE = 56;
const STROKE = 4;
const RADIUS = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ContextUsageDial({
  tokensUsed,
  maxTokens,
  disabled = false,
}: ContextUsageDialProps) {
  const safeMax = maxTokens > 0 ? maxTokens : 1;
  const progress = Math.min(Math.max(tokensUsed / safeMax, 0), 1);
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const isHigh = progress >= 0.85;

  const hoverLabel = `${tokensUsed.toLocaleString()} / ${maxTokens.toLocaleString()} tokens`;
  const percentUsed =
    progress > 0 && progress < 0.01 ? 1 : Math.round(progress * 100);
  const centerLabel = disabled ? "—" : `${percentUsed}%`;

  return (
    <div
      className="group relative shrink-0"
      aria-label={disabled ? "No conversation selected" : hoverLabel}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-stone-800"
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={disabled ? CIRCUMFERENCE : dashOffset}
          className={isHigh ? "text-amber-400/90" : "text-lime-400/80"}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span
          className={[
            "font-mono text-[10px] leading-none",
            disabled ? "text-stone-600" : "text-stone-200",
          ].join(" ")}
        >
          {centerLabel}
        </span>
      </div>

      {!disabled && (
        <div className="pointer-events-none absolute right-0 top-full z-20 mt-1 hidden whitespace-nowrap rounded-md border border-stone-800 bg-stone-950 px-2 py-1 text-[10px] text-stone-300 shadow-lg group-hover:block">
          {hoverLabel}
        </div>
      )}
    </div>
  );
}
