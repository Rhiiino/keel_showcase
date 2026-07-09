// keel_web/src/modules/media/components/pickers/MediaFolderDestinationPicker.tsx

// Folder-only browser for choosing upload destination in the paste dialog.

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { fetchMediaFolderContents, mediaQueryKeys } from "../../api";
import { filterMediaPickerBrowseFolders } from "../../lib/mediaPickerBrowse";
import { MediaPickerBreadcrumbs } from "./MediaPickerBreadcrumbs";
import { MediaPickerFolderRow } from "./MediaPickerFolderRow";

export type MediaPasteUploadDestination =
  | { type: "existing"; folderId: string | null }
  | { type: "create"; name: string; parentFolderId: string | null };

type MediaFolderDestinationPickerProps = {
  defaultFolderId: string | null;
  resetToken: string;
  disabled?: boolean;
  onDestinationChange: (destination: MediaPasteUploadDestination) => void;
  onDraftingNewFolderChange?: (isDrafting: boolean) => void;
};

function buildDestinationSummary(
  breadcrumbs: { name: string }[],
  browseFolderId: string | null,
  pendingNewFolderName: string | null,
): string {
  const segments = ["Media", ...breadcrumbs.map((folder) => folder.name)];
  if (pendingNewFolderName) {
    segments.push(`[New folder: ${pendingNewFolderName}]`);
  } else if (browseFolderId === null && breadcrumbs.length === 0) {
    return "Upload to: Media";
  }
  return `Upload to: ${segments.join(" / ")}`;
}

export function MediaFolderDestinationPicker({
  defaultFolderId,
  resetToken,
  disabled = false,
  onDestinationChange,
  onDraftingNewFolderChange,
}: MediaFolderDestinationPickerProps) {
  const [browseFolderId, setBrowseFolderId] = useState<string | null>(defaultFolderId);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  const contentsQuery = useQuery({
    queryKey: mediaQueryKeys.contents(browseFolderId),
    queryFn: () => fetchMediaFolderContents(browseFolderId),
  });

  const breadcrumbs = contentsQuery.data?.breadcrumbs ?? [];
  const folders = useMemo(
    () => filterMediaPickerBrowseFolders(contentsQuery.data?.folders ?? [], ""),
    [contentsQuery.data?.folders],
  );

  useEffect(() => {
    setBrowseFolderId(defaultFolderId);
    setIsCreatingFolder(false);
    setNewFolderName("");
  }, [defaultFolderId, resetToken]);

  useEffect(() => {
    if (isCreatingFolder) {
      newFolderInputRef.current?.focus();
    }
  }, [isCreatingFolder]);

  const trimmedNewFolderName = newFolderName.trim();
  const pendingNewFolderName =
    isCreatingFolder && trimmedNewFolderName.length > 0 ? trimmedNewFolderName : null;

  const destination = useMemo((): MediaPasteUploadDestination => {
    if (pendingNewFolderName) {
      return {
        type: "create",
        name: pendingNewFolderName,
        parentFolderId: browseFolderId,
      };
    }
    return { type: "existing", folderId: browseFolderId };
  }, [browseFolderId, pendingNewFolderName]);

  useEffect(() => {
    onDestinationChange(destination);
  }, [destination, onDestinationChange]);

  useEffect(() => {
    onDraftingNewFolderChange?.(isCreatingFolder);
  }, [isCreatingFolder, onDraftingNewFolderChange]);

  const discardNewFolder = () => {
    setIsCreatingFolder(false);
    setNewFolderName("");
  };

  const handleNavigateFolder = (folderId: string | null) => {
    discardNewFolder();
    setBrowseFolderId(folderId);
  };

  const summary = buildDestinationSummary(breadcrumbs, browseFolderId, pendingNewFolderName);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Folder</p>
        {!isCreatingFolder ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsCreatingFolder(true)}
            className="rounded-md px-2 py-1 text-xs text-sky-300 transition hover:bg-sky-500/10 disabled:opacity-50"
          >
            New folder
          </button>
        ) : null}
      </div>

      <p className="text-xs text-stone-400">{summary}</p>

      <div className="overflow-hidden rounded-lg ring-1 ring-stone-800">
        <MediaPickerBreadcrumbs
          breadcrumbs={breadcrumbs}
          onNavigate={handleNavigateFolder}
          compact
        />

        {isCreatingFolder ? (
          <div className="flex items-center gap-2 border-t border-stone-800 px-2 py-2">
            <input
              ref={newFolderInputRef}
              value={newFolderName}
              disabled={disabled}
              placeholder="New folder name"
              onChange={(event) => setNewFolderName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  discardNewFolder();
                }
              }}
              className="min-w-0 flex-1 rounded-md bg-stone-900/80 px-2 py-1.5 text-sm text-stone-100 outline-none ring-1 ring-stone-700 focus:ring-sky-500/50 disabled:opacity-50"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={discardNewFolder}
              className="shrink-0 rounded-md px-2 py-1.5 text-xs text-stone-400 hover:text-stone-200 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        ) : null}

        <div className="max-h-48 overflow-y-auto border-t border-stone-800 px-1 py-1">
          {contentsQuery.isLoading ? (
            <p className="px-2 py-3 text-xs text-stone-500">Loading folders…</p>
          ) : folders.length === 0 ? (
            <p className="px-2 py-3 text-xs text-stone-500">
              {isCreatingFolder
                ? "File will upload into the new folder above."
                : "No subfolders here."}
            </p>
          ) : (
            folders.map((folder) => (
              <MediaPickerFolderRow
                key={folder.id}
                folder={folder}
                compact
                onOpen={() => handleNavigateFolder(folder.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
