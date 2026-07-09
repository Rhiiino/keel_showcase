// keel_web/src/modules/timeline/components/forms/TimelineEventForm.tsx

import { ConfirmTrashButton } from "../../../media/components/shared/actions";
import type { TimelineEventGalleryEntry } from "../../api";
import {
  compareTimelineDateTimes,
  timelineApiToDatetimeLocal,
  timelineDatetimeLocalToApi,
} from "../../lib/timelineDateTime";
import { ContactMultiSelect } from "../ContactMultiSelect";
import { FigureMultiSelect } from "../FigureMultiSelect";
import { TimelineEventInlineTags } from "../tags/TimelineEventInlineTags";
import {
  TimelineMediaCarousel,
  type PendingMediaSelection,
  type PendingUpload,
} from "../TimelineMediaCarousel";
import type { Contact } from "../../../people/contacts/api";
import type { Figure } from "../../../people/figures/api";
import type { MediaObject } from "../../../media/api";
import type { TimelineReminderFormValue } from "../../api";
import { TimelineEventRemindersField } from "./TimelineEventRemindersField";

export type TimelineEventFormValues = {
  description: string;
  startDate: string;
  endDate: string;
  subjectName: string;
  contactIds: number[];
  figureIds: number[];
  tagIds: number[];
  reminders: TimelineReminderFormValue[];
};

type TimelineEventFormProps = {
  values: TimelineEventFormValues;
  contacts: Contact[];
  figures: Figure[];
  onChange: (values: TimelineEventFormValues) => void;
  disabled?: boolean;
  showDelete?: boolean;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  media?: TimelineEventGalleryEntry[];
  pendingUploads?: PendingUpload[];
  pendingMediaSelections?: PendingMediaSelection[];
  onQueueUploads?: (files: FileList | File[]) => void;
  onQueueMediaSelections?: (media: MediaObject[]) => void;
  onRemovePendingUpload?: (clientId: string) => void;
  onRemovePendingMedia?: (clientId: string) => void;
  onDeleteMedia?: (attachmentId: number) => void;
  pageFileDragActive?: boolean;
};

function FieldLabel({ children }: { children: string }) {
  return (
    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
      {children}
    </p>
  );
}

export function TimelineEventForm({
  values,
  contacts,
  figures,
  onChange,
  disabled = false,
  showDelete = false,
  onDelete,
  deleteDisabled = false,
  media = [],
  pendingUploads = [],
  pendingMediaSelections = [],
  onQueueUploads,
  onQueueMediaSelections,
  onRemovePendingUpload,
  onRemovePendingMedia,
  onDeleteMedia,
  pageFileDragActive = false,
}: TimelineEventFormProps) {
  const update = (patch: Partial<TimelineEventFormValues>) => {
    onChange({ ...values, ...patch });
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <FieldLabel>Start</FieldLabel>
          <input
            type="datetime-local"
            value={values.startDate}
            disabled={disabled}
            onChange={(event) => update({ startDate: event.target.value })}
            className="w-full max-w-md rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
          />
        </div>
        <div>
          <FieldLabel>End</FieldLabel>
          <input
            type="datetime-local"
            value={values.endDate}
            disabled={disabled}
            onChange={(event) => update({ endDate: event.target.value })}
            className="w-full max-w-md rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
          />
          <p className="mt-1 text-xs text-stone-500">
            Optional — leave blank for a single-point event. Use midnight for all-day dates.
          </p>
        </div>
      </div>

      <TimelineEventRemindersField
        reminders={values.reminders}
        startDate={values.startDate}
        disabled={disabled}
        onChange={(reminders) => update({ reminders })}
      />

      <ContactMultiSelect
        contacts={contacts}
        value={values.contactIds}
        onChange={(contactIds) => update({ contactIds })}
        disabled={disabled}
        variant="circles"
        label="Contacts"
      />

      <FigureMultiSelect
        figures={figures}
        value={values.figureIds}
        onChange={(figureIds) => update({ figureIds })}
        disabled={disabled}
        variant="circles"
      />

      <div>
        <FieldLabel>Tags</FieldLabel>
        <TimelineEventInlineTags
          tagIdsDraft={values.tagIds}
          onTagIdsDraftChange={(tagIds) => update({ tagIds })}
          disabled={disabled}
        />
      </div>

      <div>
        <FieldLabel>Subject name</FieldLabel>
        <input
          type="text"
          value={values.subjectName}
          disabled={disabled}
          placeholder="Person not in contacts"
          onChange={(event) => update({ subjectName: event.target.value })}
          className="w-full max-w-md rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 placeholder:text-stone-500 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
        />
      </div>

      <div>
        <FieldLabel>Event</FieldLabel>
        <textarea
          value={values.description}
          disabled={disabled}
          rows={5}
          placeholder="What happened?"
          onChange={(event) => update({ description: event.target.value })}
          className="w-full rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 placeholder:text-stone-500 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
        />
      </div>

      {(onQueueUploads || onQueueMediaSelections || media.length > 0) && (
        <TimelineMediaCarousel
          media={media}
          pendingUploads={pendingUploads}
          pendingMediaSelections={pendingMediaSelections}
          onQueueUploads={onQueueUploads}
          onQueueMediaSelections={onQueueMediaSelections}
          onRemovePending={onRemovePendingUpload}
          onRemovePendingMedia={onRemovePendingMedia}
          onDeleteMedia={onDeleteMedia}
          disabled={disabled}
          pageFileDragActive={pageFileDragActive}
        />
      )}

      {showDelete && onDelete ? (
        <div className="border-t border-stone-800 pt-8">
          <ConfirmTrashButton
            onConfirm={onDelete}
            disabled={deleteDisabled}
            ariaLabel="Delete timeline event"
            className="inline-flex"
          />
        </div>
      ) : null}
    </div>
  );
}

