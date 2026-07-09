// keel_web/src/modules/timeline/components/plans/TimelinePlanListRow.tsx

import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

import { CardMenu } from "../../../../components/CardMenu";
import { useConfirmDeleteAction } from "../../../../hooks/useConfirmDeleteAction";
import type { TimelinePlan } from "../../api";
import {
  formatTimelinePlanDateRange,
  truncatePlanNotes,
} from "../../lib/timelinePlanDisplay";

export const TIMELINE_PLAN_LIST_GRID_CLASS =
  "grid w-full grid-cols-[minmax(0,1.2fr)_minmax(0,14rem)_minmax(0,1fr)_5rem_3.5rem] items-center";

type TimelinePlanListRowProps = {
  plan: TimelinePlan;
  onDelete?: (planId: number) => void;
  deleteDisabled?: boolean;
};

export function TimelinePlanListRow({
  plan,
  onDelete,
  deleteDisabled = false,
}: TimelinePlanListRowProps) {
  const navigate = useNavigate();
  const { confirmPending, containerRef, handleClick } = useConfirmDeleteAction(plan.id);

  const handleRowClick = (clickEvent: MouseEvent<HTMLDivElement>) => {
    if ((clickEvent.target as HTMLElement).closest("[data-no-row-nav]")) {
      return;
    }
    navigate(`/timeline/plan/${plan.id}`);
  };

  return (
    <div
      onClick={handleRowClick}
      className={[
        TIMELINE_PLAN_LIST_GRID_CLASS,
        "cursor-pointer border-b border-stone-800/80 transition hover:bg-stone-900/40",
      ].join(" ")}
    >
      <div className="min-w-0 px-4 py-3.5">
        <p className="truncate text-sm font-medium text-stone-100" title={plan.title}>
          {plan.title}
        </p>
      </div>

      <div className="min-w-0 px-4 py-3.5 text-sm text-stone-300">
        {formatTimelinePlanDateRange(plan.start_date, plan.end_date)}
      </div>

      <div className="min-w-0 px-4 py-3.5 text-sm text-stone-400">
        <p className="truncate" title={plan.notes.trim() || undefined}>
          {truncatePlanNotes(plan.notes)}
        </p>
      </div>

      <div className="flex items-center justify-center px-2 py-3.5">
        <span className="text-sm tabular-nums text-stone-300">{plan.item_count}</span>
      </div>

      <div
        ref={containerRef}
        data-no-row-nav
        className="relative z-20 flex items-center justify-center px-2 py-3.5"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        {onDelete ? (
          <CardMenu
            ariaLabel={`Plan options for ${plan.title}`}
            disabled={deleteDisabled}
            items={[
              {
                id: "delete",
                label: confirmPending ? "Confirm delete" : "Delete",
                tone: "danger",
                onSelect: () => handleClick(() => onDelete(plan.id)),
              },
            ]}
          />
        ) : null}
      </div>
    </div>
  );
}
