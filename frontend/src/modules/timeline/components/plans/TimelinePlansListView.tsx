// keel_web/src/modules/timeline/components/plans/TimelinePlansListView.tsx

import type { TimelinePlan } from "../../api";
import {
  TIMELINE_PLAN_LIST_GRID_CLASS,
  TimelinePlanListRow,
} from "./TimelinePlanListRow";

type TimelinePlansListViewProps = {
  plans: TimelinePlan[];
  onDelete?: (planId: number) => void;
  deleteDisabled?: boolean;
};

export function TimelinePlansListView({
  plans,
  onDelete,
  deleteDisabled = false,
}: TimelinePlansListViewProps) {
  if (plans.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        No plans yet. Create one to start scheduling your upcoming days.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-stone-800/80">
      <div className="min-w-[52rem]">
        <div
          className={[
            TIMELINE_PLAN_LIST_GRID_CLASS,
            "border-b border-stone-800 bg-stone-950/60 text-xs font-medium uppercase tracking-wide text-stone-500",
          ].join(" ")}
        >
          <div className="px-4 py-3">Title</div>
          <div className="px-4 py-3">Dates</div>
          <div className="px-4 py-3">Notes</div>
          <div className="px-2 py-3 text-center">Items</div>
          <div className="px-2 py-3 text-center"> </div>
        </div>
        {plans.map((plan) => (
          <TimelinePlanListRow
            key={plan.id}
            plan={plan}
            onDelete={onDelete}
            deleteDisabled={deleteDisabled}
          />
        ))}
      </div>
    </div>
  );
}
