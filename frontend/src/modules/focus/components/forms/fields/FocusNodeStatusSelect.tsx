// src/modules/focus/components/forms/fields/FocusNodeStatusSelect.tsx

// Styled status select shared by focus node editors.

import {
  FOCUS_NODE_STATUSES,
  FOCUS_NODE_STATUS_COLORS,
  FOCUS_NODE_STATUS_LABELS,
  isFocusNodeStatus,
  type FocusNodeStatus,
} from "../../../lib/focus";

type FocusNodeStatusSelectProps = {
  id: string;
  value: FocusNodeStatus;
  disabled?: boolean;
  onChange: (value: FocusNodeStatus) => void;
  className?: string;
  selectClassName?: string;
};

export function FocusNodeStatusSelect({
  id,
  value,
  disabled = false,
  onChange,
  className = "",
  selectClassName = "",
}: FocusNodeStatusSelectProps) {
  return (
    <div className={["relative", className].join(" ")}>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          if (isFocusNodeStatus(next)) {
            onChange(next);
          }
        }}
        style={{ color: FOCUS_NODE_STATUS_COLORS[value] }}
        className={[
          "appearance-none rounded-lg border border-white/10 bg-white/[0.03] py-1.5 pl-3 pr-9 text-sm text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition hover:border-white/18 hover:bg-white/[0.05] focus:border-sky-300/35 disabled:opacity-40",
          selectClassName,
        ].join(" ")}
      >
        {FOCUS_NODE_STATUSES.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-[#141210]"
            style={{ color: FOCUS_NODE_STATUS_COLORS[option] }}
          >
            {FOCUS_NODE_STATUS_LABELS[option]}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute right-2.5 top-1/2 flex h-[18px] w-[18px] -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.06] text-white/45"
        aria-hidden
      >
        <svg
          viewBox="0 0 20 20"
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M6 8L10 12L14 8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}
