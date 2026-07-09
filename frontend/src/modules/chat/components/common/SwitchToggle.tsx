// stack_sandbox/frontend_web/src/modules/chat/components/common/SwitchToggle.tsx

// Apple-style on/off toggle switch.

type SwitchToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  showLabel?: boolean;
};

export function SwitchToggle({
  checked,
  onChange,
  disabled = false,
  label = "Active",
  showLabel = true,
}: SwitchToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400/50",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          checked ? "bg-lime-500" : "bg-stone-600",
        ].join(" ")}
      >
        <span
          aria-hidden
          className={[
            "block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>
      {showLabel && (
        <span className="text-xs text-stone-400">{label}</span>
      )}
    </div>
  );
}
