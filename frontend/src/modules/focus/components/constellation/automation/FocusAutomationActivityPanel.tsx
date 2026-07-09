// src/modules/focus/components/constellation/automation/FocusAutomationActivityPanel.tsx

// Bottom-right live automation feed overlaid on the constellation canvas.

import { useEffect, useRef, useState } from "react";

import type { FocusAutomationLogEntry } from "../../../hooks/automation/useFocusAutomationLog";

type FocusAutomationActivityPanelProps = {
  entries: FocusAutomationLogEntry[];
  isLive: boolean;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function kindColor(kind: FocusAutomationLogEntry["kind"]): string {
  switch (kind) {
    case "tool_failed":
      return "text-red-400";
    case "tool_complete":
    case "nodes_highlighted":
      return "text-emerald-400/90";
    case "tool_start":
      return "text-sky-300/90";
    case "node_viewed":
      return "text-violet-300/90";
    case "expansion_changed":
      return "text-fuchsia-300/90";
    case "session":
      return "text-lime-300/90";
    default:
      return "text-stone-300";
  }
}

function formatLogLine(entry: FocusAutomationLogEntry): string {
  let line = entry.summary;
  if (entry.detail) {
    line += ` — ${entry.detail}`;
  }
  if (entry.durationMs != null) {
    line += ` (${entry.durationMs} ms)`;
  }
  return line;
}

export function FocusAutomationActivityPanel({
  entries,
  isLive,
}: FocusAutomationActivityPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const seenEntryIdsRef = useRef<Set<string>>(new Set());
  const [flashingEntryIds, setFlashingEntryIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = 0;
  }, [entries.length, entries[0]?.id]);

  useEffect(() => {
    const nextFlashing = new Set<string>();
    for (const entry of entries) {
      if (!seenEntryIdsRef.current.has(entry.id)) {
        nextFlashing.add(entry.id);
      }
    }
    for (const entry of entries) {
      seenEntryIdsRef.current.add(entry.id);
    }
    if (nextFlashing.size === 0) {
      return;
    }
    setFlashingEntryIds(nextFlashing);
    const timer = window.setTimeout(() => {
      setFlashingEntryIds(new Set());
    }, 650);
    return () => window.clearTimeout(timer);
  }, [entries]);

  if (!isLive) {
    return null;
  }

  return (
    <div
      ref={scrollContainerRef}
      className="automation-log-scroll-fade pointer-events-auto absolute bottom-4 right-4 max-h-[36rem] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto scrollbar-hidden font-mono"
    >
      {entries.length === 0 ? (
        <p className="text-[11px] text-stone-500 [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]">
          Waiting for agent activity...
        </p>
      ) : (
        <ul className="space-y-1">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className={[
                "text-[11px] leading-relaxed [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]",
                flashingEntryIds.has(entry.id) ? "log-entry-flash" : "",
              ].join(" ")}
            >
              <span className="text-stone-500">[{formatTime(entry.timestamp)}]</span>{" "}
              <span className={kindColor(entry.kind)}>{formatLogLine(entry)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
