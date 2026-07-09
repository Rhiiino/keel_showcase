// stack_sandbox/frontend_web/src/modules/projects/pages/ProjectDetailPage.tsx

// Single project display view with inline draft editing and Save.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { useRecordNotFoundRedirect } from "../../../hooks/useRecordNotFoundRedirect";
import { FormPageLayout } from "../../../views";

import {
  fetchProject,
  fetchProjectFolders,
  fetchProjectMedia,
  projectsQueryKeys,
  updateProject,
  type Project,
  type ProjectUpdatePayload,
} from "../api";
import {
  applyMediaDraftChanges,
  buildFolderNameDrafts,
  buildMediaFilenameDrafts,
  folderDraftIsDirty,
  folderNameDraftsKey,
  mediaDraftIsDirty,
  mediaFilenameDraftsKey,
  queuePendingMediaFiles,
  queuePendingMediaSelections,
  movePendingFolderToTarget,
  movePendingSelectionToTarget,
  movePendingUploadToTarget,
  type PendingMediaSelection,
  type PendingMediaUpload,
  type PendingProjectFolder,
  type ProjectFolderTarget,
} from "../lib/project/media";
import { usePageFileDrop } from "../../../hooks/usePageFileDrop";
import {
  applyAppearanceDraftChanges,
  appearanceDraftIsDirty,
  buildAppearanceDraft,
  projectWithAppearanceDraft,
  type AppearanceDraft,
} from "../lib/project/appearance";
import { sameTagIdSets } from "../lib/project";
import { isProjectStatus, type ProjectStatus } from "../lib/project";
import {
  DEFAULT_TITLE_FONT_KEY,
  resolveProjectTitleFontKey,
  type ProjectTitleFontKey,
} from "../lib/project/appearance";
import { ProjectDetailView } from "../components/detail";

function projectTagIds(project: { tags: { id: number }[] }): number[] {
  return project.tags.map((tag) => tag.id);
}

const EMPTY_APPEARANCE_DRAFT: AppearanceDraft = {
  coverMediaId: null,
  coverGlowColorHex: null,
  coverModelColorHex: null,
  coverModelBrightness: 1,
  coverImageScale: 1,
  coverImagePositionX: 50,
  coverImagePositionY: 50,
  kanbanCardColorHex: null,
};

