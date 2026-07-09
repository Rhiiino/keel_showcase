// stack_sandbox/frontend_web/src/modules/chat/components/status/GeneralTabSection.tsx

// Reusable General tab section chrome — title, accent line, optional bottom divider.

import type { ReactNode } from "react";

type GeneralTabSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
};

export function GeneralTabSectionAccent() {
  return (
    <div
      className="mt-2 h-px w-full bg-gradient-to-r from-lime-400/50 via-lime-400/15 to-transparent"
      aria-hidden
    />
  );
}

export function GeneralTabSectionDivider() {
  return (
    <div className="shrink-0 px-3 py-2" aria-hidden>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-stone-700/80 to-transparent" />
    </div>
  );
}

export function GeneralTabSection({
  title,
  children,
  className = "",
  headerAction,
}: GeneralTabSectionProps) {
  return (
    <section className={className}>
      <header className="px-3 pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] uppercase tracking-wider text-stone-500">
            {title}
          </p>
          {headerAction}
        </div>
        <GeneralTabSectionAccent />
      </header>
      {children}
    </section>
  );
}
