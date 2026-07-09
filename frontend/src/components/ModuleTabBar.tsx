// keel_web/src/components/ModuleTabBar.tsx

// Horizontal tab bar for module detail pages.

import type { ReactNode } from "react";

export type ModuleTabItem = {
  id: string;
  label: string;
  icon?: ReactNode;
};

type ModuleTabBarProps = {
  tabs: ModuleTabItem[];
  activeId: string;
  onSelect: (id: string) => void;
  ariaLabel: string;
};

export function ModuleTabBar({
  tabs,
  activeId,
  onSelect,
  ariaLabel,
}: ModuleTabBarProps) {
  return (
    <div
      className="mt-8 overflow-x-auto border-b border-stone-800 pb-px"
      role="tablist"
      aria-label={ariaLabel}
    >
      <div className="flex min-w-min gap-1">
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(tab.id)}
              className={[
                "flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-sm transition",
                active
                  ? "border-sky-400/80 bg-stone-900/60 font-semibold text-stone-50"
                  : "border-transparent text-stone-500 hover:border-stone-700 hover:bg-stone-950/60 hover:text-stone-300",
              ].join(" ")}
            >
              {tab.icon ? (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                  {tab.icon}
                </span>
              ) : null}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
