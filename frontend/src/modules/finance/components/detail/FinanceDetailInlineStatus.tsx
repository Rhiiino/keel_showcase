// stack_sandbox/frontend_web/src/modules/shop/components/detail/FinanceDetailInlineStatus.tsx

// Draft status picker for purchase detail (saved via header Save).

import { useEffect, useRef, useState } from "react";

import {
  TRANSACTION_STATUSES,
  financeTransactionStatusLabel,
  financeTransactionStatusPillClass,
  type FinanceTransactionStatus,
} from "../../lib/transaction";

type FinanceDetailInlineStatusProps = {
  statusDraft: FinanceTransactionStatus;
  onStatusDraftChange: (nextStatus: FinanceTransactionStatus) => void;
  disabled?: boolean;
};

export function FinanceDetailInlineStatus({
  statusDraft,
  onStatusDraftChange,
  disabled = false,
}: FinanceDetailInlineStatusProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Item status: ${financeTransactionStatusLabel(statusDraft)}`}
        className={[
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition",
          financeTransactionStatusPillClass(statusDraft),
          disabled ? "cursor-not-allowed opacity-50" : "hover:brightness-110",
        ].join(" ")}
      >
        <span>{financeTransactionStatusLabel(statusDraft)}</span>
        <svg
          viewBox="0 0 24 24"
          className={[
            "h-3.5 w-3.5 shrink-0 opacity-70 transition",
            open ? "rotate-180" : "",
          ].join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Item statuses"
          className="absolute left-0 top-full z-30 mt-2 min-w-[10rem] overflow-hidden rounded-lg border border-stone-800 bg-stone-950 py-1 shadow-lg ring-1 ring-stone-800/80"
        >
          {TRANSACTION_STATUSES.map((status) => {
            const selected = status === statusDraft;
            return (
              <li key={status} role="option" aria-selected={selected}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onStatusDraftChange(status);
                    setOpen(false);
                  }}
                  className={[
                    "flex w-full items-center px-3 py-2 text-left text-sm transition disabled:opacity-50",
                    selected
                      ? "bg-stone-900/80 text-stone-100"
                      : "text-stone-200 hover:bg-stone-900/80",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1",
                      financeTransactionStatusPillClass(status),
                    ].join(" ")}
                  >
                    {financeTransactionStatusLabel(status)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
