// keel_web/src/modules/projects/components/workspace/settings/WorkspaceCanvasMinimapToggle.tsx

// Toggle for showing the bottom-right workspace canvas preview map.

type WorkspaceCanvasMinimapToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
};

export function WorkspaceCanvasMinimapToggle({
  value,
  onChange,
}: WorkspaceCanvasMinimapToggleProps) {
  return (
    <div className="grid grid-cols-[6.5rem_auto] items-center gap-x-5">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
        Preview
      </span>
      <button
        type="button"
        aria-label={value ? "Hide canvas preview" : "Show canvas preview"}
        aria-pressed={value}
        onClick={() => onChange(!value)}
        className={[
          "inline-flex w-fit items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium transition",
          value
            ? "border-sky-400/35 bg-sky-500/15 text-sky-200"
            : "border-white/12 bg-white/[0.04] text-white/45 hover:bg-white/[0.06] hover:text-white/75",
        ].join(" ")}
      >
        <span
          className={[
            "relative h-3.5 w-6 rounded-full transition",
            value ? "bg-sky-400/80" : "bg-white/20",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition",
              value ? "left-3" : "left-0.5",
            ].join(" ")}
          />
        </span>
        {value ? "Shown" : "Hidden"}
      </button>
    </div>
  );
}
