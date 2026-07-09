// src/modules/focus/components/forms/fields/FocusWorkOrderInput.tsx

// Nullable integer input for cross-kind focus node work order.

type FocusWorkOrderInputProps = {
  id: string;
  value: number | null;
  disabled?: boolean;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  className?: string;
};

export function parseFocusWorkOrderDraft(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

export function formatFocusWorkOrderDraft(value: number | null): string {
  return value === null ? "" : String(value);
}

export function FocusWorkOrderInput({
  id,
  value,
  disabled = false,
  onChange,
  onBlur,
  className = "",
}: FocusWorkOrderInputProps) {
  return (
    <input
      id={id}
      type="number"
      min={0}
      step={1}
      inputMode="numeric"
      value={formatFocusWorkOrderDraft(value)}
      disabled={disabled}
      placeholder="None"
      onChange={(event) => onChange(parseFocusWorkOrderDraft(event.target.value))}
      onBlur={onBlur}
      className={[
        "w-24 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition placeholder:text-white/30 hover:border-white/18 hover:bg-white/[0.05] focus:border-sky-300/35 disabled:opacity-40",
        className,
      ].join(" ")}
    />
  );
}
