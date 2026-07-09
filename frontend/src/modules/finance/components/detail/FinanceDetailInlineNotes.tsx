// stack_sandbox/frontend_web/src/modules/shop/components/detail/FinanceDetailInlineNotes.tsx

// Click-to-edit notes field for purchase detail.

import { AutoSizeTextarea } from "../../../projects/components/common/AutoSizeTextarea";

type FinanceDetailInlineNotesProps = {
  value: string;
  onChange: (nextNotes: string) => void;
  disabled?: boolean;
};

export function FinanceDetailInlineNotes({
  value,
  onChange,
  disabled = false,
}: FinanceDetailInlineNotesProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
        Notes
      </p>
      <AutoSizeTextarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Add notes about this item…"
        aria-label="Item notes"
        className="w-full cursor-text border-0 bg-transparent text-base leading-relaxed text-stone-300 placeholder:text-stone-600 focus:outline-none focus:ring-0"
      />
    </div>
  );
}
