// stack_sandbox/frontend_web/src/modules/projects/components/detail/ProjectDetailView.tsx

// Project detail and create layouts — four-quadrant inline editing.

import type { Project } from "../../api";
import type { ProjectFolder } from "../../api";
import type { AppearanceDraft } from "../../lib/project/appearance";
import type { PendingMediaSelection, PendingMediaUpload, PendingProjectFolder, ProjectFolderTarget } from "../../lib/project/media";
import type { ProjectStatus } from "../../lib/project";
import type { ProjectTitleFontKey } from "../../lib/project/appearance";
import { ProjectFilesSection } from "../media";
import { ProjectKanbanBorderPreview } from "../kanban";
import { ProjectDetailAppearanceColors } from "./ProjectDetailAppearanceColors";
import { ProjectDetailCoverPanel } from "./ProjectDetailCoverPanel";
import { ProjectDetailInlineDescription } from "./ProjectDetailInlineDescription";
import { ProjectDetailInlineStatus } from "./ProjectDetailInlineStatus";
import { ProjectDetailInlineTags } from "./ProjectDetailInlineTags";
import { ProjectDetailInlineTitle } from "./ProjectDetailInlineTitle";
import { ProjectDetailLayout } from "./ProjectDetailLayout";
import { ProjectWorkspaceNavLink } from "./ProjectWorkspaceNavLink";

type ProjectDetailViewProps = {
  project: Project;
  previewProject: Project;
  createMode?: boolean;
  localCoverFile?: File | null;
  appearanceDraft: AppearanceDraft;
  onAppearanceDraftChange: (nextDraft: AppearanceDraft) => void;
  statusDraft: ProjectStatus;
  onStatusDraftChange: (nextStatus: ProjectStatus) => void;
  titleDraft: string;
  onTitleDraftChange: (nextTitle: string) => void;
  titleFontDraft: ProjectTitleFontKey;
  onTitleFontDraftChange: (nextFont: ProjectTitleFontKey) => void;
  descriptionDraft: string;
  onDescriptionDraftChange: (nextDescription: string) => void;
  tagIdsDraft: number[];
  onTagIdsDraftChange: (nextTagIds: number[]) => void;
  mediaFilenameDrafts?: Record<string, string>;
  onMediaFilenameDraftChange?: (mediaId: string, nextFilename: string) => void;
  mediaDeleteDraftIds?: number[];
  onMediaMarkDelete?: (attachmentId: number) => void;
  onMediaRestoreDelete?: (attachmentId: number) => void;
  onMediaMarkDeleteMany?: (attachmentIds: number[]) => void;
  onMediaMarkCover?: (mediaId: string) => void;
  coverPendingClientId?: string | null;
  onMarkPendingCover?: (clientId: string) => void;
  pendingMediaUploads: PendingMediaUpload[];
  pendingMediaSelections?: PendingMediaSelection[];
  onQueueMediaUploads: (
    files: FileList | File[],
    target: {
      projectFolderId: string | null;
      pendingFolderClientId: string | null;
    },
  ) => void;
  onQueueMediaSelections?: (
    media: PendingMediaSelection["media"][],
    target: {
      projectFolderId: string | null;
      pendingFolderClientId: string | null;
    },
  ) => void;
  onRemovePendingMediaUpload: (clientId: string) => void;
  onRemovePendingMediaSelection?: (clientId: string) => void;
  folderNameDrafts?: Record<string, string>;
  onFolderNameDraftChange?: (folderId: string, nextName: string) => void;
  folderDeleteDraftIds?: string[];
  onMarkFolderDelete?: (folderId: string) => void;
  onRestoreFolderDelete?: (folderId: string) => void;
  pendingFolders?: PendingProjectFolder[];
  onQueuePendingFolder?: (folder: PendingProjectFolder) => void;
  onUpdatePendingFolder?: (clientId: string, nextName: string) => void;
  onRemovePendingFolder?: (clientId: string) => void;
  allFolders?: ProjectFolder[];
  folderParentMoveDrafts?: Record<string, ProjectFolderTarget>;
  mediaFolderMoveDrafts?: Record<number, ProjectFolderTarget>;
  onMoveAttachment?: (attachmentId: number, target: ProjectFolderTarget) => void;
  onMoveFolder?: (folderId: string, target: ProjectFolderTarget) => void;
  onMovePendingUpload?: (clientId: string, target: ProjectFolderTarget) => void;
  onMovePendingSelection?: (clientId: string, target: ProjectFolderTarget) => void;
  onMovePendingFolder?: (clientId: string, target: ProjectFolderTarget) => void;
  pageFileDragActive?: boolean;
  savePending?: boolean;
};

