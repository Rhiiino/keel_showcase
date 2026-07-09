// keel_web/src/modules/timeline/components/forms/TimelineEventRemindersField.tsx

import type { TimelineReminderFormValue } from "../../api";

type TimelineEventRemindersFieldProps = {
  reminders: TimelineReminderFormValue[];
  startDate: string;
  disabled?: boolean;
  onChange: (reminders: TimelineReminderFormValue[]) => void;
};

const UNIT_OPTIONS: Array<{ value: TimelineReminderFormValue["unit"]; label: string }> = [
  { value: "minutes", label: "Minutes before" },
  { value: "hours", label: "Hours before" },
  { value: "days", label: "Days before" },
];

const inputClass =
  "rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600 disabled:opacity-50";

function FieldLabel({ children }: { children: string }) {
  return (
    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
      {children}
    </p>
  );
}

export function TimelineEventRemindersField({
  reminders,
  startDate,
  disabled = false,
  onChange,
}: TimelineEventRemindersFieldProps) {
  const updateReminder = (index: number, patch: Partial<TimelineReminderFormValue>) => {
    onChange(
      reminders.map((reminder, reminderIndex) =>
        reminderIndex === index ? { ...reminder, ...patch } : reminder,
      ),
    );
  };

  const removeReminder = (index: number) => {
    onChange(reminders.filter((_, reminderIndex) => reminderIndex !== index));
  };

  const addReminder = () => {
    onChange([...reminders, { amount: 15, unit: "minutes" }]);
  };

  return (
    <div>
      <FieldLabel>Reminders</FieldLabel>
      <p className="mb-3 text-xs text-stone-500">
        Optional notifications before this event starts. Leave empty for no reminders.
      </p>

      {reminders.length === 0 ? (
        <p className="mb-3 text-sm text-stone-500">No reminders configured.</p>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder, index) => (
            <div key={`${index}-${reminder.amount}-${reminder.unit}`} className="flex flex-wrap items-end gap-3">
              <label className="grid gap-1 text-sm text-stone-300">
                Amount
                <input
                  type="number"
                  min={1}
                  className={`${inputClass} w-24`}
                  value={reminder.amount}
                  disabled={disabled}
                  onChange={(event) =>
                    updateReminder(index, {
                      amount: Math.max(1, Number.parseInt(event.target.value, 10) || 1),
                    })
                  }
                />
              </label>
              <label className="grid gap-1 text-sm text-stone-300">
                Unit
                <select
                  className={`${inputClass} min-w-[10rem]`}
                  value={reminder.unit}
                  disabled={disabled}
                  onChange={(event) =>
                    updateReminder(index, {
                      unit: event.target.value as TimelineReminderFormValue["unit"],
                    })
                  }
                >
                  {UNIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeReminder(index)}
                className="rounded-lg px-3 py-2 text-sm text-stone-400 ring-1 ring-stone-800 hover:bg-stone-900 hover:text-stone-200 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        disabled={disabled || reminders.length >= 5}
        onClick={addReminder}
        className="mt-3 rounded-lg px-3 py-2 text-sm text-stone-200 ring-1 ring-stone-700 hover:bg-stone-900 disabled:opacity-50"
      >
        Add reminder
      </button>

      {!startDate.trim() && reminders.length > 0 ? (
        <p className="mt-2 text-xs text-amber-300/90">Set a start date to schedule reminders.</p>
      ) : null}
    </div>
  );
}
