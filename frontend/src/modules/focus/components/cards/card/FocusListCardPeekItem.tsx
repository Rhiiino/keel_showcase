// src/modules/focus/components/cards/card/FocusListCardPeekItem.tsx

// Compact read-only entry row inside an expanded focus list card.

import type { FocusEntry } from "../../../api";
import { isFocusEntryKind, isFocusEntryStatus } from "../../../lib/focus";
import { FocusListIcon } from "../../shared/icons";

type FocusListCardPeekItemProps = {
  entry: FocusEntry;
};

export function FocusListCardPeekItem({ entry }: FocusListCardPeekItemProps) {
  const kind = isFocusEntryKind(entry.kind) ? entry.kind : "task";
  const status = isFocusEntryStatus(entry.status) ? entry.status : "active";
  const isCompleted = status === "completed";
  const isArchived = status === "archived";
  const isListLink = kind === "list_link";

  return (
    <li
      className={[
        "flex items-center gap-2 border-t border-white/[0.06] px-3 py-2 first:border-t-0",
        isCompleted ? "bg-emerald-500/[0.08]" : "",
        isArchived ? "opacity-75" : "",
        isListLink ? "bg-sky-500/[0.06]" : "",
      ].join(" ")}
    >
      {isListLink ? (
        <span className="shrink-0 text-sky-300/70" title="Linked list">
          <FocusListIcon />
        </span>
      ) : null}
      <span
        className={[
          "min-w-0 flex-1 truncate text-sm",
          isCompleted
            ? "text-emerald-300/80 line-through"
            : isArchived
              ? "text-white/45"
              : isListLink
                ? "text-sky-100/90"
                : "text-white/82",
        ].join(" ")}
      >
        {entry.title}
      </span>
    </li>
  );
}
