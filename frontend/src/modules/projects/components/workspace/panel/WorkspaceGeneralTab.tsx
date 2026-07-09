// keel_web/src/modules/projects/components/workspace/panel/WorkspaceGeneralTab.tsx

// General project info editor for the workspace side panel.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  projectsQueryKeys,
  updateProject,
  type Project,
  type ProjectUpdatePayload,
} from "../../../api";
import {
  ProjectDetailInlineStatus,
  ProjectDetailInlineTags,
  ProjectDetailInlineTitle,
} from "../../detail";
import { WorkspaceGeneralStatsPanel } from "./WorkspaceGeneralStatsPanel";
import {
  isProjectStatus,
  sameTagIdSets,
  type ProjectStatus,
} from "../../../lib/project";
import {
  DEFAULT_TITLE_FONT_KEY,
  resolveProjectTitleFontKey,
  type ProjectTitleFontKey,
} from "../../../lib/project/appearance";

type WorkspaceGeneralTabProps = {
  project: Project | null;
  loading?: boolean;
  disabled?: boolean;
  canvasCount?: number;
  noteCount?: number;
  fileCount?: number;
  summaryLoading?: boolean;
};

function projectTagIds(project: { tags: { id: number }[] }): number[] {
  return project.tags.map((tag) => tag.id);
}

