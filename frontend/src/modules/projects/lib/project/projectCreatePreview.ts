// stack_sandbox/frontend_web/src/modules/projects/lib/project/projectCreatePreview.ts

// Stub project preview and post-create draft application for the new-project page.

import {
  createProject,
  setProjectCoverFromMedia,
  updateProject,
  uploadProjectMedia,
  type Project,
  type ProjectCreatePayload,
} from "../../api";
import type { AppearanceDraft } from "./appearance/projectAppearanceDraft";
import type { PendingMediaUpload } from "./media/projectMediaDraft";
import {
  inferMediaKindFromFile,
  isCoverEligiblePendingFile,
} from "./media/projectMediaDraft";
import type { ProjectStatus } from "./projectStatus";
import {
  DEFAULT_TITLE_FONT_KEY,
  type ProjectTitleFontKey,
} from "./appearance/projectTitleFont";

export function buildCreatePreviewProject(
  titleDraft: string,
  descriptionDraft: string,
  statusDraft: ProjectStatus,
  titleFontDraft: ProjectTitleFontKey,
  appearanceDraft: AppearanceDraft,
  pendingUploads: PendingMediaUpload[],
  coverPendingClientId: string | null,
): Project {
  const now = new Date().toISOString();
  const coverPending = coverPendingClientId
    ? pendingUploads.find(
        (item) => item.clientId === coverPendingClientId && !item.error,
      )
    : undefined;
  const coverKind = coverPending
    ? inferMediaKindFromFile(coverPending.file)
    : null;
  const hasCover =
    coverPending !== undefined && isCoverEligiblePendingFile(coverPending.file);

  return {
    id: 0,
    user_id: 0,
    title: titleDraft.trim() || "Untitled project",
    description: descriptionDraft,
    status: statusDraft,
    kind: null,
    cover: null,
    gallery: [],
    cover_media_id: null,
    cover_media_kind: hasCover ? coverKind : null,
    has_cover: hasCover,
    cover_url: null,
    cover_mime_type: coverPending?.file.type || null,
    cover_byte_size: coverPending?.file.size ?? null,
    cover_updated_at: null,
    cover_glow_color_hex: appearanceDraft.coverGlowColorHex,
    cover_model_color_hex: appearanceDraft.coverModelColorHex,
    cover_model_brightness: appearanceDraft.coverModelBrightness,
    cover_image_scale: appearanceDraft.coverImageScale,
    cover_image_position_x: appearanceDraft.coverImagePositionX,
    cover_image_position_y: appearanceDraft.coverImagePositionY,
    kanban_card_color_hex: appearanceDraft.kanbanCardColorHex,
    title_font_key:
      titleFontDraft === DEFAULT_TITLE_FONT_KEY ? null : titleFontDraft,
    tags: [],
    created_at: now,
    updated_at: now,
  };
}

export function resolveCreateLocalCoverFile(
  pendingUploads: PendingMediaUpload[],
  coverPendingClientId: string | null,
): File | null {
  if (!coverPendingClientId) {
    return null;
  }

  const coverPending = pendingUploads.find(
    (item) => item.clientId === coverPendingClientId && !item.error,
  );
  if (!coverPending || !isCoverEligiblePendingFile(coverPending.file)) {
    return null;
  }

  return coverPending.file;
}

export async function createProjectWithDrafts(
  core: ProjectCreatePayload,
  options: {
    tagIdsDraft: number[];
    titleFontDraft: ProjectTitleFontKey;
    appearanceDraft: AppearanceDraft;
    pendingUploads: PendingMediaUpload[];
    coverPendingClientId: string | null;
  },
): Promise<Project> {
  const created = await createProject(core);

  const updatePayload: Parameters<typeof updateProject>[1] = {};

  if (options.tagIdsDraft.length > 0) {
    updatePayload.tag_ids = options.tagIdsDraft;
  }
  if (options.titleFontDraft !== DEFAULT_TITLE_FONT_KEY) {
    updatePayload.title_font_key = options.titleFontDraft;
  }
  if (options.appearanceDraft.coverGlowColorHex !== null) {
    updatePayload.cover_glow_color_hex = options.appearanceDraft.coverGlowColorHex;
  }
  if (options.appearanceDraft.coverModelColorHex !== null) {
    updatePayload.cover_model_color_hex =
      options.appearanceDraft.coverModelColorHex;
  }
  if (options.appearanceDraft.coverModelBrightness !== 1) {
    updatePayload.cover_model_brightness = options.appearanceDraft.coverModelBrightness;
  }
  if (options.appearanceDraft.coverImageScale !== 1) {
    updatePayload.cover_image_scale = options.appearanceDraft.coverImageScale;
  }
  if (options.appearanceDraft.coverImagePositionX !== 50) {
    updatePayload.cover_image_position_x = options.appearanceDraft.coverImagePositionX;
  }
  if (options.appearanceDraft.coverImagePositionY !== 50) {
    updatePayload.cover_image_position_y = options.appearanceDraft.coverImagePositionY;
  }
  if (options.appearanceDraft.kanbanCardColorHex !== null) {
    updatePayload.kanban_card_color_hex =
      options.appearanceDraft.kanbanCardColorHex;
  }

  if (Object.keys(updatePayload).length > 0) {
    await updateProject(created.id, updatePayload);
  }

  const clientToMediaId = new Map<string, string>();
  for (const item of options.pendingUploads) {
    if (item.error) {
      continue;
    }
    const media = await uploadProjectMedia(created.id, item.file);
    clientToMediaId.set(item.clientId, media.mediaId);
  }

  if (options.coverPendingClientId) {
    const mediaId = clientToMediaId.get(options.coverPendingClientId);
    if (mediaId) {
      return setProjectCoverFromMedia(created.id, mediaId);
    }
  }

  return created;
}