export function ProjectDetailView({
  project,
  previewProject,
  createMode = false,
  localCoverFile = null,
  appearanceDraft,
  onAppearanceDraftChange,
  statusDraft,
  onStatusDraftChange,
  titleDraft,
  onTitleDraftChange,
  titleFontDraft,
  onTitleFontDraftChange,
  descriptionDraft,
  onDescriptionDraftChange,
  tagIdsDraft,
  onTagIdsDraftChange,
  mediaFilenameDrafts = {},
  onMediaFilenameDraftChange,
  mediaDeleteDraftIds = [],
  onMediaMarkDelete,
  onMediaRestoreDelete,
  onMediaMarkDeleteMany,
  onMediaMarkCover,
  coverPendingClientId = null,
  onMarkPendingCover,
  pendingMediaUploads,
  pendingMediaSelections = [],
  onQueueMediaUploads,
  onQueueMediaSelections,
  onRemovePendingMediaUpload,
  onRemovePendingMediaSelection,
  folderNameDrafts = {},
  onFolderNameDraftChange,
  folderDeleteDraftIds = [],
  onMarkFolderDelete,
  onRestoreFolderDelete,
  pendingFolders = [],
  onQueuePendingFolder,
  onUpdatePendingFolder,
  onRemovePendingFolder,
  allFolders = [],
  folderParentMoveDrafts = {},
  mediaFolderMoveDrafts = {},
  onMoveAttachment,
  onMoveFolder,
  onMovePendingUpload,
  onMovePendingSelection,
  onMovePendingFolder,
  pageFileDragActive = false,
  savePending = false,
}: ProjectDetailViewProps) {
  return (
    <div className="relative isolate">
      <ProjectKanbanBorderPreview
        colorHex={previewProject.kanban_card_color_hex}
      />
      <div className="relative z-[1] pl-8 pt-8 sm:pl-10 sm:pt-10">
        <ProjectDetailLayout
          meta={
            <ProjectDetailInlineStatus
              statusDraft={statusDraft}
              onStatusDraftChange={onStatusDraftChange}
              disabled={savePending}
            />
          }
          title={
            <div>
              <ProjectDetailInlineTitle
                value={titleDraft}
                onChange={onTitleDraftChange}
                titleFontDraft={titleFontDraft}
                onTitleFontDraftChange={onTitleFontDraftChange}
                disabled={savePending}
              />
              {!createMode && <ProjectWorkspaceNavLink projectId={project.id} />}
            </div>
          }
          tags={
            <ProjectDetailInlineTags
              tagIdsDraft={tagIdsDraft}
              onTagIdsDraftChange={onTagIdsDraftChange}
              disabled={savePending}
            />
          }
          description={
            <ProjectDetailInlineDescription
              value={descriptionDraft}
              onChange={onDescriptionDraftChange}
              disabled={savePending}
            />
          }
          cover={
            <ProjectDetailCoverPanel
              project={previewProject}
              localCoverFile={localCoverFile}
              coverImageScale={appearanceDraft.coverImageScale}
              coverImagePositionX={appearanceDraft.coverImagePositionX}
              coverImagePositionY={appearanceDraft.coverImagePositionY}
              framingDisabled={savePending}
              onCoverImageScaleChange={(nextScale) =>
                onAppearanceDraftChange({
                  ...appearanceDraft,
                  coverImageScale: nextScale,
                })
              }
              onCoverImagePositionChange={(nextX, nextY) =>
                onAppearanceDraftChange({
                  ...appearanceDraft,
                  coverImagePositionX: nextX,
                  coverImagePositionY: nextY,
                })
              }
            />
          }
          coverAside={
            <ProjectDetailAppearanceColors
              previewProject={previewProject}
              appearanceDraft={appearanceDraft}
              onAppearanceDraftChange={onAppearanceDraftChange}
              disabled={savePending}
            />
          }
          files={
            <ProjectFilesSection
              createMode={createMode}
              projectId={project.id}
              coverMediaId={previewProject.cover_media_id}
              coverAppearance={
                previewProject.cover_media_kind === "model_3d"
                  ? {
                      coverGlowColorHex: previewProject.cover_glow_color_hex,
                      coverModelColorHex: previewProject.cover_model_color_hex,
                      coverModelBrightness: previewProject.cover_model_brightness,
                    }
                  : undefined
              }
              coverPendingClientId={coverPendingClientId}
              filenameDrafts={mediaFilenameDrafts}
              onFilenameDraftChange={onMediaFilenameDraftChange}
              deleteDraftIds={mediaDeleteDraftIds}
              onMarkDelete={onMediaMarkDelete}
              onRestoreDelete={onMediaRestoreDelete}
              onMarkDeleteMany={onMediaMarkDeleteMany}
              onMarkCover={onMediaMarkCover}
              onMarkPendingCover={onMarkPendingCover}
              pendingUploads={pendingMediaUploads}
              pendingMediaSelections={pendingMediaSelections}
              onQueueUploads={onQueueMediaUploads}
              onQueueMediaSelections={onQueueMediaSelections}
              onRemovePendingUpload={onRemovePendingMediaUpload}
              onRemovePendingMediaSelection={onRemovePendingMediaSelection}
              folderNameDrafts={folderNameDrafts}
              onFolderNameDraftChange={onFolderNameDraftChange}
              folderDeleteDraftIds={folderDeleteDraftIds}
              onMarkFolderDelete={onMarkFolderDelete}
              onRestoreFolderDelete={onRestoreFolderDelete}
              pendingFolders={pendingFolders}
              onQueuePendingFolder={onQueuePendingFolder}
              onUpdatePendingFolder={onUpdatePendingFolder}
              onRemovePendingFolder={onRemovePendingFolder}
              allFolders={allFolders}
              folderParentMoveDrafts={folderParentMoveDrafts}
              mediaFolderMoveDrafts={mediaFolderMoveDrafts}
              onMoveAttachment={onMoveAttachment}
              onMoveFolder={onMoveFolder}
              onMovePendingUpload={onMovePendingUpload}
              onMovePendingSelection={onMovePendingSelection}
              onMovePendingFolder={onMovePendingFolder}
              pageFileDragActive={pageFileDragActive}
              savePending={savePending}
            />
          }
        />
      </div>
    </div>
  );
}
