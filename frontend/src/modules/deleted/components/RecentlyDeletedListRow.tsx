// keel_web/src/modules/deleted/components/RecentlyDeletedListRow.tsx

import { CardMenu } from "../../../components/CardMenu";
import { useConfirmDeleteAction } from "../../../hooks/useConfirmDeleteAction";
import type { DeletedRecord } from "../api";
import { formatDeletedDaysLeft } from "../lib/deletedDaysLeft";
import { DELETED_LIST_GRID_CLASS } from "../lib/deletedListLayout";

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString();
}

type RecentlyDeletedListRowProps = {
  record: DeletedRecord;
  onRestore: (recordId: string) => void;
  onPurge: (recordId: string) => void;
  restoreDisabled?: boolean;
  purgeDisabled?: boolean;
};

export function RecentlyDeletedListRow({
  record,
  onRestore,
  onPurge,
  restoreDisabled = false,
  purgeDisabled = false,
}: RecentlyDeletedListRowProps) {
  const { confirmPending, containerRef, handleClick } = useConfirmDeleteAction(record.id);

  return (
    <div
      className={[
        "grid w-full border-b border-stone-800/80 transition last:border-b-0 hover:bg-stone-900/40",
        DELETED_LIST_GRID_CLASS,
      ].join(" ")}
    >
      <div className="px-4 py-3.5 text-sm text-stone-300">{record.entity_type}</div>
      <div className="px-4 py-3.5 text-sm text-stone-400">{record.entity_id}</div>
      <div className="min-w-0 px-4 py-3.5">
        <p className="truncate text-sm text-stone-200" title={record.display_label}>
          {record.display_label}
        </p>
      </div>
      <div className="px-4 py-3.5 text-sm text-stone-300">
        {formatTimestamp(record.deleted_at)}
      </div>
      <div className="px-4 py-3.5 text-sm text-stone-300">
        {formatTimestamp(record.expires_at)}
      </div>
      <div className="px-4 py-3.5 text-sm tabular-nums text-stone-300">
        {formatDeletedDaysLeft(record.expires_at)}
      </div>
      <div className="px-4 py-3.5 text-sm text-stone-500">
        {formatTimestamp(record.permanently_deleted_at)}
      </div>
      <div
        ref={containerRef}
        data-no-row-nav
        className="relative z-20 flex items-center justify-center px-2 py-3.5"
      >
        <CardMenu
          ariaLabel={`Recently deleted options for ${record.display_label}`}
          disabled={restoreDisabled && purgeDisabled}
          items={[
            {
              id: "restore",
              label: "Restore",
              disabled: restoreDisabled,
              onSelect: () => onRestore(record.id),
            },
            {
              id: "purge",
              label: confirmPending ? "Confirm delete" : "Delete permanently",
              tone: "danger",
              disabled: purgeDisabled,
              onSelect: () => {
                if (confirmPending) {
                  handleClick(() => onPurge(record.id));
                  return;
                }
                handleClick(() => onPurge(record.id));
                return false;
              },
            },
          ]}
        />
      </div>
    </div>
  );
}
