// stack_sandbox/frontend_web/src/modules/chat/components/status/LogTab.tsx

// Log status panel tab — runtime SSE event feed for the active chat session.

import { useEffect, useRef, useState } from "react";

import type { StatusLogEntry } from "../../hooks/useStatusLog";
import { LogEntryIcon } from "./logEntryIcons";

type LogTabProps = {
  entries: StatusLogEntry[];
  onClearLog: () => void;
  isStreaming?: boolean;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function kindColor(kind: StatusLogEntry["kind"]): string {
  switch (kind) {
    case "error":
      return "text-red-400";
    case "agent_selected":
      return "text-lime-300/90";
    case "tool_call_start":
    case "tool_call_result":
      return "text-sky-300/90";
    case "user_message":
    case "assistant_message":
      return "text-stone-200";
    case "done":
      return "text-emerald-400/90";
    default:
      return "text-stone-400";
  }
}

export function LogTab({ entries, onClearLog, isStreaming = false }: LogTabProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const seenEntryIdsRef = useRef<Set<string>>(new Set());
  const [flashingEntryIds, setFlashingEntryIds] = useState<Set<string>>(
    () => new Set(),
  );
  const visibleEntries = [...entries].reverse();

  useEffect(() => {
    if (entries.length === 0) {
      seenEntryIdsRef.current.clear();
      setFlashingEntryIds(new Set());
      return;
    }

    const newEntryIds = entries
      .filter((entry) => !seenEntryIdsRef.current.has(entry.id))
      .map((entry) => entry.id);

    if (newEntryIds.length === 0) {
      return;
    }

    for (const id of newEntryIds) {
      seenEntryIdsRef.current.add(id);
    }

    setFlashingEntryIds(new Set(newEntryIds));
    const timer = window.setTimeout(() => setFlashingEntryIds(new Set()), 650);
    return () => window.clearTimeout(timer);
  }, [entries]);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [entries, isStreaming]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-stone-800/80 px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500">
          {isStreaming ? "Streaming…" : "Idle"}
        </span>
        <button
          type="button"
          onClick={onClearLog}
          disabled={entries.length === 0}
          className="rounded px-2 py-1 text-xs text-stone-500 transition hover:bg-stone-800 hover:text-stone-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      <div
        ref={scrollContainerRef}
        className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-3 py-2"
      >
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-500">
            Send a message to see backend activity here.
          </p>
        ) : (
          <ul className="space-y-2">
            {visibleEntries.map((entry) => (
              <li
                key={entry.id}
                className={[
                  "rounded-lg border border-stone-800/60 bg-stone-950/40 px-2.5 py-2",
                  flashingEntryIds.has(entry.id) ? "log-entry-flash" : "",
                ].join(" ")}
              >
                <div className="flex gap-2">
                  <span className="mt-0.5">
                    <LogEntryIcon
                      kind={entry.kind}
                      category={
                        typeof entry.meta?.category === "string"
                          ? entry.meta.category
                          : null
                      }
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="shrink-0 font-mono text-[10px] text-stone-600">
                        {formatTime(entry.timestamp)}
                      </span>
                      <span
                        className={`min-w-0 flex-1 text-xs leading-snug ${kindColor(entry.kind)}`}
                      >
                        {entry.summary}
                      </span>
                    </div>
                    {entry.detail && (
                      <div className="mt-1 flex gap-2">
                        <span className="mt-0.5 shrink-0 opacity-70">
                          <LogEntryIcon
                            kind={entry.kind}
                            category={
                              typeof entry.meta?.category === "string"
                                ? entry.meta.category
                                : null
                            }
                            size="sm"
                          />
                        </span>
                        <p className="min-w-0 truncate text-[11px] text-stone-500">
                          {entry.detail}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
