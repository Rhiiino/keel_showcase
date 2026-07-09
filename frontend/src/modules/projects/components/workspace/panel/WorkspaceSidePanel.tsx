// keel_web/src/modules/projects/components/workspace/panel/WorkspaceSidePanel.tsx

// Workspace side panel for project files and canvas notes. Hidden entirely when collapsed.

import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useRef } from "react";

import { IconPlusButton } from "../../../../../components/buttons/IconPlusButton";
import {
  PanelRepositionGrip,
  PanelResizeHandle,
  type PanelSide,
} from "../../../../../components/panels";
import type { MediaSourceChoiceAnchor } from "../../../../media/components/pickers";
import type { MediaObject } from "../../../../media/api";
import type { Project, ProjectCanvas, ProjectFolder } from "../../../api";
import type { PendingMediaUpload } from "../../../lib/project/media";
import type { ProjectFolderTarget } from "../../../lib/project/media/projectFileFolderDrag";
import type { FolderNavCrumb } from "../../../lib/project/media/projectFileFolderScope";
import { WorkspaceCanvasesTab } from "./WorkspaceCanvasesTab";
import { WorkspaceFilesTab } from "./WorkspaceFilesTab";
import { WorkspaceGeneralTab } from "./WorkspaceGeneralTab";
import { WorkspaceNotesTab } from "./WorkspaceNotesTab";
import { useWorkspaceViewContext } from "../context/WorkspaceViewContext";

type WorkspaceSidePanelProps = {
  projectId: number;
  project: Project | null;
  projectLoading?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  width: number;
  side: PanelSide;
  isResizing: boolean;
  isRepositioning: boolean;
  onResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onRepositionPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  pendingUploads: PendingMediaUpload[];
  uploadPending: boolean;
  uploadError: string | null;
  onQueueFiles: (files: FileList | File[], target?: ProjectFolderTarget) => void;
  onRemovePending: (clientId: string) => void;
  onDeleteFile: (mediaId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameFile: (mediaId: string, name: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  deletePending: boolean;
  deletingMediaId: string | null;
  deletingFolderId: string | null;
  deleteError: string | null;
  folderNavStack: FolderNavCrumb[];
  onNavigateFolder: (folderId: string | null) => void;
  onOpenFolder: (folderId: string, name: string) => void;
  allFolders: ProjectFolder[];
  currentFolderId: string | null;
  uploadTarget: ProjectFolderTarget;
  sourceDialogOpen: boolean;
  sourceDialogAnchor: MediaSourceChoiceAnchor | null;
  mediaPickerOpen: boolean;
  onOpenSourceMenu: (anchor: MediaSourceChoiceAnchor) => void;
  onCloseSourceMenu: () => void;
  onOpenMediaPicker: () => void;
  onCloseMediaPicker: () => void;
  onAttachFromLibrary: (media: MediaObject[]) => void;
  onCreateFolder: () => void;
  autoRenameFolderId: string | null;
  onClearAutoRenameFolder: () => void;
  onMoveAttachment: (attachmentId: number, target: ProjectFolderTarget) => void;
  onMoveFolder: (folderId: string, target: ProjectFolderTarget) => void;
  controlsDisabled: boolean;
  activeCanvasId: number;
  canvases: ProjectCanvas[];
  canvasesLoading?: boolean;
  canvasesDeletePending?: boolean;
  onCreateCanvas: () => void;
  onSelectCanvas: (canvasId: number) => void;
  onRenameCanvas: (canvasId: number, name: string) => void;
  onDeleteCanvas: (canvasId: number) => void;
  onSetDefaultCanvas: (canvasId: number) => void;
  autoRenameCanvasId: number | null;
  onClearAutoRenameCanvas: () => void;
  canvasCount?: number;
  totalNoteCount?: number;
  fileCount?: number;
  summaryLoading?: boolean;
  noteCountByCanvasId?: Map<number, number>;
  activeTab: WorkspaceSidePanelTab;
  onActiveTabChange: (tab: WorkspaceSidePanelTab) => void;
};

export type WorkspaceSidePanelTab = "general" | "files" | "notes" | "canvas";

function GeneralTabIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M4.75 5.75h14.5v12.5H4.75z" />
      <path d="M8 9h8M8 12h5M8 15h7" />
    </svg>
  );
}

function FilesTabIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function NotesTabIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M6 3.75h9.25L18 6.5v13.75H6z" />
      <path d="M15 3.75V7h3" />
      <path d="M8.75 10h6.5M8.75 13h6.5M8.75 16h4.5" />
    </svg>
  );
}

function CanvasesTabIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M7 9h10M7 12.5h6" />
    </svg>
  );
}

function CollapseIcon({ side }: { side: PanelSide }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d={side === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

export function WorkspaceSidePanel({
  projectId,
  project,
  projectLoading = false,
  open,
  onOpenChange,
  width,
  side,
  isResizing,
  isRepositioning,
  onResizePointerDown,
  onRepositionPointerDown,
  pendingUploads,
  uploadPending,
  uploadError,
  onQueueFiles,
  onRemovePending,
  onDeleteFile,
  onDeleteFolder,
  onRenameFile,
  onRenameFolder,
  deletePending,
  deletingMediaId,
  deletingFolderId,
  deleteError,
  folderNavStack,
  onNavigateFolder,
  onOpenFolder,
  allFolders,
  currentFolderId,
  uploadTarget,
  sourceDialogOpen,
  sourceDialogAnchor,
  mediaPickerOpen,
  onOpenSourceMenu,
  onCloseSourceMenu,
  onOpenMediaPicker,
  onCloseMediaPicker,
  onAttachFromLibrary,
  onCreateFolder,
  autoRenameFolderId,
  onClearAutoRenameFolder,
  onMoveAttachment,
  onMoveFolder,
  controlsDisabled,
  activeCanvasId,
  canvases,
  canvasesLoading = false,
  canvasesDeletePending = false,
  onCreateCanvas,
  onSelectCanvas,
  onRenameCanvas,
  onDeleteCanvas,
  onSetDefaultCanvas,
  autoRenameCanvasId,
  onClearAutoRenameCanvas,
  canvasCount = 0,
  totalNoteCount = 0,
  fileCount = 0,
  summaryLoading = false,
  noteCountByCanvasId,
  activeTab,
  onActiveTabChange,
}: WorkspaceSidePanelProps) {
  const addButtonRef = useRef<HTMLDivElement>(null);
  const { addWorkspaceNote } = useWorkspaceViewContext();

  if (!open) {
    return null;
  }

  const isLeft = side === "left";
  const borderClass = isLeft ? "border-r" : "border-l";
  const widthTransitionClass = isResizing
    ? ""
    : "transition-[width] duration-300 ease-out motion-reduce:transition-none";

  const handleAddClick = () => {
    if (activeTab === "general") {
      return;
    }

    if (activeTab === "notes") {
      addWorkspaceNote();
      return;
    }

    if (activeTab === "canvas") {
      onCreateCanvas();
      return;
    }

    const rect = addButtonRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    onOpenSourceMenu({
      x: rect.left,
      y: rect.bottom + 4,
    });
  };

  const renderTabButton = (
    tab: WorkspaceSidePanelTab,
    label: string,
    icon: ReactNode,
  ) => {
    const active = activeTab === tab;
    return (
      <button
        type="button"
        onClick={() => onActiveTabChange(tab)}
        aria-pressed={active}
        className={[
          "inline-flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition",
          active
            ? "bg-stone-800/80 text-stone-100 shadow-sm ring-1 ring-inset ring-white/[0.06]"
            : "text-stone-500 hover:bg-stone-900/70 hover:text-stone-300",
        ].join(" ")}
      >
        {icon}
        <span className="truncate">{label}</span>
      </button>
    );
  };

  return (
    <aside
      className={[
        "relative flex h-full shrink-0 flex-col overflow-hidden",
        borderClass,
        "border-stone-800/80 bg-stone-950/30",
        widthTransitionClass,
      ].join(" ")}
      style={{ width }}
      aria-label="Workspace side panel"
    >
      <div
        className="flex h-full min-h-0 shrink-0 flex-col overflow-hidden"
        style={{ width, minWidth: width }}
      >
        <div className="flex shrink-0 flex-row items-center border-b border-stone-800/80">
          {isLeft && (
            <PanelRepositionGrip
              side={side}
              isRepositioning={isRepositioning}
              onPointerDown={onRepositionPointerDown}
            />
          )}

          <div
            role="tablist"
            aria-label="Workspace side panel tabs"
            className="flex min-w-0 flex-1 items-center gap-1 px-2 py-1.5"
          >
            {renderTabButton(
              "general",
              "General",
              <GeneralTabIcon className="h-4 w-4 shrink-0" />,
            )}
            {renderTabButton(
              "files",
              "Files",
              <FilesTabIcon className="h-4 w-4 shrink-0" />,
            )}
            {renderTabButton(
              "notes",
              "Notes",
              <NotesTabIcon className="h-4 w-4 shrink-0" />,
            )}
            {renderTabButton(
              "canvas",
              "Canvas",
              <CanvasesTabIcon className="h-4 w-4 shrink-0" />,
            )}
          </div>

          {activeTab !== "general" ? (
            <div ref={addButtonRef} className="mr-0.5 flex shrink-0 items-center">
              <IconPlusButton
                onClick={handleAddClick}
                ariaLabel={
                  activeTab === "notes"
                    ? "Add note"
                    : activeTab === "canvas"
                      ? "Add canvas"
                      : "Add file"
                }
                title={
                  activeTab === "notes"
                    ? "Add note"
                    : activeTab === "canvas"
                      ? "Add canvas"
                      : "Add file"
                }
                disabled={
                  activeTab === "files"
                    ? controlsDisabled
                    : activeTab === "canvas" && canvasesLoading
                }
                className="h-[22px] w-[22px] rounded-md [&_svg]:h-3 [&_svg]:w-3"
              />
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Collapse side panel"
            title="Collapse panel"
            className="inline-flex h-full shrink-0 items-center justify-center px-2 text-stone-500 transition hover:bg-stone-900/80 hover:text-stone-300"
          >
            <CollapseIcon side={side} />
          </button>

          {!isLeft && (
            <PanelRepositionGrip
              side={side}
              isRepositioning={isRepositioning}
              onPointerDown={onRepositionPointerDown}
            />
          )}
        </div>

        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          aria-label={
            activeTab === "general"
              ? "General"
              : activeTab === "notes"
                ? "Notes"
                : activeTab === "canvas"
                  ? "Canvas"
                  : "Files"
          }
        >
          {activeTab === "general" ? (
            <WorkspaceGeneralTab
              project={project}
              loading={projectLoading}
              disabled={controlsDisabled}
              canvasCount={canvasCount}
              noteCount={totalNoteCount}
              fileCount={fileCount}
              summaryLoading={summaryLoading}
            />
          ) : activeTab === "files" ? (
            <WorkspaceFilesTab
              projectId={projectId}
              pendingUploads={pendingUploads}
              uploadPending={uploadPending}
              uploadError={uploadError}
              onQueueFiles={onQueueFiles}
              onRemovePending={onRemovePending}
              onDeleteFile={onDeleteFile}
              onDeleteFolder={onDeleteFolder}
              onRenameFile={onRenameFile}
              onRenameFolder={onRenameFolder}
              deletePending={deletePending}
              deletingMediaId={deletingMediaId}
              deletingFolderId={deletingFolderId}
              deleteError={deleteError}
              folderNavStack={folderNavStack}
              onNavigateFolder={onNavigateFolder}
              onOpenFolder={onOpenFolder}
              allFolders={allFolders}
              currentFolderId={currentFolderId}
              uploadTarget={uploadTarget}
              sourceDialogOpen={sourceDialogOpen}
              sourceDialogAnchor={sourceDialogAnchor}
              mediaPickerOpen={mediaPickerOpen}
              onOpenSourceMenu={onOpenSourceMenu}
              onCloseSourceMenu={onCloseSourceMenu}
              onOpenMediaPicker={onOpenMediaPicker}
              onCloseMediaPicker={onCloseMediaPicker}
              onAttachFromLibrary={onAttachFromLibrary}
              onCreateFolder={onCreateFolder}
              autoRenameFolderId={autoRenameFolderId}
              onClearAutoRenameFolder={onClearAutoRenameFolder}
              onMoveAttachment={onMoveAttachment}
              onMoveFolder={onMoveFolder}
              controlsDisabled={controlsDisabled}
            />
          ) : activeTab === "notes" ? (
            <WorkspaceNotesTab />
          ) : (
            <WorkspaceCanvasesTab
              canvases={canvases}
              activeCanvasId={activeCanvasId}
              disabled={controlsDisabled || canvasesLoading}
              deletePending={canvasesDeletePending}
              noteCountByCanvasId={noteCountByCanvasId}
              onSelectCanvas={onSelectCanvas}
              onRenameCanvas={onRenameCanvas}
              onDeleteCanvas={onDeleteCanvas}
              onSetDefaultCanvas={onSetDefaultCanvas}
              autoRenameCanvasId={autoRenameCanvasId}
              onClearAutoRenameCanvas={onClearAutoRenameCanvas}
            />
          )}
        </div>
      </div>

      <PanelResizeHandle
        side={side}
        isResizing={isResizing}
        onPointerDown={onResizePointerDown}
      />
    </aside>
  );
}
