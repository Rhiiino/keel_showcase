// src/modules/focus/components/constellation/automation/FocusAutomationModeButton.tsx

// Toggle to start or end an external agent automation session.

import { FocusInstantTooltip } from "../../shared/FocusInstantTooltip";

type FocusAutomationModeButtonProps = {
  isLive: boolean;
  endConfirmPending?: boolean;
  disabled?: boolean;
  onClick: () => void;
  onOpenSessionDetails?: () => void;
};

function SessionKeyIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="8.5" cy="10.5" r="3.1" />
      <path d="M11.4 8.6L14.2 5.8" />
      <path d="M13.1 4.9L15.1 2.9" />
      <path d="M14.8 6.6L16.8 4.6" />
      <path d="M11.6 10.5H14.8V13.7" />
    </svg>
  );
}

export function FocusAutomationModeButton({
  isLive,
  endConfirmPending = false,
  disabled = false,
  onClick,
  onOpenSessionDetails,
}: FocusAutomationModeButtonProps) {
  if (!isLive) {
    return (
      <FocusInstantTooltip label="Start agent mode" placement="below">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-pressed={false}
          aria-label="Start agent mode"
          className={[
            "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium transition",
            "border-white/12 bg-white/[0.04] text-white/55 hover:border-white/20 hover:bg-white/[0.08] hover:text-white/80",
            disabled ? "cursor-wait opacity-70" : "",
          ].join(" ")}
        >
          <span className="h-2 w-2 rounded-full bg-white/35" aria-hidden />
          <span>Agent Mode</span>
        </button>
      </FocusInstantTooltip>
    );
  }

  return (
    <div
      className={[
        "inline-flex h-9 items-stretch overflow-hidden rounded-full border text-xs font-medium transition",
        endConfirmPending
          ? "border-rose-400/45 bg-rose-600/20 text-rose-100"
          : "border-violet-400/45 bg-violet-600/20 text-violet-100",
        disabled ? "cursor-wait opacity-70" : "",
      ].join(" ")}
    >
      <FocusInstantTooltip
        label={endConfirmPending ? "Confirm end agent mode" : "End agent mode"}
        placement="below"
      >
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-pressed
          aria-label={endConfirmPending ? "Confirm end agent mode" : "End agent mode"}
          className={[
            "inline-flex h-full items-center gap-2 px-3 transition disabled:cursor-wait",
            endConfirmPending ? "hover:bg-rose-500/15" : "hover:bg-violet-500/15",
          ].join(" ")}
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 agent-live-dot-flash" aria-hidden />
          <span className="inline-grid [&>*]:col-start-1 [&>*]:row-start-1">
            <span className={endConfirmPending ? "invisible" : ""}>Agent Live</span>
            <span className={!endConfirmPending ? "invisible" : ""}>End ?</span>
          </span>
        </button>
      </FocusInstantTooltip>
      <div
        className={[
          "w-px self-stretch",
          endConfirmPending ? "bg-rose-400/25" : "bg-violet-400/25",
        ].join(" ")}
        aria-hidden
      />
      <FocusInstantTooltip label="View session key" placement="below">
        <button
          type="button"
          onClick={onOpenSessionDetails}
          disabled={disabled || !onOpenSessionDetails}
          aria-label="View session key"
          className={[
            "inline-flex h-full items-center justify-center px-2.5 transition disabled:cursor-wait",
            endConfirmPending
              ? "text-rose-100/80 hover:bg-rose-500/15 hover:text-rose-50"
              : "text-violet-100/80 hover:bg-violet-500/15 hover:text-violet-50",
          ].join(" ")}
        >
          <SessionKeyIcon />
        </button>
      </FocusInstantTooltip>
    </div>
  );
}