export function ProjectDetailPage() {
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const projectId = Number(projectIdParam);
  const invalidProjectId = !Number.isFinite(projectId) || projectId <= 0;
  const queryClient = useQueryClient();
  const [statusDraft, setStatusDraft] = useState<ProjectStatus>("planning");
  const [titleDraft, setTitleDraft] = useState("");
  const [titleFontDraft, setTitleFontDraft] =
    useState<ProjectTitleFontKey>(DEFAULT_TITLE_FONT_KEY);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [tagIdsDraft, setTagIdsDraft] = useState<number[]>([]);
  const [mediaFilenameDrafts, setMediaFilenameDrafts] = useState<
    Record<string, string>
  >({});
  const [mediaDeleteDraftIds, setMediaDeleteDraftIds] = useState<number[]>([]);
  const [pendingMediaUploads, setPendingMediaUploads] = useState<
    PendingMediaUpload[]
  >([]);
  const [pendingMediaSelections, setPendingMediaSelections] = useState<
    PendingMediaSelection[]
  >([]);
  const [pendingFolders, setPendingFolders] = useState<PendingProjectFolder[]>(
    [],
  );
  const [folderNameDrafts, setFolderNameDrafts] = useState<
    Record<string, string>
  >({});
  const [folderDeleteDraftIds, setFolderDeleteDraftIds] = useState<string[]>(
    [],
  );
  const [folderParentMoveDrafts, setFolderParentMoveDrafts] = useState<
    Record<string, ProjectFolderTarget>
  >({});
  const [mediaFolderMoveDrafts, setMediaFolderMoveDrafts] = useState<
    Record<number, ProjectFolderTarget>
  >({});
  const [appearanceDraft, setAppearanceDraft] =
    useState<AppearanceDraft>(EMPTY_APPEARANCE_DRAFT);

  const projectQuery = useQuery({
    queryKey: projectsQueryKeys.detail(projectId),
    queryFn: () => fetchProject(projectId),
    enabled: !invalidProjectId,
  });

  const project = projectQuery.data;

  const redirecting = useRecordNotFoundRedirect({
    invalidId: invalidProjectId,
    isLoading: projectQuery.isLoading,
    error: projectQuery.error,
    isFetched: projectQuery.isFetched,
    hasData: Boolean(projectQuery.data),
    listPath: "/projects",
    notice: "That project could not be found.",
  });

  const mediaQuery = useQuery({
    queryKey: projectsQueryKeys.media(projectId),
    queryFn: () => fetchProjectMedia(projectId),
    enabled: !invalidProjectId && Boolean(project),
  });

  const foldersQuery = useQuery({
    queryKey: [...projectsQueryKeys.folders(projectId, null), "all"],
    queryFn: () => fetchProjectFolders(projectId, { all: true }),
    enabled: !invalidProjectId && Boolean(project),
  });

  const savedMediaKey = mediaFilenameDraftsKey(mediaQuery.data ?? []);
  const savedFoldersKey = folderNameDraftsKey(foldersQuery.data ?? []);

  const savedTagIdsKey =
    project?.tags
      .map((tag) => tag.id)
      .sort((a, b) => a - b)
      .join(",") ?? "";

  useEffect(() => {
    if (project) {
      setStatusDraft(
        isProjectStatus(project.status) ? project.status : "planning",
      );
      setTitleDraft(project.title);
      setTitleFontDraft(resolveProjectTitleFontKey(project.title_font_key));
      setDescriptionDraft(project.description);
      setTagIdsDraft(projectTagIds(project));
      setAppearanceDraft(buildAppearanceDraft(project));
    }
  }, [
    project?.id,
    project?.status,
    project?.title,
    project?.title_font_key,
    project?.description,
    project?.cover_media_id,
    project?.cover_glow_color_hex,
    project?.cover_model_color_hex,
    project?.cover_model_brightness,
    project?.cover_image_scale,
    project?.cover_image_position_x,
    project?.cover_image_position_y,
    project?.kanban_card_color_hex,
    savedTagIdsKey,
  ]);

  useEffect(() => {
    if (mediaQuery.data) {
      setMediaFilenameDrafts(buildMediaFilenameDrafts(mediaQuery.data));
      setMediaDeleteDraftIds([]);
      setMediaFolderMoveDrafts({});
    }
  }, [projectId, savedMediaKey]);

  useEffect(() => {
    if (foldersQuery.data) {
      setFolderNameDrafts(buildFolderNameDrafts(foldersQuery.data));
      setFolderDeleteDraftIds([]);
      setFolderParentMoveDrafts({});
    }
  }, [projectId, savedFoldersKey]);

  const queueMediaUploads = useCallback(
    (
      files: FileList | File[],
      target?: {
        projectFolderId?: string | null;
        pendingFolderClientId?: string | null;
      },
    ) => {
      setPendingMediaUploads((current) =>
        queuePendingMediaFiles(current, files, target),
      );
    },
    [],
  );

  const pageFileDragActive = usePageFileDrop({
    enabled: Boolean(project),
    onDropFiles: queueMediaUploads,
  });

  const previewProject = useMemo(() => {
    if (!project) {
      return null;
    }

    return projectWithAppearanceDraft(
      project,
      appearanceDraft,
      mediaQuery.data ?? [],
      mediaDeleteDraftIds,
    );
  }, [appearanceDraft, mediaDeleteDraftIds, mediaQuery.data, project]);

  const {
    statusIsDirty,
    titleIsDirty,
    titleFontIsDirty,
    descriptionIsDirty,
    tagsIsDirty,
    mediaIsDirty,
    foldersIsDirty,
    appearanceIsDirty,
    canSaveDisplay,
  } = useMemo(() => {
    if (!project) {
      return {
        statusIsDirty: false,
        titleIsDirty: false,
        titleFontIsDirty: false,
        descriptionIsDirty: false,
        tagsIsDirty: false,
        mediaIsDirty: false,
        foldersIsDirty: false,
        appearanceIsDirty: false,
        canSaveDisplay: false,
      };
    }

    const nextTitle = titleDraft.trim();
    const nextDescription = descriptionDraft.trim();
    const savedTagIds = projectTagIds(project);
    const savedStatus = isProjectStatus(project.status)
      ? project.status
      : "planning";
    const statusDirty = statusDraft !== savedStatus;
    const titleDirty = nextTitle.length > 0 && nextTitle !== project.title;
    const savedTitleFont = resolveProjectTitleFontKey(project.title_font_key);
    const titleFontDirty = titleFontDraft !== savedTitleFont;
    const descriptionDirty = nextDescription !== project.description;
    const tagsDirty = !sameTagIdSets(tagIdsDraft, savedTagIds);
    const mediaDirty = mediaQuery.data
      ? mediaDraftIsDirty(
          mediaQuery.data,
          mediaFilenameDrafts,
          mediaDeleteDraftIds,
          pendingMediaUploads,
          pendingMediaSelections,
          mediaFolderMoveDrafts,
        )
      : pendingMediaUploads.some((item) => !item.error) ||
        pendingMediaSelections.length > 0;
    const foldersDirty = foldersQuery.data
      ? folderDraftIsDirty(
          foldersQuery.data,
          folderNameDrafts,
          folderDeleteDraftIds,
          pendingFolders,
          folderParentMoveDrafts,
        )
      : pendingFolders.length > 0;
    const appearanceDirty = appearanceDraftIsDirty(project, appearanceDraft);

    return {
      statusIsDirty: statusDirty,
      titleIsDirty: titleDirty,
      titleFontIsDirty: titleFontDirty,
      descriptionIsDirty: descriptionDirty,
      tagsIsDirty: tagsDirty,
      mediaIsDirty: mediaDirty,
      foldersIsDirty: foldersDirty,
      appearanceIsDirty: appearanceDirty,
      canSaveDisplay:
        statusDirty ||
        titleDirty ||
        titleFontDirty ||
        descriptionDirty ||
        tagsDirty ||
        mediaDirty ||
        foldersDirty ||
        appearanceDirty,
    };
  }, [
    appearanceDraft,
    descriptionDraft,
    folderDeleteDraftIds,
    folderNameDrafts,
    folderParentMoveDrafts,
    foldersQuery.data,
    mediaDeleteDraftIds,
    mediaFilenameDrafts,
    mediaFolderMoveDrafts,
    mediaQuery.data,
    pendingFolders,
    pendingMediaSelections,
    pendingMediaUploads,
    project,
    statusDraft,
    tagIdsDraft,
    titleDraft,
    titleFontDraft,
  ]);

  const saveDisplayMutation = useMutation({
    mutationFn: async (): Promise<Project | undefined> => {
      if (!project) {
        return undefined;
      }

      let savedProject: Project | undefined;

      const hasProjectFieldChanges =
        statusIsDirty ||
        titleIsDirty ||
        titleFontIsDirty ||
        descriptionIsDirty ||
        tagsIsDirty;

      if (mediaIsDirty || foldersIsDirty) {
        await applyMediaDraftChanges(
          projectId,
          mediaQuery.data ?? [],
          mediaFilenameDrafts,
          mediaDeleteDraftIds,
          pendingMediaUploads,
          pendingMediaSelections,
          foldersQuery.data ?? [],
          folderNameDrafts,
          folderDeleteDraftIds,
          pendingFolders,
          folderParentMoveDrafts,
          mediaFolderMoveDrafts,
        );
      }

      if (hasProjectFieldChanges) {
        const payload: ProjectUpdatePayload = {};
        if (statusIsDirty) {
          payload.status = statusDraft;
        }
        if (titleIsDirty) {
          payload.title = titleDraft.trim();
        }
        if (titleFontIsDirty) {
          payload.title_font_key =
            titleFontDraft === DEFAULT_TITLE_FONT_KEY ? null : titleFontDraft;
        }
        if (descriptionIsDirty) {
          payload.description = descriptionDraft.trim();
        }
        if (tagsIsDirty) {
          payload.tag_ids = tagIdsDraft;
        }
        savedProject = await updateProject(projectId, payload);
      }

      if (appearanceIsDirty) {
        savedProject =
          (await applyAppearanceDraftChanges(
            projectId,
            project,
            appearanceDraft,
            mediaDeleteDraftIds,
            mediaQuery.data ?? [],
          )) ?? savedProject;
      }

      return savedProject;
    },
    onSuccess: (savedProject) => {
      setPendingMediaUploads([]);
      setPendingMediaSelections([]);
      setPendingFolders([]);
      setFolderParentMoveDrafts({});
      setMediaFolderMoveDrafts({});
      if (savedProject) {
        queryClient.setQueryData(
          projectsQueryKeys.detail(projectId),
          savedProject,
        );
        queryClient.setQueryData<Project[]>(
          projectsQueryKeys.list(),
          (list) =>
            list?.map((item) =>
              item.id === projectId ? savedProject : item,
            ) ?? [],
        );
      }
      queryClient.invalidateQueries({
        queryKey: projectsQueryKeys.detail(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectsQueryKeys.media(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectsQueryKeys.folders(projectId, null),
      });
      queryClient.invalidateQueries({ queryKey: projectsQueryKeys.list() });
    },
  });

  const markMediaDelete = (attachmentId: number) => {
    setMediaDeleteDraftIds((current) =>
      current.includes(attachmentId) ? current : [...current, attachmentId],
    );
  };

  const restoreMediaDelete = (attachmentId: number) => {
    setMediaDeleteDraftIds((current) =>
      current.filter((id) => id !== attachmentId),
    );
  };

  const markMediaDeleteMany = (attachmentIds: number[]) => {
    setMediaDeleteDraftIds((current) => {
      const next = new Set([...current, ...attachmentIds]);
      return Array.from(next);
    });
  };

  const updateMediaFilenameDraft = (mediaId: string, nextFilename: string) => {
    setMediaFilenameDrafts((current) => ({
      ...current,
      [mediaId]: nextFilename,
    }));
  };

  const removePendingMediaUpload = (clientId: string) => {
    setPendingMediaUploads((current) =>
      current.filter((item) => item.clientId !== clientId),
    );
  };

  const queueMediaSelections = useCallback(
    (
      mediaObjects: PendingMediaSelection["media"][],
      target?: {
        projectFolderId?: string | null;
        pendingFolderClientId?: string | null;
      },
    ) => {
      setPendingMediaSelections((current) =>
        queuePendingMediaSelections(current, mediaObjects, target),
      );
    },
    [],
  );

  const removePendingMediaSelection = (clientId: string) => {
    setPendingMediaSelections((current) =>
      current.filter((item) => item.clientId !== clientId),
    );
  };

  const queuePendingFolder = (folder: PendingProjectFolder) => {
    setPendingFolders((current) => [...current, folder]);
  };

  const updatePendingFolder = (clientId: string, nextName: string) => {
    setPendingFolders((current) =>
      current.map((folder) =>
        folder.clientId === clientId ? { ...folder, name: nextName } : folder,
      ),
    );
  };

  const removePendingFolder = (clientId: string) => {
    setPendingFolders((current) =>
      current.filter((folder) => folder.clientId !== clientId),
    );
  };

  const markFolderDelete = (folderId: string) => {
    setFolderDeleteDraftIds((current) =>
      current.includes(folderId) ? current : [...current, folderId],
    );
  };

  const restoreFolderDelete = (folderId: string) => {
    setFolderDeleteDraftIds((current) =>
      current.filter((id) => id !== folderId),
    );
  };

  const updateFolderNameDraft = (folderId: string, nextName: string) => {
    setFolderNameDrafts((current) => ({
      ...current,
      [folderId]: nextName,
    }));
  };

  const moveAttachment = (attachmentId: number, target: ProjectFolderTarget) => {
    setMediaFolderMoveDrafts((current) => ({
      ...current,
      [attachmentId]: target,
    }));
  };

  const moveFolder = (folderId: string, target: ProjectFolderTarget) => {
    setFolderParentMoveDrafts((current) => ({
      ...current,
      [folderId]: target,
    }));
  };

  const movePendingUpload = (clientId: string, target: ProjectFolderTarget) => {
    setPendingMediaUploads((current) =>
      movePendingUploadToTarget(current, clientId, target),
    );
  };

  const movePendingSelection = (clientId: string, target: ProjectFolderTarget) => {
    setPendingMediaSelections((current) =>
      movePendingSelectionToTarget(current, clientId, target),
    );
  };

  const movePendingFolder = (clientId: string, target: ProjectFolderTarget) => {
    setPendingFolders((current) =>
      movePendingFolderToTarget(current, clientId, target),
    );
  };

  const markMediaCover = (mediaId: string) => {
    setAppearanceDraft((current) => ({
      ...current,
      coverMediaId: mediaId,
    }));
  };

  const discardDisplayDrafts = useCallback(() => {
    if (!project) {
      return;
    }

    setStatusDraft(
      isProjectStatus(project.status) ? project.status : "planning",
    );
    setTitleDraft(project.title);
    setTitleFontDraft(resolveProjectTitleFontKey(project.title_font_key));
    setDescriptionDraft(project.description);
    setTagIdsDraft(projectTagIds(project));
    setAppearanceDraft(buildAppearanceDraft(project));
    setMediaFilenameDrafts(buildMediaFilenameDrafts(mediaQuery.data ?? []));
    setMediaDeleteDraftIds([]);
    setPendingMediaUploads([]);
    setPendingMediaSelections([]);
    setMediaFolderMoveDrafts({});
    setFolderNameDrafts(buildFolderNameDrafts(foldersQuery.data ?? []));
    setFolderDeleteDraftIds([]);
    setPendingFolders([]);
    setFolderParentMoveDrafts({});
  }, [foldersQuery.data, mediaQuery.data, project]);

  if (redirecting || projectQuery.isLoading) {
    return (
      <FormPageLayout backHref="/projects" backLabel="Back to projects" maxWidth="5xl">
        <p className="text-sm text-stone-500">Loading project…</p>
      </FormPageLayout>
    );
  }

  if (!project || !previewProject) {
    return null;
  }

  return (
    <FormPageLayout
      backHref="/projects"
      backLabel="Back to projects"
      maxWidth="5xl"
      isDirty={canSaveDisplay}
      onDiscard={discardDisplayDrafts}
      onSave={() => saveDisplayMutation.mutate()}
      isSaving={saveDisplayMutation.isPending}
      canSave={titleDraft.trim().length > 0}
      errorMessage={
        saveDisplayMutation.isError ? saveDisplayMutation.error.message : null
      }
    >
          <ProjectDetailView
            project={project}
            previewProject={previewProject}
            appearanceDraft={appearanceDraft}
            onAppearanceDraftChange={setAppearanceDraft}
            statusDraft={statusDraft}
            onStatusDraftChange={setStatusDraft}
            titleDraft={titleDraft}
            onTitleDraftChange={setTitleDraft}
            titleFontDraft={titleFontDraft}
            onTitleFontDraftChange={setTitleFontDraft}
            descriptionDraft={descriptionDraft}
            onDescriptionDraftChange={setDescriptionDraft}
            tagIdsDraft={tagIdsDraft}
            onTagIdsDraftChange={setTagIdsDraft}
            mediaFilenameDrafts={mediaFilenameDrafts}
            onMediaFilenameDraftChange={updateMediaFilenameDraft}
            mediaDeleteDraftIds={mediaDeleteDraftIds}
            onMediaMarkDelete={markMediaDelete}
            onMediaRestoreDelete={restoreMediaDelete}
            onMediaMarkDeleteMany={markMediaDeleteMany}
            onMediaMarkCover={markMediaCover}
            pendingMediaUploads={pendingMediaUploads}
            pendingMediaSelections={pendingMediaSelections}
            onQueueMediaUploads={queueMediaUploads}
            onQueueMediaSelections={queueMediaSelections}
            onRemovePendingMediaUpload={removePendingMediaUpload}
            onRemovePendingMediaSelection={removePendingMediaSelection}
            folderNameDrafts={folderNameDrafts}
            onFolderNameDraftChange={updateFolderNameDraft}
            folderDeleteDraftIds={folderDeleteDraftIds}
            onMarkFolderDelete={markFolderDelete}
            onRestoreFolderDelete={restoreFolderDelete}
            pendingFolders={pendingFolders}
            onQueuePendingFolder={queuePendingFolder}
            onUpdatePendingFolder={updatePendingFolder}
            onRemovePendingFolder={removePendingFolder}
            allFolders={foldersQuery.data ?? []}
            folderParentMoveDrafts={folderParentMoveDrafts}
            mediaFolderMoveDrafts={mediaFolderMoveDrafts}
            onMoveAttachment={moveAttachment}
            onMoveFolder={moveFolder}
            onMovePendingUpload={movePendingUpload}
            onMovePendingSelection={movePendingSelection}
            onMovePendingFolder={movePendingFolder}
            pageFileDragActive={pageFileDragActive}
            savePending={saveDisplayMutation.isPending}
          />
    </FormPageLayout>
  );
}
