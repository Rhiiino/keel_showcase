// keel_web/src/modules/media/components/pickers/MediaPickerBreadcrumbs.tsx

// Compact folder path breadcrumbs for media picker modals.

import type { MediaFolder } from "../../api";

type MediaPickerBreadcrumbsProps = {
  breadcrumbs: MediaFolder[];
  onNavigate: (folderId: string | null) => void;
  compact?: boolean;
};

export function MediaPickerBreadcrumbs({
  breadcrumbs,
  onNavigate,
  compact = false,
}: MediaPickerBreadcrumbsProps) {
  if (breadcrumbs.length === 0) {
    return null;
  }

  const segmentClassName = compact
    ? "max-w-[10rem] truncate rounded px-1 py-0.5 text-[11px] text-stone-400 transition hover:bg-stone-900/70 hover:text-stone-200"
    : "max-w-[12rem] truncate rounded px-1.5 py-0.5 text-xs text-stone-400 transition hover:bg-stone-900/70 hover:text-stone-200";

  const currentClassName = compact
    ? "max-w-[10rem] truncate rounded px-1 py-0.5 text-[11px] font-medium text-stone-200"
    : "max-w-[12rem] truncate rounded px-1.5 py-0.5 text-xs font-medium text-stone-200";

  return (
    <nav
      aria-label="Media folder path"
      className={[
        "flex flex-wrap items-center gap-1 text-stone-500",
        compact ? "px-2 pb-1 pt-1" : "px-3 pb-1.5 pt-1",
      ].join(" ")}
    >
      <button type="button" onClick={() => onNavigate(null)} className={segmentClassName}>
        Media
      </button>
      {breadcrumbs.map((folder, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <span key={folder.id} className="flex min-w-0 items-center gap-1">
            <span aria-hidden className={compact ? "text-[10px]" : "text-xs"}>
              /
            </span>
            {isLast ? (
              <span className={currentClassName}>{folder.name}</span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(folder.id)}
                className={segmentClassName}
              >
                {folder.name}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
