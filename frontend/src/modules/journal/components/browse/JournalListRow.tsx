// keel_web/src/modules/journal/components/browse/JournalListRow.tsx

import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

import { CardMenu } from "../../../../components/CardMenu";
import { useConfirmDeleteAction } from "../../../../hooks/useConfirmDeleteAction";
import type { JournalEntry } from "../../api";
import { formatJournalEntryDate, truncateJournalPreview } from "../../lib/journalDisplay";
import { JournalTagPill } from "../tags/JournalTagPill";

export const JOURNAL_LIST_TABLE_WIDTH_CLASS = "w-full min-w-[56rem]";

export const JOURNAL_LIST_GRID_CLASS =
  "grid w-full grid-cols-[11rem_minmax(0,12rem)_minmax(0,1fr)_3.5rem]";

type JournalListRowProps = {
  entry: JournalEntry;
  onDelete?: (entryId: number) => void;
  deleteDisabled?: boolean;
};

export function JournalListRow({
  entry,
  onDelete,
  deleteDisabled = false,
}: JournalListRowProps) {
  const navigate = useNavigate();
  const formattedDate = formatJournalEntryDate(entry.entry_date);
  const preview = truncateJournalPreview(entry.content);
  const { confirmPending, containerRef, handleClick } = useConfirmDeleteAction(entry.id);

  const handleRowClick = (clickEvent: MouseEvent<HTMLDivElement>) => {
    if ((clickEvent.target as HTMLElement).closest("[data-no-row-nav]")) {
      return;
    }
    navigate(`/journal/${entry.id}`);
  };

  return (
    <div
      onClick={handleRowClick}
      className={[
        "relative grid w-full cursor-pointer border-b border-stone-800/80 transition last:border-b-0 hover:bg-stone-900/40",
        JOURNAL_LIST_GRID_CLASS,
      ].join(" ")}
    >
      <div className="px-4 py-3.5 align-middle">
        <p className="whitespace-nowrap text-sm font-medium text-stone-100">{formattedDate}</p>
      </div>

      <div className="min-w-0 px-4 py-3.5 align-middle">
        {entry.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {entry.tags.map((tag) => (
              <JournalTagPill key={tag.id} tag={tag} compact />
            ))}
          </div>
        ) : (
          <span className="text-sm text-stone-600">—</span>
        )}
      </div>

      <div className="min-w-0 overflow-hidden px-4 py-3.5 align-middle">
        <p className="truncate text-sm text-stone-200" title={entry.content}>
          {preview}
        </p>
      </div>

      <div
        ref={containerRef}
        data-no-row-nav
        className="relative z-20 flex items-center justify-center px-2 py-3.5"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        {onDelete ? (
          <CardMenu
            ariaLabel={`Journal entry options for ${formattedDate}`}
            disabled={deleteDisabled}
            items={[
              {
                id: "delete",
                label: confirmPending ? "Confirm delete" : "Delete",
                tone: "danger",
                onSelect: () => {
                  handleClick(() => onDelete(entry.id));
                },
              },
            ]}
          />
        ) : null}
      </div>
    </div>
  );
}
