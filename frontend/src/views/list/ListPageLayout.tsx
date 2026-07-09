// keel_web/src/views/list/ListPageLayout.tsx

import type { ReactNode } from "react";

import { ListPageTitle } from "./primitives/ListPageTitle";

type ListPageLayoutProps = {
  title: string;
  recordCount?: number;
  subtitle?: ReactNode;
  actions?: ReactNode;
  titleClassName?: string;
  children: ReactNode;
  className?: string;
};

export function ListPageLayout({
  title,
  recordCount,
  subtitle,
  actions,
  titleClassName,
  children,
  className = "flex min-h-0 w-full flex-1 flex-col",
}: ListPageLayoutProps) {
  return (
    <div className={className}>
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <ListPageTitle
            title={title}
            recordCount={recordCount}
            className={titleClassName}
          />
          {subtitle ? (
            <div className="mt-1 max-w-xl text-sm text-stone-500">{subtitle}</div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </header>

      <div className="mt-8 min-h-0 flex-1">{children}</div>
    </div>
  );
}
