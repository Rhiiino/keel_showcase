// keel_web/src/modules/games/games/tower-of-hanoi/components/LevelSelector.tsx

import { MAX_LEVEL, diskCount, formatLevelLabel } from "../lib/levels";

type LevelSelectorProps = {
  level: number;
  onChange: (level: number) => void;
  disabled?: boolean;
};

export function LevelSelector({ level, onChange, disabled = false }: LevelSelectorProps) {
  const levels = Array.from({ length: MAX_LEVEL }, (_, index) => index + 1);

  return (
    <label
      className={[
        "inline-flex items-center gap-2.5 rounded-xl border px-3 py-1.5",
        "border-stone-700/80 bg-gradient-to-b from-stone-800/90 to-stone-950/90",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.35)]",
      ].join(" ")}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        Level
      </span>
      <select
        value={level}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className={[
          "cursor-pointer appearance-none rounded-lg border-0 bg-transparent py-0.5 pr-6 text-sm text-stone-100",
          "focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
          "bg-[length:12px] bg-[right_0.15rem_center] bg-no-repeat",
          "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%23a8a29e%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3E%3C/svg%3E')]",
        ].join(" ")}
      >
        {levels.map((value) => (
          <option key={value} value={value} className="bg-stone-900 text-stone-100">
            {formatLevelLabel(value)} ({diskCount(value)} disks)
          </option>
        ))}
      </select>
    </label>
  );
}
