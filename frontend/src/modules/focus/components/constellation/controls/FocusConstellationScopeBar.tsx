// src/modules/focus/components/constellation/controls/FocusConstellationScopeBar.tsx

type FocusConstellationScopeBarProps = {
  scopeTitle: string;
  onBack: () => void;
};

export function FocusConstellationScopeBar({
  scopeTitle,
  onBack,
}: FocusConstellationScopeBarProps) {
  return (
    <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-xl border border-white/12 bg-black/55 px-3 py-2 text-sm text-white/85 shadow-lg backdrop-blur-md">
      <button
        type="button"
        onClick={onBack}
        className="shrink-0 rounded-lg px-2 py-1 text-white/60 transition hover:bg-white/[0.08] hover:text-white/90"
      >
        ← Full constellation
      </button>
      <span className="h-4 w-px shrink-0 bg-white/15" aria-hidden />
      <span className="min-w-0 truncate font-medium text-white/90">{scopeTitle}</span>
    </div>
  );
}
