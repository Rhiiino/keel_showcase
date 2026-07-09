// keel_web/src/modules/projects/components/media/ProjectFolderBreadcrumb.tsx

// Drill-in breadcrumb for project file folders with drag-and-drop targets.

import type { DragEvent, ReactNode } from "react";

import {
  hasProjectDragData,
  projectFolderDropTargetKey,
} from "../../lib/project/media";
import { projectFolderDropTargetAttr } from "../../lib/project/media/projectFileFolderDragSession";

type FolderCrumb = {
  id: string | null;
  name: string;
};

type ProjectFolderBreadcrumbProps = {
  crumbs: FolderCrumb[];
  onNavigate: (folderId: string | null) => void;
  disabled?: boolean;
  inline?: boolean;
  isDragging?: boolean;
  dropTargetKey?: string | null;
  onDragEnterFolder?: (dropTargetKey: string) => void;
  onDragLeaveFolder?: (dropTargetKey: string) => void;
  onDropOnFolder?: (event: DragEvent<HTMLElement>, crumb: FolderCrumb) => void;
};

export function ProjectFolderBreadcrumb({
  crumbs,
  onNavigate,
  disabled = false,
  inline = false,
  isDragging = false,
  dropTargetKey = null,
  onDragEnterFolder,
  onDragLeaveFolder,
  onDropOnFolder,
}: ProjectFolderBreadcrumbProps) {
  if (crumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Project folder path"
      className={[
        "flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-stone-500",
        inline ? "" : "mt-2",
      ].join(" ")}
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const crumbDropKey = projectFolderDropTargetKey(
          crumb.id?.startsWith("pending:") ? null : crumb.id,
          crumb.id?.startsWith("pending:") ? crumb.id.slice("pending:".length) : null,
        );

        return (
          <span key={crumb.id ?? "root"} className="inline-flex min-w-0 items-center gap-1.5">
            {index > 0 ? (
              <span className="text-stone-700" aria-hidden>
                /
              </span>
            ) : null}
            <BreadcrumbTarget
              isLast={isLast}
              disabled={disabled}
              isDragging={isDragging}
              isDropTarget={dropTargetKey === crumbDropKey}
              dropTargetKey={crumbDropKey}
              onNavigate={() => onNavigate(crumb.id)}
              onDragEnterFolder={() => onDragEnterFolder?.(crumbDropKey)}
              onDragLeaveFolder={() => onDragLeaveFolder?.(crumbDropKey)}
              onDrop={(event) => onDropOnFolder?.(event, crumb)}
            >
              {crumb.name}
            </BreadcrumbTarget>
          </span>
        );
      })}
    </nav>
  );
}

type BreadcrumbTargetProps = {
  children: ReactNode;
  isLast: boolean;
  disabled: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  dropTargetKey: string;
  onNavigate: () => void;
  onDragEnterFolder?: () => void;
  onDragLeaveFolder?: () => void;
  onDrop?: (event: DragEvent<HTMLElement>) => void;
};

function BreadcrumbTarget({
  children,
  isLast,
  disabled,
  isDragging,
  isDropTarget,
  dropTargetKey,
  onNavigate,
  onDragEnterFolder,
  onDragLeaveFolder,
  onDrop,
}: BreadcrumbTargetProps) {
  const canDrop = isDragging && Boolean(onDrop);
  const className = [
    "inline-flex max-w-[14rem] items-center truncate rounded px-1.5 py-0.5 transition-all duration-200 ease-out",
    isLast ? "font-medium text-stone-200" : "text-stone-400 hover:bg-stone-900/60 hover:text-stone-200",
    isDragging
      ? "scale-[1.02] rounded-xl border border-sky-400/30 bg-sky-500/[0.06] px-3 py-1.5 text-sky-100 shadow-sm shadow-sky-950/30 ring-1 ring-inset ring-sky-400/10"
      : "border border-transparent",
    isDropTarget
      ? "border-sky-300/70 bg-sky-400/20 text-sky-50 shadow-sky-500/20 ring-2 ring-inset ring-sky-300/60"
      : "",
  ].join(" ");

  const dragHandlers = canDrop
    ? {
        onDragOver: (event: DragEvent<HTMLElement>) => {
          if (!hasProjectDragData(event)) {
            return;
          }
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          onDragEnterFolder?.();
        },
        onDragEnter: (event: DragEvent<HTMLElement>) => {
          if (!hasProjectDragData(event)) {
            return;
          }
          event.preventDefault();
          onDragEnterFolder?.();
        },
        onDragLeave: (event: DragEvent<HTMLElement>) => {
          const relatedTarget = event.relatedTarget;
          if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
            return;
          }
          onDragLeaveFolder?.();
        },
        onDrop: (event: DragEvent<HTMLElement>) => {
          if (!hasProjectDragData(event)) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          onDrop?.(event);
        },
      }
    : {};

  if (isLast) {
    return (
      <span
        className={className}
        {...{ [projectFolderDropTargetAttr]: dropTargetKey }}
        {...dragHandlers}
      >
        <span className="truncate">{children}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onNavigate}
      className={[className, disabled ? "cursor-not-allowed opacity-50" : ""].join(" ")}
      {...{ [projectFolderDropTargetAttr]: dropTargetKey }}
      {...dragHandlers}
    >
      <span className="truncate">{children}</span>
    </button>
  );
}
