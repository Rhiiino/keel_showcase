// keel_web/src/modules/people/shared/components/PersonBirthDateField.tsx

import {
  clampBirthDateParts,
  getBirthDateDayOptions,
  MONTH_OPTIONS,
  type BirthDateParts,
} from "../lib/birthDate";

type PersonBirthDateFieldProps = {
  value: BirthDateParts;
  onChange: (value: BirthDateParts) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  monthAriaLabel?: string;
  dayAriaLabel?: string;
  yearAriaLabel?: string;
  yearPlaceholder?: string;
};

const fieldClassName =
  "rounded-full border border-stone-800 bg-stone-950 px-3 py-1 text-sm text-stone-200 outline-none transition focus:border-stone-500 disabled:cursor-not-allowed disabled:opacity-60";

export function PersonBirthDateField({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  className = "",
  monthAriaLabel = "Birth month",
  dayAriaLabel = "Birth day",
  yearAriaLabel = "Birth year (optional)",
  yearPlaceholder = "Year (optional)",
}: PersonBirthDateFieldProps) {
  const dayOptions = getBirthDateDayOptions(value.month);

  const updateParts = (next: BirthDateParts) => {
    onChange(clampBirthDateParts(next));
  };

  return (
    <div
      className={[
        "flex flex-wrap items-center gap-2",
        className,
      ].join(" ")}
    >
      <select
        value={value.month}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(event) => {
          updateParts({ ...value, month: event.target.value });
        }}
        className={[fieldClassName, "min-w-[5.5rem]"].join(" ")}
        aria-label={monthAriaLabel}
      >
        <option value="">Month</option>
        {MONTH_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={value.day}
        disabled={disabled}
        onChange={(event) => {
          updateParts({ ...value, day: event.target.value });
        }}
        className={[fieldClassName, "min-w-[4.5rem]"].join(" ")}
        aria-label={dayAriaLabel}
      >
        <option value="">Day</option>
        {dayOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={9998}
        value={value.year}
        disabled={disabled}
        onChange={(event) => {
          updateParts({ ...value, year: event.target.value });
        }}
        placeholder={yearPlaceholder}
        className={[fieldClassName, "w-[8.5rem]"].join(" ")}
        aria-label={yearAriaLabel}
      />
    </div>
  );
}
