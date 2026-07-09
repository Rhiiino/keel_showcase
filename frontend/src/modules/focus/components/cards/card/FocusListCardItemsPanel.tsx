// src/modules/focus/components/cards/card/FocusListCardItemsPanel.tsx

// Slide-down entry list tucked behind a focus list card.

import { motion } from "framer-motion";

import type { FocusEntry } from "../../../api";
import { FocusListCardPeekItem } from "./FocusListCardPeekItem";

type FocusListCardItemsPanelProps = {
  expanded: boolean;
  entries: FocusEntry[];
  loading?: boolean;
};

const PANEL_TRANSITION = { duration: 0.16, ease: [0.2, 0, 0, 1] as const };

export function FocusListCardItemsPanel({
  expanded,
  entries,
  loading = false,
}: FocusListCardItemsPanelProps) {
  const sortedEntries = [...entries].sort(
    (a, b) => a.sort_order - b.sort_order || a.id - b.id,
  );

  return (
    <div
      className={[
        "relative z-10 mt-1 grid transition-[grid-template-rows] duration-150 ease-[cubic-bezier(0.2,0,0,1)]",
        expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      ].join(" ")}
    >
      <div className="min-h-0 overflow-hidden">
        <motion.div
          initial={false}
          animate={{ y: expanded ? 0 : "-100%" }}
          transition={PANEL_TRANSITION}
          className={[
            "rounded-b-2xl border border-t-0 border-white/[0.1]",
            "bg-gradient-to-b from-white/[0.05] to-white/[0.02]",
            "shadow-[0_10px_24px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.06]",
          ].join(" ")}
        >
          {loading ? (
            <p className="px-3 pb-3 pt-4 text-xs text-white/40">Loading entries…</p>
          ) : sortedEntries.length === 0 ? (
            <p className="px-3 pb-3 pt-4 text-xs text-white/40">No entries in this list.</p>
          ) : (
            <ul className="max-h-56 overflow-y-auto scrollbar-subtle pb-1 pt-3">
              {sortedEntries.map((entry) => (
                <FocusListCardPeekItem key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
