// stack_sandbox/frontend_web/src/modules/projects/pages/ProjectCreatePage.tsx

// New project page — same layout as detail view; Create persists the record.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FormPageLayout } from "../../../views";

import { projectsQueryKeys } from "../api";
import { ProjectDetailView } from "../components/detail";
import { usePageFileDrop } from "../../../hooks/usePageFileDrop";
import type { AppearanceDraft } from "../lib/project/appearance";
import {
  buildCreatePreviewProject,
  createProjectWithDrafts,
  resolveCreateLocalCoverFile,
} from "../lib/project";
import {
  queuePendingMediaFiles,
  type PendingMediaUpload,
} from "../lib/project/media";
import type { ProjectStatus } from "../lib/project";
import {
  DEFAULT_TITLE_FONT_KEY,
  type ProjectTitleFontKey,
} from "../lib/project/appearance";

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

export function ProjectCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusDraft, setStatusDraft] = useState<ProjectStatus>("planning");
  const [titleDraft, setTitleDraft] = useState("");
  const [titleFontDraft, setTitleFontDraft] =
    useState<ProjectTitleFontKey>(DEFAULT_TITLE_FONT_KEY);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [tagIdsDraft, setTagIdsDraft] = useState<number[]>([]);
  const [appearanceDraft, setAppearanceDraft] =
    useState<AppearanceDraft>(EMPTY_APPEARANCE_DRAFT);
  const [pendingMediaUploads, setPendingMediaUploads] = useState<
    PendingMediaUpload[]
  >([]);
  const [coverPendingClientId, setCoverPendingClientId] = useState<string | null>(
    null,
  );

  const queueMediaUploads = useCallback((files: FileList | File[]) => {
    setPendingMediaUploads((current) => queuePendingMediaFiles(current, files));
  }, []);

  const pageFileDragActive = usePageFileDrop({
    enabled: true,
    onDropFiles: queueMediaUploads,
  });

  const previewProject = useMemo(
    () =>
      buildCreatePreviewProject(
        titleDraft,
        descriptionDraft,
        statusDraft,
        titleFontDraft,
        appearanceDraft,
        pendingMediaUploads,
        coverPendingClientId,
      ),
    [
      appearanceDraft,
      coverPendingClientId,
      descriptionDraft,
      pendingMediaUploads,
      statusDraft,
      titleDraft,
      titleFontDraft,
    ],
  );

  const localCoverFile = useMemo(
    () =>
      resolveCreateLocalCoverFile(pendingMediaUploads, coverPendingClientId),
    [coverPendingClientId, pendingMediaUploads],
  );

  const canCreate = titleDraft.trim().length > 0;

  const createMutation = useMutation({
    mutationFn: () =>
      createProjectWithDrafts(
        {
          title: titleDraft.trim(),
          description: descriptionDraft.trim(),
          status: statusDraft,
        },
        {
          tagIdsDraft,
          titleFontDraft,
          appearanceDraft,
          pendingUploads: pendingMediaUploads,
          coverPendingClientId,
        },
      ),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: projectsQueryKeys.all });
      navigate(`/projects/${created.id}`, { replace: true });
    },
  });

  const removePendingMediaUpload = (clientId: string) => {
    setPendingMediaUploads((current) =>
      current.filter((item) => item.clientId !== clientId),
    );
    setCoverPendingClientId((current) =>
      current === clientId ? null : current,
    );
  };

  const markPendingCover = (clientId: string) => {
    setCoverPendingClientId(clientId);
    setAppearanceDraft((current) => ({
      ...current,
      coverMediaId: null,
    }));
  };

  return (
    <FormPageLayout
      backHref="/projects"
      backLabel="Back to projects"
      maxWidth="5xl"
      headerAction={
        <button
          type="button"
          onClick={() => createMutation.mutate()}
          disabled={!canCreate || createMutation.isPending}
          className="rounded-lg bg-sky-500/90 px-4 py-2 text-sm font-medium text-stone-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createMutation.isPending ? "Creating…" : "Create"}
        </button>
      }
      errorMessage={createMutation.isError ? createMutation.error.message : null}
    >
        <ProjectDetailView
          createMode
          project={previewProject}
          previewProject={previewProject}
          localCoverFile={localCoverFile}
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
          coverPendingClientId={coverPendingClientId}
          onMarkPendingCover={markPendingCover}
          pendingMediaUploads={pendingMediaUploads}
          onQueueMediaUploads={queueMediaUploads}
          onRemovePendingMediaUpload={removePendingMediaUpload}
          pageFileDragActive={pageFileDragActive}
          savePending={createMutation.isPending}
        />
    </FormPageLayout>
  );
}
