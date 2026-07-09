// keel_web/src/modules/media/components/pickers/MediaPickerFolderRow.tsx

// Folder row for media picker browse lists (navigation only, not selectable).

import type { MediaFolder } from "../../api";
import { formatByteSize } from "../../lib/media";
import { MediaFolderIcon } from "../shared/icons";

type MediaPickerFolderRowProps = {
  folder: MediaFolder;
  compact?: boolean;
  onOpen: () => void;
};

export function MediaPickerFolderRow({
  folder,
  compact = false,
  onOpen,
}: MediaPickerFolderRowProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        "flex w-full items-center rounded-lg text-left transition",
        compact ? "gap-2 px-1.5 py-1 hover:bg-stone-900" : "gap-3 border border-transparent px-3 py-2 hover:bg-stone-900/80",
      ].join(" ")}
    >
      <span
        className={[
          "flex shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-200/90 ring-1 ring-amber-400/20",
          compact ? "h-8 w-8" : "h-10 w-10",
        ].join(" ")}
      >
        <MediaFolderIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={[
            "truncate font-medium text-stone-100",
            compact ? "text-[11px] leading-tight" : "text-sm",
          ].join(" ")}
        >
          {folder.name}
        </p>
        {!compact ? (
          <p className="text-xs text-stone-500">Folder · {formatByteSize(folder.byte_size)}</p>
        ) : (
          <p className="truncate text-[10px] text-stone-500">
            Folder
            <span className="mx-1 text-stone-700">·</span>
            {formatByteSize(folder.byte_size)}
          </p>
        )}
      </div>
    </button>
  );
}
