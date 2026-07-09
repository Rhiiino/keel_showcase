// keel_web/src/components/ToggleSwitch.tsx

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
};

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
  className = "",
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        if (!disabled) {
          onChange(!checked);
        }
      }}
      className={[
        "toggle-switch",
        checked ? "toggle-switch--on" : "toggle-switch--off",
        className,
      ].join(" ")}
    >
      <span aria-hidden className="toggle-switch__thumb" />
    </button>
  );
}