export function emptyTimelineEventFormValues(): TimelineEventFormValues {
  return {
    description: "",
    startDate: "",
    endDate: "",
    subjectName: "",
    contactIds: [],
    figureIds: [],
    tagIds: [],
    reminders: [],
  };
}

export function timelineEventToFormValues(
  event: {
    description: string;
    start_date: string;
    end_date: string | null;
    subject_name: string | null;
    contacts: Array<{ id: number }>;
    figures: Array<{ id: number }>;
    tags: Array<{ id: number }>;
    reminders?: Array<{ amount: number; unit: TimelineReminderFormValue["unit"] }>;
  },
): TimelineEventFormValues {
  return {
    description: event.description,
    startDate: timelineApiToDatetimeLocal(event.start_date),
    endDate: event.end_date ? timelineApiToDatetimeLocal(event.end_date) : "",
    subjectName: event.subject_name ?? "",
    contactIds: event.contacts.map((contact) => contact.id),
    figureIds: event.figures.map((figure) => figure.id),
    tagIds: event.tags.map((tag) => tag.id),
    reminders: (event.reminders ?? []).map((reminder) => ({
      amount: reminder.amount,
      unit: reminder.unit,
    })),
  };
}

export function formValuesToCreatePayload(values: TimelineEventFormValues) {
  return {
    description: values.description.trim(),
    start_date: timelineDatetimeLocalToApi(values.startDate),
    end_date: values.endDate.trim() ? timelineDatetimeLocalToApi(values.endDate) : null,
    subject_name: values.subjectName.trim() || null,
    contact_ids: values.contactIds,
    figure_ids: values.figureIds,
    tag_ids: values.tagIds,
    reminders: values.reminders,
  };
}

export function formValuesToUpdatePayload(values: TimelineEventFormValues) {
  return {
    description: values.description.trim(),
    start_date: timelineDatetimeLocalToApi(values.startDate),
    end_date: values.endDate.trim() ? timelineDatetimeLocalToApi(values.endDate) : null,
    subject_name: values.subjectName.trim() || null,
    contact_ids: values.contactIds,
    figure_ids: values.figureIds,
    tag_ids: values.tagIds,
    reminders: values.reminders,
  };
}

export function isTimelineFormValid(values: TimelineEventFormValues): boolean {
  return values.description.trim().length > 0 && values.startDate.length > 0;
}

export function isTimelineDateRangeValid(values: TimelineEventFormValues): boolean {
  if (!values.endDate.trim()) {
    return true;
  }
  return compareTimelineDateTimes(values.endDate, values.startDate) >= 0;
}
