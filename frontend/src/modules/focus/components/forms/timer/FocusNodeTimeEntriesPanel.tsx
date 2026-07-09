// keel_web/src/modules/focus/components/forms/timer/FocusNodeTimeEntriesPanel.tsx

// Right-side history panel for focus node time entries.

import type { FocusNodeTimeEntry } from "../../../api";

export type FocusNodeTimeEntriesPanelProps = {
  entries: FocusNodeTimeEntry[];
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
};

function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatSeconds(value: number | null): string {
  if (value === null) {
    return "-";
  }
  return `${Math.max(value, 0)}s`;
}

function TimeEntryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-white/35">
        {label}
      </dt>
      <dd className="mt-0.5 text-xs text-white/75">{value}</dd>
    </div>
  );
}

export function FocusNodeTimeEntriesPanel({
  entries,
  isLoading,
  isError,
  onClose,
}: FocusNodeTimeEntriesPanelProps) {
  return (
    <aside className="rounded-2xl border border-white/10 bg-stone-950/70 p-4 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white/90">Time entries</h2>
          <p className="mt-1 text-xs text-white/40">Timer sessions for this node.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 py-1 text-xs text-white/45 transition hover:bg-white/[0.06] hover:text-white/80"
        >
          Close
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4 text-sm text-white/45">
            Loading time entries...
          </p>
        ) : null}

        {isError ? (
          <p className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-4 text-sm text-rose-200">
            Could not load time entries.
          </p>
        ) : null}

        {!isLoading && !isError && entries.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4 text-sm text-white/45">
            No time entries yet.
          </p>
        ) : null}

        {!isLoading && !isError
          ? entries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-xl border border-white/10 bg-white/[0.035] p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-white/70">
                    {entry.status}
                  </span>
                  <span className="text-[0.7rem] text-white/35">#{entry.id}</span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3">
                  <TimeEntryField
                    label="Started at"
                    value={formatDateTime(entry.started_at)}
                  />
                  <TimeEntryField
                    label="Last paused at"
                    value={formatDateTime(entry.last_paused_at)}
                  />
                  <TimeEntryField
                    label="Accumulated paused"
                    value={formatSeconds(entry.accumulated_paused_seconds)}
                  />
                  <TimeEntryField
                    label="Ended at"
                    value={formatDateTime(entry.ended_at)}
                  />
                  <TimeEntryField
                    label="Duration"
                    value={formatSeconds(entry.duration_seconds)}
                  />
                </dl>
              </article>
            ))
          : null}
      </div>
    </aside>
  );
}
