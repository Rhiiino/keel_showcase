// stack_sandbox/frontend_web/src/modules/projects/components/detail/ProjectDetailLayout.tsx

// Four-quadrant layout for project detail view.

import type { ReactNode } from "react";

type ProjectDetailLayoutProps = {
  meta: ReactNode;
  title: ReactNode;
  tags?: ReactNode;
  description: ReactNode;
  cover: ReactNode;
  coverAside?: ReactNode;
  files: ReactNode;
  actions?: ReactNode;
};

export function ProjectDetailLayout({
  meta,
  title,
  tags,
  description,
  cover,
  coverAside,
  files,
  actions,
}: ProjectDetailLayoutProps) {
  const bottomRight = coverAside;

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_min(42%,360px)] lg:items-start">
        <div className="min-w-0 space-y-4">
          {meta}
          {title}
          {tags}
          {description}
        </div>

        <div className="overflow-visible">{cover}</div>

        <div>{files}</div>

        {bottomRight && (
          <div className="mt-12 lg:mt-16 lg:pl-8">{bottomRight}</div>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap gap-2 border-t border-stone-800/80 pt-5">
          {actions}
        </div>
      )}
    </div>
  );
}
