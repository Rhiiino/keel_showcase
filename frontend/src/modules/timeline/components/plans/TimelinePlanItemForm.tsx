// keel_web/src/modules/timeline/components/plans/TimelinePlanItemForm.tsx

import { ConfirmTrashButton } from "../../../media/components/shared/actions";
import { AutoSizeTextarea } from "../../../projects/components/common/AutoSizeTextarea";
import type { TimelinePlanItem, TimelinePlanItemStatus } from "../../api";
import { TimelineEventInlineTags } from "../tags/TimelineEventInlineTags";
import {
  timelineApiToDatetimeLocal,
  timelineDatetimeLocalToApi,
} from "../../lib/timelineDateTime";

export type TimelinePlanItemFormValues = {
  title: string;
  description: string;
  status: TimelinePlanItemStatus;
  allDay: boolean;
  startAt: string;
  endAt: string;
  tagIds: number[];
};

type TimelinePlanItemFormProps = {
  values: TimelinePlanItemFormValues;
  onChange: (values: TimelinePlanItemFormValues) => void;
  disabled?: boolean;
  showDelete?: boolean;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  showPromote?: boolean;
  onPromote?: () => void;
  promoteDisabled?: boolean;
  promoteError?: string | null;
  linkedEventId?: number | null;
};

const STATUS_OPTIONS: TimelinePlanItemStatus[] = ["planned", "done", "skipped"];

function FieldLabel({ children }: { children: string }) {
  return (
    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
      {children}
    </p>
  );
}

export function emptyTimelinePlanItemFormValues(
  planStartDate: string,
): TimelinePlanItemFormValues {
  return {
    title: "",
    description: "",
    status: "planned",
    allDay: false,
    startAt: `${planStartDate}T09:00`,
    endAt: `${planStartDate}T10:00`,
    tagIds: [],
  };
}

export function timelinePlanItemToFormValues(item: TimelinePlanItem): TimelinePlanItemFormValues {
  return {
    title: item.title,
    description: item.description,
    status: item.status,
    allDay: item.all_day,
    startAt: timelineApiToDatetimeLocal(item.start_at),
    endAt: item.end_at ? timelineApiToDatetimeLocal(item.end_at) : "",
    tagIds: item.tags.map((tag) => tag.id),
  };
}

export function formValuesToPlanItemCreatePayload(values: TimelinePlanItemFormValues) {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    status: values.status,
    all_day: values.allDay,
    start_at: timelineDatetimeLocalToApi(values.startAt),
    end_at: values.endAt.trim() ? timelineDatetimeLocalToApi(values.endAt) : null,
    tag_ids: values.tagIds,
  };
}

export function formValuesToPlanItemUpdatePayload(values: TimelinePlanItemFormValues) {
  return formValuesToPlanItemCreatePayload(values);
}

export function isTimelinePlanItemFormValid(values: TimelinePlanItemFormValues): boolean {
  if (!values.title.trim() || !values.startAt.trim()) {
    return false;
  }
  if (values.endAt.trim() && values.endAt < values.startAt) {
    return false;
  }
  return true;
}

export function isPlanItemWithinPlanDates(
  values: TimelinePlanItemFormValues,
  planStartDate: string,
  planEndDate: string,
): boolean {
  const startDate = values.startAt.slice(0, 10);
  return startDate >= planStartDate && startDate <= planEndDate;
}

export function TimelinePlanItemForm({
  values,
  onChange,
  disabled = false,
  showDelete = false,
  onDelete,
  deleteDisabled = false,
  showPromote = false,
  onPromote,
  promoteDisabled = false,
  promoteError = null,
  linkedEventId = null,
}: TimelinePlanItemFormProps) {
  const update = (patch: Partial<TimelinePlanItemFormValues>) => {
    onChange({ ...values, ...patch });
  };

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel>Title</FieldLabel>
        <input
          type="text"
          value={values.title}
          disabled={disabled}
          onChange={(event) => update({ title: event.target.value })}
          className="w-full rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
        />
      </div>

      <div>
        <FieldLabel>Description</FieldLabel>
        <AutoSizeTextarea
          value={values.description}
          disabled={disabled}
          onChange={(event) => update({ description: event.target.value })}
          className="w-full rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
          rows={3}
        />
      </div>

      <div>
        <FieldLabel>Status</FieldLabel>
        <select
          value={values.status}
          disabled={disabled}
          onChange={(event) => update({ status: event.target.value as TimelinePlanItemStatus })}
          className="w-full max-w-xs rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="plan-item-all-day"
          type="checkbox"
          checked={values.allDay}
          disabled={disabled}
          onChange={(event) => update({ allDay: event.target.checked })}
          className="rounded border-stone-600 bg-stone-900"
        />
        <label htmlFor="plan-item-all-day" className="text-sm text-stone-300">
          All day
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
            className="w-full rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
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
            className="w-full rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <FieldLabel>Tags</FieldLabel>
        <TimelineEventInlineTags
          tagIdsDraft={values.tagIds}
          onTagIdsDraftChange={(tagIds) => update({ tagIds })}
          disabled={disabled}
        />
      </div>

      {linkedEventId != null ? (
        <p className="text-sm text-stone-400">
          Linked to timeline event #{linkedEventId}.
        </p>
      ) : null}

      {showPromote && onPromote ? (
        <div className="border-t border-stone-800/80 pt-6">
          <p className="mb-3 text-sm text-stone-400">
            Promote this plan item to a committed timeline event. Tags are copied to the new event.
          </p>
          <button
            type="button"
            disabled={promoteDisabled}
            onClick={onPromote}
            className="rounded-lg bg-sky-700/80 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-sky-600 disabled:opacity-50"
          >
            Promote to timeline event
          </button>
          {promoteError ? (
            <p className="mt-2 text-sm text-red-400">{promoteError}</p>
          ) : null}
        </div>
      ) : null}

      {showDelete && onDelete ? (
        <div className="border-t border-stone-800/80 pt-6">
          <ConfirmTrashButton
            onConfirm={onDelete}
            disabled={deleteDisabled}
            ariaLabel="Delete plan item"
          />
        </div>
      ) : null}
    </div>
  );
}
