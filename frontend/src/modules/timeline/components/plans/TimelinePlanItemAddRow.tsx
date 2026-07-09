// keel_web/src/modules/timeline/components/plans/TimelinePlanItemAddRow.tsx

import { IconPlusButton } from "../../../../components/buttons/IconPlusButton";
import { TIMELINE_PLAN_ITEM_LIST_GRID_CLASS } from "./TimelinePlanItemListRow";

type TimelinePlanItemAddRowProps = {
  onAdd: () => void;
  disabled?: boolean;
};

export function TimelinePlanItemAddRow({
  onAdd,
  disabled = false,
}: TimelinePlanItemAddRowProps) {
  return (
    <div
      className={[
        TIMELINE_PLAN_ITEM_LIST_GRID_CLASS,
        "border-b border-stone-800/80 transition hover:bg-stone-900/40",
      ].join(" ")}
    >
      <div className="col-span-full flex items-center justify-center py-3">
        <IconPlusButton
          onClick={onAdd}
          disabled={disabled}
          ariaLabel="Add plan item"
        />
      </div>
    </div>
  );
}
