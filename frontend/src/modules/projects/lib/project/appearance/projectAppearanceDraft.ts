// stack_sandbox/frontend_web/src/modules/projects/lib/project/appearance/projectAppearanceDraft.ts

// Draft helpers for inline appearance edits on the project detail display view.

import {
  clearProjectCover,
  setProjectCoverFromMedia,
  updateProject,
  type Project,
  type ProjectMedia,
  type ProjectUpdatePayload,
} from "../../../api";
import {
  resolveCoverImagePositionX,
  resolveCoverImagePositionY,
  resolveCoverImageScale,
  resolveCoverModelBrightness,
} from "./projectAppearance";

export type AppearanceDraft = {
  coverMediaId: string | null;
  coverGlowColorHex: string | null;
  coverModelColorHex: string | null;
  coverModelBrightness: number;
  coverImageScale: number;
  coverImagePositionX: number;
  coverImagePositionY: number;
  kanbanCardColorHex: string | null;
};

export function buildAppearanceDraft(project: Project): AppearanceDraft {
  return {
    coverMediaId: project.cover_media_id,
    coverGlowColorHex: project.cover_glow_color_hex,
    coverModelColorHex: project.cover_model_color_hex,
    coverModelBrightness: resolveCoverModelBrightness(project.cover_model_brightness),
    coverImageScale: resolveCoverImageScale(project.cover_image_scale),
    coverImagePositionX: resolveCoverImagePositionX(project.cover_image_position_x),
    coverImagePositionY: resolveCoverImagePositionY(project.cover_image_position_y),
    kanbanCardColorHex: project.kanban_card_color_hex,
  };
}

export function appearanceDraftIsDirty(
  project: Project,
  draft: AppearanceDraft,
): boolean {
  return (
    draft.coverMediaId !== project.cover_media_id ||
    draft.coverGlowColorHex !== project.cover_glow_color_hex ||
    draft.coverModelColorHex !== project.cover_model_color_hex ||
    draft.coverModelBrightness !==
      resolveCoverModelBrightness(project.cover_model_brightness) ||
    draft.coverImageScale !== resolveCoverImageScale(project.cover_image_scale) ||
    draft.coverImagePositionX !==
      resolveCoverImagePositionX(project.cover_image_position_x) ||
    draft.coverImagePositionY !==
      resolveCoverImagePositionY(project.cover_image_position_y) ||
    draft.kanbanCardColorHex !== project.kanban_card_color_hex
  );
}

export function isCoverEligibleMedia(media: ProjectMedia): boolean {
  return media.media_kind === "image" || media.media_kind === "model_3d";
}

export function projectWithAppearanceDraft(
  project: Project,
  draft: AppearanceDraft,
  media: ProjectMedia[],
  deleteDraftIds: number[] = [],
): Project {
  const deleteSet = new Set(deleteDraftIds);
  const coverMediaId = draft.coverMediaId;
  const coverMedia =
    coverMediaId !== null
      ? media.find((item) => item.mediaId === coverMediaId)
      : undefined;
  const coverValid =
    coverMedia !== undefined &&
    isCoverEligibleMedia(coverMedia) &&
    !deleteSet.has(coverMedia.id);

  let coverKind = project.cover_media_kind;
  if (coverValid && coverMediaId !== project.cover_media_id && coverMedia) {
    coverKind = coverMedia.media_kind;
  } else if (!coverValid) {
    coverKind = null;
  }

  const coverObject =
    coverValid && coverMedia
      ? {
          id: coverMedia.mediaId,
          user_id: project.user_id,
          folder_id: null,
          original_filename: coverMedia.original_filename,
          mime_type: coverMedia.mime_type,
          byte_size: coverMedia.byte_size,
          media_kind: coverMedia.media_kind,
          status: "ready",
          url: coverMedia.url,
          created_at: coverMedia.created_at,
          updated_at: coverMedia.updated_at,
        }
      : null;

  return {
    ...project,
    cover: coverObject,
    cover_media_id: coverValid ? coverMediaId : null,
    cover_media_kind: coverValid ? coverKind : null,
    has_cover: coverValid,
    cover_url: coverObject
      ? `${coverObject.url}${coverObject.updated_at ? `?v=${encodeURIComponent(coverObject.updated_at)}` : ""}`
      : null,
    cover_mime_type: coverValid && coverMedia ? coverMedia.mime_type : null,
    cover_byte_size: coverValid && coverMedia ? coverMedia.byte_size : null,
    cover_updated_at: coverValid && coverMedia ? coverMedia.updated_at : null,
    cover_glow_color_hex: draft.coverGlowColorHex,
    cover_model_color_hex: draft.coverModelColorHex,
    cover_model_brightness: resolveCoverModelBrightness(draft.coverModelBrightness),
    cover_image_scale: resolveCoverImageScale(draft.coverImageScale),
    cover_image_position_x: resolveCoverImagePositionX(draft.coverImagePositionX),
    cover_image_position_y: resolveCoverImagePositionY(draft.coverImagePositionY),
    kanban_card_color_hex: draft.kanbanCardColorHex,
  };
}

