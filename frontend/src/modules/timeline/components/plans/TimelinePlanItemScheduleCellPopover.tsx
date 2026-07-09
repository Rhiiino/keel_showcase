// keel_web/src/modules/timeline/components/plans/TimelinePlanItemScheduleCellPopover.tsx

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import type { TimelinePlanItem, TimelinePlanItemUpdatePayload } from "../../api";
import {
  formValuesToPlanItemUpdatePayload,
  isPlanItemWithinPlanDates,
  timelinePlanItemToFormValues,
  type TimelinePlanItemFormValues,
} from "./TimelinePlanItemForm";
import { TimelineEventInlineTags } from "../tags/TimelineEventInlineTags";
import { formatPlanItemStatusLabel } from "../../lib/timelinePlanDisplay";
import {
  formatTimelineDateOnlyLabel,
  formatTimelineInstantLabel,
} from "../../lib/timelineDateTime";

const POPOVER_MIN_WIDTH_PX = 288;
const POPOVER_MAX_HEIGHT_PX = 420;
const POPOVER_GAP_PX = 8;
const VIEWPORT_PADDING_PX = 8;
const POPOVER_Z_INDEX = 110;

const STATUS_OPTIONS = ["planned", "done", "skipped"] as const;

type PopoverPosition = {
  top: number;
  left: number;
  maxHeight: number;
  width: number;
};

type TimelinePlanItemScheduleCellPopoverProps = {
  item: TimelinePlanItem;
  planStartDate: string;
  planEndDate: string;
  disabled?: boolean;
  onUpdate: (payload: TimelinePlanItemUpdatePayload) => void;
};

function formatPlanItemSchedule(item: TimelinePlanItem): string {
  if (item.all_day) {
    return `${formatTimelineDateOnlyLabel(item.start_at)} (All day)`;
  }

  return formatTimelineInstantLabel(item.start_at, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function FieldLabel({ children }: { children: string }) {
  return (
    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
      {children}
    </p>
  );
}

function SchedulePopover({
  itemId,
  anchorRef,
  values,
  planStartDate,
  planEndDate,
  disabled,
  onChange,
  onClose,
}: {
  itemId: number;
  anchorRef: RefObject<HTMLButtonElement>;
  values: TimelinePlanItemFormValues;
  planStartDate: string;
  planEndDate: string;
  disabled: boolean;
  onChange: (next: TimelinePlanItemFormValues) => void;
  onClose: () => void;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<PopoverPosition | null>(null);

  const updatePosition = () => {
    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - POPOVER_GAP_PX - VIEWPORT_PADDING_PX;
    const spaceAbove = rect.top - POPOVER_GAP_PX - VIEWPORT_PADDING_PX;
    const openBelow = spaceBelow >= Math.min(POPOVER_MAX_HEIGHT_PX, spaceAbove);

    let top: number;
    let maxHeight: number;

    if (openBelow) {
      top = rect.bottom + POPOVER_GAP_PX;
      maxHeight = Math.min(POPOVER_MAX_HEIGHT_PX, spaceBelow);
    } else {
      maxHeight = Math.min(POPOVER_MAX_HEIGHT_PX, spaceAbove);
      top = rect.top - POPOVER_GAP_PX - maxHeight;
    }

    let left = rect.left;
    left = Math.max(
      VIEWPORT_PADDING_PX,
      Math.min(left, window.innerWidth - POPOVER_MIN_WIDTH_PX - VIEWPORT_PADDING_PX),
    );

    setPosition({
      top,
      left,
      maxHeight,
      width: POPOVER_MIN_WIDTH_PX,
    });
  };

  useLayoutEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      onClose();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [anchorRef, onClose]);

  const update = (patch: Partial<TimelinePlanItemFormValues>) => {
    onChange({ ...values, ...patch });
  };

  const rangeError = !isPlanItemWithinPlanDates(values, planStartDate, planEndDate)
    ? "Date must fall within the plan range."
    : null;

  if (!position) {
    return null;
  }

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Edit plan item schedule"
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight,
        zIndex: POPOVER_Z_INDEX,
      }}
      className="scrollbar-subtle overflow-y-auto rounded-xl border border-stone-800 bg-stone-950 p-4 shadow-xl ring-1 ring-stone-800/80"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            id={`plan-item-schedule-all-day-${itemId}`}
            type="checkbox"
            checked={values.allDay}
            disabled={disabled}
            onChange={(event) => update({ allDay: event.target.checked })}
            className="rounded border-stone-600 bg-stone-900"
          />
          <label
            htmlFor={`plan-item-schedule-all-day-${itemId}`}
            className="text-sm text-stone-300"
          >
            All day
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel>Start</FieldLabel>
            <input
              type={values.allDay ? "date" : "datetime-local"}
              value={values.allDay ? values.startAt.slice(0, 10) : values.startAt}
              disabled={disabled}
              onChange={(event) => {
                const next = event.target.value;
                update({
                  startAt: values.allDay ? `${next}T00:00` : next,
                });
              }}
              className="w-full rounded-lg bg-stone-900/50 px-2.5 py-1.5 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
            />
          </div>
          <div>
            <FieldLabel>End</FieldLabel>
            <input
              type={values.allDay ? "date" : "datetime-local"}
              value={
                values.endAt
                  ? values.allDay
                    ? values.endAt.slice(0, 10)
                    : values.endAt
                  : ""
              }
              disabled={disabled}
              onChange={(event) => {
                const next = event.target.value;
                update({
                  endAt: next ? (values.allDay ? `${next}T00:00` : next) : "",
                });
              }}
              className="w-full rounded-lg bg-stone-900/50 px-2.5 py-1.5 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <FieldLabel>Status</FieldLabel>
          <select
            value={values.status}
            disabled={disabled}
            onChange={(event) =>
              update({ status: event.target.value as TimelinePlanItemFormValues["status"] })
            }
            className="w-full rounded-lg bg-stone-900/50 px-2.5 py-1.5 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {formatPlanItemStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Tags</FieldLabel>
          <TimelineEventInlineTags
            tagIdsDraft={values.tagIds}
            onTagIdsDraftChange={(tagIds) => update({ tagIds })}
            disabled={disabled}
          />
        </div>

        {rangeError ? <p className="text-xs text-red-400">{rangeError}</p> : null}
      </div>
    </div>,
    document.body,
  );
}

export function TimelinePlanItemScheduleCellPopover({
  item,
  planStartDate,
  planEndDate,
  disabled = false,
  onUpdate,
}: TimelinePlanItemScheduleCellPopoverProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const schedule = formatPlanItemSchedule(item);

  const handleChange = (nextValues: TimelinePlanItemFormValues) => {
    if (!isPlanItemWithinPlanDates(nextValues, planStartDate, planEndDate)) {
      return;
    }
    if (nextValues.endAt.trim() && nextValues.endAt < nextValues.startAt) {
      return;
    }
    onUpdate(formValuesToPlanItemUpdatePayload(nextValues));
  };

  const handleCellClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (disabled) {
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        data-no-row-nav
        disabled={disabled}
        onClick={handleCellClick}
        className={[
          "w-full rounded px-1 py-0.5 text-left text-sm text-stone-300 transition",
          disabled ? "cursor-not-allowed opacity-50" : "hover:bg-stone-900/60 hover:text-stone-100",
        ].join(" ")}
      >
        {schedule}
      </button>

      {open ? (
        <SchedulePopover
          itemId={item.id}
          anchorRef={anchorRef}
          values={timelinePlanItemToFormValues(item)}
          planStartDate={planStartDate}
          planEndDate={planEndDate}
          disabled={disabled}
          onChange={handleChange}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
