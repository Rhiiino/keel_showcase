// keel_web/src/modules/timeline/components/plans/TimelinePlanForm.tsx

import { ConfirmTrashButton } from "../../../media/components/shared/actions";
import { AutoSizeTextarea } from "../../../projects/components/common/AutoSizeTextarea";
import type { TimelinePlan } from "../../api";

export type TimelinePlanFormValues = {
  title: string;
  startDate: string;
  endDate: string;
  notes: string;
};

type TimelinePlanFormProps = {
  values: TimelinePlanFormValues;
  onChange: (values: TimelinePlanFormValues) => void;
  disabled?: boolean;
  showDelete?: boolean;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  /** Narrow stacked layout for the plan detail sidebar column. */
  compact?: boolean;
};

function FieldLabel({ children }: { children: string }) {
  return (
    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
      {children}
    </p>
  );
}

export function emptyTimelinePlanFormValues(): TimelinePlanFormValues {
  const today = new Date();
  const day = today.getDay();
  const start = new Date(today);
  start.setDate(today.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const toInput = (value: Date) => value.toISOString().slice(0, 10);
  return {
    title: "",
    startDate: toInput(start),
    endDate: toInput(end),
    notes: "",
  };
}

export function timelinePlanToFormValues(plan: TimelinePlan): TimelinePlanFormValues {
  return {
    title: plan.title,
    startDate: plan.start_date,
    endDate: plan.end_date,
    notes: plan.notes,
  };
}

export function formValuesToPlanCreatePayload(values: TimelinePlanFormValues) {
  return {
    title: values.title.trim(),
    start_date: values.startDate,
    end_date: values.endDate,
    notes: values.notes.trim(),
  };
}

export function formValuesToPlanUpdatePayload(values: TimelinePlanFormValues) {
  return formValuesToPlanCreatePayload(values);
}

export function isTimelinePlanFormValid(values: TimelinePlanFormValues): boolean {
  return (
    values.title.trim().length > 0 &&
    values.startDate.length > 0 &&
    values.endDate.length > 0 &&
    values.endDate >= values.startDate
  );
}

export function TimelinePlanForm({
  values,
  onChange,
  disabled = false,
  showDelete = false,
  onDelete,
  deleteDisabled = false,
  compact = false,
}: TimelinePlanFormProps) {
  const update = (patch: Partial<TimelinePlanFormValues>) => {
    onChange({ ...values, ...patch });
  };

  return (
    <div className={compact ? "space-y-6" : "space-y-8"}>
      <div>
        <FieldLabel>Title</FieldLabel>
        <input
          type="text"
          value={values.title}
          disabled={disabled}
          onChange={(event) => update({ title: event.target.value })}
          className={[
            "w-full rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600 disabled:opacity-50",
            compact ? null : "max-w-xl",
          ]
            .filter(Boolean)
            .join(" ")}
        />
      </div>

      <div className={compact ? "space-y-4" : "grid max-w-xl gap-4 sm:grid-cols-2"}>
        <div>
          <FieldLabel>Start date</FieldLabel>
          <input
            type="date"
            value={values.startDate}
            disabled={disabled}
            onChange={(event) => update({ startDate: event.target.value })}
            className={[
              "w-full rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600 disabled:opacity-50",
              compact ? "max-w-xs" : null,
            ]
              .filter(Boolean)
              .join(" ")}
          />
        </div>
        <div>
          <FieldLabel>End date</FieldLabel>
          <input
            type="date"
            value={values.endDate}
            disabled={disabled}
            onChange={(event) => update({ endDate: event.target.value })}
            className={[
              "w-full rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600 disabled:opacity-50",
              compact ? "max-w-xs" : null,
            ]
              .filter(Boolean)
              .join(" ")}
          />
        </div>
      </div>

      <div>
        <FieldLabel>Notes</FieldLabel>
        <AutoSizeTextarea
          value={values.notes}
          disabled={disabled}
          placeholder="Optional notes for this planning period…"
          onChange={(event) => update({ notes: event.target.value })}
          className={[
            "w-full rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 placeholder:text-stone-500 focus:outline-none focus:ring-stone-600 disabled:opacity-50",
            compact ? null : "max-w-2xl",
          ]
            .filter(Boolean)
            .join(" ")}
          rows={compact ? 3 : 4}
        />
      </div>

      {showDelete && onDelete ? (
        <div className="border-t border-stone-800/80 pt-6">
          <ConfirmTrashButton
            onConfirm={onDelete}
            disabled={deleteDisabled}
            ariaLabel="Delete timeline plan"
          />
        </div>
      ) : null}
    </div>
  );
}