export function WorkspaceGeneralTab({
  project,
  loading = false,
  disabled = false,
  canvasCount = 0,
  noteCount = 0,
  fileCount = 0,
  summaryLoading = false,
}: WorkspaceGeneralTabProps) {
  const queryClient = useQueryClient();
  const [titleDraft, setTitleDraft] = useState("");
  const [titleFontDraft, setTitleFontDraft] =
    useState<ProjectTitleFontKey>(DEFAULT_TITLE_FONT_KEY);
  const [statusDraft, setStatusDraft] = useState<ProjectStatus>("planning");
  const [tagIdsDraft, setTagIdsDraft] = useState<number[]>([]);

  const savedTagIdsKey =
    project?.tags
      .map((tag) => tag.id)
      .sort((a, b) => a - b)
      .join(",") ?? "";

  useEffect(() => {
    if (!project) {
      return;
    }

    setTitleDraft(project.title);
    setTitleFontDraft(resolveProjectTitleFontKey(project.title_font_key));
    setStatusDraft(isProjectStatus(project.status) ? project.status : "planning");
    setTagIdsDraft(projectTagIds(project));
  }, [
    project?.id,
    project?.title,
    project?.title_font_key,
    project?.status,
    savedTagIdsKey,
  ]);

  const dirtyState = useMemo(() => {
    if (!project) {
      return {
        titleIsDirty: false,
        titleFontIsDirty: false,
        statusIsDirty: false,
        tagsIsDirty: false,
        hasChanges: false,
        canSave: false,
      };
    }

    const title = titleDraft.trim();
    const savedTitleFont = resolveProjectTitleFontKey(project.title_font_key);
    const savedStatus = isProjectStatus(project.status) ? project.status : "planning";
    const titleHasChanged = title !== project.title;
    const titleIsDirty = title.length > 0 && titleHasChanged;
    const titleFontIsDirty = titleFontDraft !== savedTitleFont;
    const statusIsDirty = statusDraft !== savedStatus;
    const tagsIsDirty = !sameTagIdSets(tagIdsDraft, projectTagIds(project));
    const hasChanges =
      titleHasChanged || titleFontIsDirty || statusIsDirty || tagsIsDirty;

    return {
      titleIsDirty,
      titleFontIsDirty,
      statusIsDirty,
      tagsIsDirty,
      hasChanges,
      canSave: title.length > 0 && hasChanges,
    };
  }, [project, statusDraft, tagIdsDraft, titleDraft, titleFontDraft]);

  const resetDrafts = () => {
    if (!project) {
      return;
    }

    setTitleDraft(project.title);
    setTitleFontDraft(resolveProjectTitleFontKey(project.title_font_key));
    setStatusDraft(isProjectStatus(project.status) ? project.status : "planning");
    setTagIdsDraft(projectTagIds(project));
  };

  const saveMutation = useMutation({
    mutationFn: async (): Promise<Project | null> => {
      if (!project || !dirtyState.canSave) {
        return null;
      }

      const payload: ProjectUpdatePayload = {};
      if (dirtyState.titleIsDirty) {
        payload.title = titleDraft.trim();
      }
      if (dirtyState.titleFontIsDirty) {
        payload.title_font_key =
          titleFontDraft === DEFAULT_TITLE_FONT_KEY ? null : titleFontDraft;
      }
      if (dirtyState.statusIsDirty) {
        payload.status = statusDraft;
      }
      if (dirtyState.tagsIsDirty) {
        payload.tag_ids = tagIdsDraft;
      }

      return updateProject(project.id, payload);
    },
    onSuccess: (savedProject) => {
      if (!savedProject) {
        return;
      }

      queryClient.setQueryData(projectsQueryKeys.detail(savedProject.id), savedProject);
      queryClient.setQueryData<Project[]>(
        projectsQueryKeys.list(),
        (list) =>
          list?.map((item) => (item.id === savedProject.id ? savedProject : item)) ?? [],
      );
      queryClient.invalidateQueries({
        queryKey: projectsQueryKeys.detail(savedProject.id),
      });
      queryClient.invalidateQueries({ queryKey: projectsQueryKeys.list() });
    },
  });

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <div className="h-8 w-40 animate-pulse rounded bg-stone-800/60" />
        <div className="h-7 w-24 animate-pulse rounded-full bg-stone-800/50" />
        <div className="h-20 rounded-xl bg-stone-900/50" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-4 text-center text-xs text-stone-500">
        Project information is unavailable.
      </div>
    );
  }

  const controlsDisabled = disabled || saveMutation.isPending;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-4">
      <section className="space-y-5">
        <div>
          <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500">
            Project
          </span>
          <ProjectDetailInlineTitle
            value={titleDraft}
            onChange={setTitleDraft}
            placeholder="Project name"
            titleFontDraft={titleFontDraft}
            onTitleFontDraftChange={setTitleFontDraft}
            disabled={controlsDisabled}
            titleClassName="text-2xl font-semibold tracking-tight leading-tight"
            inputToneClassName="text-stone-50 placeholder:text-stone-600"
            fontPickerAlwaysVisible
            fontPickerMenuAlign="left"
          />
          {titleDraft.trim().length === 0 ? (
            <p className="mt-2 text-xs text-red-400">Project name is required.</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500">
            Status
          </span>
          <ProjectDetailInlineStatus
            statusDraft={statusDraft}
            onStatusDraftChange={setStatusDraft}
            disabled={controlsDisabled}
          />
        </div>

        <div className="space-y-2">
          <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500">
            Tags
          </span>
          <ProjectDetailInlineTags
            tagIdsDraft={tagIdsDraft}
            onTagIdsDraftChange={setTagIdsDraft}
            disabled={controlsDisabled}
          />
        </div>

        <WorkspaceGeneralStatsPanel
          canvasCount={canvasCount}
          noteCount={noteCount}
          fileCount={fileCount}
          loading={summaryLoading}
        />
      </section>

      {dirtyState.hasChanges || saveMutation.isError ? (
        <div className="mt-5 border-t border-stone-800/70 pt-4">
          {saveMutation.isError ? (
            <p className="mb-3 text-xs text-red-400">{saveMutation.error.message}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={resetDrafts}
              disabled={!dirtyState.hasChanges || controlsDisabled}
              className="rounded-lg border border-stone-700/80 bg-stone-900/60 px-3 py-1.5 text-xs font-medium text-stone-200 transition hover:border-stone-600 hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={!dirtyState.canSave || controlsDisabled}
              className="rounded-lg bg-sky-500/90 px-3 py-1.5 text-xs font-medium text-stone-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
