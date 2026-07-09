// keel_web/src/modules/timeline/lib/timelineReminderDisplay.ts

import type { TimelineEventReminder, TimelineReminderFormValue } from "../api";

export function formatReminderOffset(reminder: Pick<TimelineEventReminder, "amount" | "unit">): string {
  const unitLabel =
    reminder.unit === "minutes"
      ? reminder.amount === 1
        ? "minute"
        : "minutes"
      : reminder.unit === "hours"
        ? reminder.amount === 1
          ? "hour"
          : "hours"
        : reminder.amount === 1
          ? "day"
          : "days";
  return `${reminder.amount} ${unitLabel} before`;
}

export function formatReminderList(
  reminders: Array<Pick<TimelineEventReminder, "amount" | "unit">>,
): string {
  if (reminders.length === 0) {
    return "";
  }
  return reminders.map(formatReminderOffset).join(", ");
}

export function remindersFormValuesEqual(
  left: TimelineReminderFormValue[],
  right: TimelineReminderFormValue[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every(
    (reminder, index) =>
      reminder.amount === right[index]?.amount && reminder.unit === right[index]?.unit,
  );
}