export function isImageCoverProject(
  project: Pick<Project, "cover_media_kind" | "cover_media_id" | "has_cover">,
): boolean {
  return (
    project.has_cover &&
    project.cover_media_id !== null &&
    project.cover_media_kind === "image"
  );
}

export function isModelCoverProject(
  project: Pick<Project, "cover_media_kind" | "cover_media_id" | "has_cover">,
): boolean {
  return (
    project.has_cover &&
    project.cover_media_id !== null &&
    project.cover_media_kind === "model_3d"
  );
}

export async function applyAppearanceDraftChanges(
  projectId: number,
  project: Project,
  draft: AppearanceDraft,
  deleteDraftIds: number[],
  media: ProjectMedia[] = [],
): Promise<Project | null> {
  const deleteSet = new Set(deleteDraftIds);
  const payload: ProjectUpdatePayload = {};
  let latest: Project | null = null;

  if (draft.coverGlowColorHex !== project.cover_glow_color_hex) {
    payload.cover_glow_color_hex = draft.coverGlowColorHex;
  }
  if (draft.coverModelColorHex !== project.cover_model_color_hex) {
    payload.cover_model_color_hex = draft.coverModelColorHex;
  }
  if (
    draft.coverModelBrightness !==
    resolveCoverModelBrightness(project.cover_model_brightness)
  ) {
    payload.cover_model_brightness = resolveCoverModelBrightness(
      draft.coverModelBrightness,
    );
  }
  if (
    draft.coverImageScale !== resolveCoverImageScale(project.cover_image_scale)
  ) {
    payload.cover_image_scale = resolveCoverImageScale(draft.coverImageScale);
  }
  if (
    draft.coverImagePositionX !==
    resolveCoverImagePositionX(project.cover_image_position_x)
  ) {
    payload.cover_image_position_x = resolveCoverImagePositionX(
      draft.coverImagePositionX,
    );
  }
  if (
    draft.coverImagePositionY !==
    resolveCoverImagePositionY(project.cover_image_position_y)
  ) {
    payload.cover_image_position_y = resolveCoverImagePositionY(
      draft.coverImagePositionY,
    );
  }
  if (draft.kanbanCardColorHex !== project.kanban_card_color_hex) {
    payload.kanban_card_color_hex = draft.kanbanCardColorHex;
  }

  if (Object.keys(payload).length > 0) {
    latest = await updateProject(projectId, payload);
  }

  if (draft.coverMediaId === project.cover_media_id) {
    return latest;
  }

  if (draft.coverMediaId === null) {
    return clearProjectCover(projectId);
  }

  const coverAttachment = media.find((item) => item.mediaId === draft.coverMediaId);
  if (coverAttachment && deleteSet.has(coverAttachment.id)) {
    return clearProjectCover(projectId);
  }

  return setProjectCoverFromMedia(projectId, draft.coverMediaId);
}
