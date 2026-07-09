// keel_web/src/modules/projects/api.ts

// Projects module API: CRUD, unified media attachments, and cover selection.

import { ApiError, apiFetch } from "../../lib/api";
import {
  buildMediaContentUrl,
  createMediaAttachment,
  deleteMediaAttachment,
  fetchEntityAttachments,
  fetchMediaBlob,
  updateMediaFilename,
  uploadMedia,
  type MediaAttachment,
  type MediaObject,
} from "../media/api";
import {
  resolveCoverImagePositionX,
  resolveCoverImagePositionY,
  resolveCoverImageScale,
  resolveCoverModelBrightness,
} from "./lib/project/appearance";
import type { ProjectStatus } from "./lib/project";

export type ProjectMediaKind = "image" | "video" | "model_3d" | "other";

export type ProjectMedia = {
  /** Attachment row id — use for detach/delete drafts. */
  id: number;
  /** Garage media object UUID — use for blobs, cover, and /media/:id links. */
  mediaId: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  media_kind: ProjectMediaKind;
  url: string;
  created_at: string;
  updated_at: string;
  project_folder_id: string | null;
};

export type ProjectFolder = {
  id: string;
  project_id: number;
  user_id: number;
  parent_folder_id: string | null;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type ProjectFolderCreatePayload = {
  name: string;
  parent_folder_id?: string | null;
};

type ProjectFolderUpdatePayload = {
  name?: string;
  parent_folder_id?: string | null;
  sort_order?: number;
};

export type ProjectTag = {
  id: number;
  name: string;
  description: string | null;
  color_hex: string;
  project_count: number;
};

type ProjectApiResponse = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  status: string;
  kind: string | null;
  cover: MediaObject | null;
  gallery: MediaAttachment[];
  cover_glow_color_hex: string | null;
  cover_model_color_hex: string | null;
  cover_model_brightness: number;
  cover_image_scale: number;
  cover_image_position_x: number;
  cover_image_position_y: number;
  kanban_card_color_hex: string | null;
  title_font_key: string | null;
  tags: ProjectTag[];
  created_at: string;
  updated_at: string;
};

export type Project = ProjectApiResponse & {
  cover_media_id: string | null;
  cover_media_kind: string | null;
  has_cover: boolean;
  cover_url: string | null;
  cover_mime_type: string | null;
  cover_byte_size: number | null;
  cover_updated_at: string | null;
};

export type ProjectCreatePayload = {
  title: string;
  description?: string;
  status?: ProjectStatus;
  kind?: string | null;
};

export type ProjectUpdatePayload = {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  kind?: string | null;
  tag_ids?: number[];
  cover_glow_color_hex?: string | null;
  cover_model_color_hex?: string | null;
  cover_model_brightness?: number;
  cover_image_scale?: number;
  cover_image_position_x?: number;
  cover_image_position_y?: number;
  kanban_card_color_hex?: string | null;
  title_font_key?: string | null;
};

type ProjectTagCreatePayload = {
  name: string;
  description?: string | null;
  color_hex?: string;
};

type ProjectTagUpdatePayload = {
  name?: string;
  description?: string | null;
  color_hex?: string;
};

const credentials = "include" as const;

export const projectsQueryKeys = {
  all: ["projects"] as const,
  list: () => [...projectsQueryKeys.all, "list"] as const,
  detail: (projectId: number) =>
    [...projectsQueryKeys.all, "detail", projectId] as const,
  media: (projectId: number) =>
    [...projectsQueryKeys.all, "media", projectId] as const,
  folders: (projectId: number, parentFolderId: string | null = null) =>
    [
      ...projectsQueryKeys.all,
      "folders",
      projectId,
      parentFolderId ?? "root",
    ] as const,
  mediaBlob: (mediaId: string) =>
    [...projectsQueryKeys.all, "media-blob", mediaId] as const,
  mediaStlGeometry: (projectId: number, mediaId: string) =>
    [...projectsQueryKeys.all, "media-stl", projectId, mediaId] as const,
  tags: () => [...projectsQueryKeys.all, "tags"] as const,
  canvases: (projectId: number) =>
    [...projectsQueryKeys.all, "canvases", projectId] as const,
  workspace: (projectId: number, canvasId: number) =>
    [...projectsQueryKeys.all, "workspace", projectId, canvasId] as const,
  workspaceSettings: (projectId: number, canvasId: number) =>
    [...projectsQueryKeys.all, "workspace-settings", projectId, canvasId] as const,
};

function normalizeMediaKind(kind: string): ProjectMediaKind {
  if (
    kind === "image" ||
    kind === "video" ||
    kind === "model_3d" ||
    kind === "other"
  ) {
    return kind;
  }
  return "other";
}

export function projectMediaFromAttachment(
  attachment: MediaAttachment,
): ProjectMedia {
  const media = attachment.media;
  return {
    id: attachment.id,
    mediaId: attachment.media_id,
    original_filename: media.original_filename,
    mime_type: media.mime_type,
    byte_size: media.byte_size,
    media_kind: normalizeMediaKind(media.media_kind),
    url: media.url,
    created_at: media.created_at,
    updated_at: media.updated_at,
    project_folder_id: attachment.project_folder_id ?? null,
  };
}

function normalizeProject(raw: ProjectApiResponse): Project {
  const cover = raw.cover;
  return {
    ...raw,
    gallery: raw.gallery ?? [],
    cover_model_brightness: resolveCoverModelBrightness(
      raw.cover_model_brightness,
    ),
    cover_image_scale: resolveCoverImageScale(raw.cover_image_scale),
    cover_image_position_x: resolveCoverImagePositionX(raw.cover_image_position_x),
    cover_image_position_y: resolveCoverImagePositionY(raw.cover_image_position_y),
    cover_media_id: cover?.id ?? null,
    cover_media_kind: cover?.media_kind ?? null,
    has_cover: Boolean(cover),
    cover_url: cover ? buildMediaContentUrl(cover.id, cover.updated_at) : null,
    cover_mime_type: cover?.mime_type ?? null,
    cover_byte_size: cover?.byte_size ?? null,
    cover_updated_at: cover?.updated_at ?? null,
  };
}

function normalizeProjects(projects: ProjectApiResponse[]): Project[] {
  return projects.map(normalizeProject);
}

export function fetchProjects(): Promise<Project[]> {
  return apiFetch<ProjectApiResponse[]>("/projects", { credentials }).then(
    normalizeProjects,
  );
}

export function fetchProject(projectId: number): Promise<Project> {
  return apiFetch<ProjectApiResponse>(`/projects/${projectId}`, { credentials }).then(
    normalizeProject,
  );
}

export function createProject(payload: ProjectCreatePayload): Promise<Project> {
  return apiFetch<ProjectApiResponse>("/projects", {
    method: "POST",
    credentials,
    body: payload,
  }).then(normalizeProject);
}

export function updateProject(
  projectId: number,
  payload: ProjectUpdatePayload,
): Promise<Project> {
  return apiFetch<ProjectApiResponse>(`/projects/${projectId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  }).then(normalizeProject);
}

export function deleteProject(projectId: number): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}`, {
    method: "DELETE",
    credentials,
  });
}

export type ProjectWorkspaceApiResponse = {
  project_id: number;
  canvas_id: number;
  state: Record<string, unknown>;
  settings: ProjectWorkspaceSettings;
  updated_at: string | null;
};

export type ProjectCanvas = {
  canvas_id: number;
  project_id: number;
  name: string;
  sort_order: number;
  is_default: boolean;
  updated_at: string;
};

export type ProjectCanvasCreatePayload = {
  name?: string;
};

type ProjectCanvasUpdatePayload = {
  name?: string;
  sort_order?: number;
  is_default?: boolean;
};

type ProjectWorkspaceConfigPanelPosition = {
  x: number;
  y: number;
};

type ProjectWorkspaceNotesGridPlacement = {
  id: string;
  grid_x: number;
  grid_y: number;
  col_span: number;
  row_span: number;
};

export type ProjectWorkspaceSettingsPayload = {
  canvas_color: string;
  snap_enabled: boolean;
  minimap_open: boolean;
  grid_dot_strength: number;
  config_open: boolean;
  config_position: ProjectWorkspaceConfigPanelPosition;
  text_font_scale: number;
  connection_style: string;
  note_color_style: string;
  note_italic_color: string;
  notes_grid_layout: ProjectWorkspaceNotesGridPlacement[] | null;
};

export type ProjectWorkspaceSettings = ProjectWorkspaceSettingsPayload & {
  persisted: boolean;
};

export function fetchProjectCanvases(projectId: number): Promise<ProjectCanvas[]> {
  return apiFetch<ProjectCanvas[]>(`/projects/${projectId}/canvases`, {
    credentials,
  });
}

export function createProjectCanvas(
  projectId: number,
  payload: ProjectCanvasCreatePayload = {},
): Promise<ProjectCanvas> {
  return apiFetch<ProjectCanvas>(`/projects/${projectId}/canvases`, {
    method: "POST",
    credentials,
    body: payload,
  });
}

export function updateProjectCanvas(
  projectId: number,
  canvasId: number,
  payload: ProjectCanvasUpdatePayload,
): Promise<ProjectCanvas> {
  return apiFetch<ProjectCanvas>(`/projects/${projectId}/canvases/${canvasId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export function deleteProjectCanvas(
  projectId: number,
  canvasId: number,
): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}/canvases/${canvasId}`, {
    method: "DELETE",
    credentials,
  });
}

export function fetchProjectWorkspace(
  projectId: number,
  canvasId: number,
): Promise<ProjectWorkspaceApiResponse> {
  return apiFetch<ProjectWorkspaceApiResponse>(
    `/projects/${projectId}/canvases/${canvasId}/workspace`,
    { credentials },
  );
}

export function fetchProjectWorkspaceSettings(
  projectId: number,
  canvasId: number,
): Promise<ProjectWorkspaceSettings> {
  return apiFetch<ProjectWorkspaceSettings>(
    `/projects/${projectId}/canvases/${canvasId}/workspace/settings`,
    { credentials },
  );
}

export function updateProjectWorkspaceSettings(
  projectId: number,
  canvasId: number,
  payload: ProjectWorkspaceSettingsPayload,
): Promise<ProjectWorkspaceSettings> {
  return apiFetch<ProjectWorkspaceSettings>(
    `/projects/${projectId}/canvases/${canvasId}/workspace/settings`,
    {
      method: "PATCH",
      credentials,
      body: payload,
    },
  );
}

export function saveProjectWorkspace(
  projectId: number,
  canvasId: number,
  state: Record<string, unknown>,
): Promise<ProjectWorkspaceApiResponse> {
  return apiFetch<ProjectWorkspaceApiResponse>(
    `/projects/${projectId}/canvases/${canvasId}/workspace`,
    {
      method: "PUT",
      credentials,
      body: { state },
    },
  );
}

export function fetchProjectTags(): Promise<ProjectTag[]> {
  return apiFetch<ProjectTag[]>("/projects/tags", { credentials });
}

export function createProjectTag(payload: ProjectTagCreatePayload): Promise<ProjectTag> {
  return apiFetch<ProjectTag>("/projects/tags", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export function updateProjectTag(
  tagId: number,
  payload: ProjectTagUpdatePayload,
): Promise<ProjectTag> {
  return apiFetch<ProjectTag>(`/projects/tags/${tagId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export function deleteProjectTag(tagId: number): Promise<void> {
  return apiFetch<void>(`/projects/tags/${tagId}`, {
    method: "DELETE",
    credentials,
  });
}

export async function fetchProjectMedia(projectId: number): Promise<ProjectMedia[]> {
  const attachments = await fetchEntityAttachments("project", projectId);
  return attachments
    .filter((attachment) => attachment.role === "gallery")
    .map(projectMediaFromAttachment);
}

export async function clearProjectCover(projectId: number): Promise<Project> {
  const attachments = await fetchEntityAttachments("project", projectId);
  const coverAttachment = attachments.find((attachment) => attachment.role === "cover");
  if (coverAttachment) {
    await deleteMediaAttachment(coverAttachment.id);
  }
  return fetchProject(projectId);
}

export async function setProjectCoverFromMedia(
  projectId: number,
  mediaId: string,
): Promise<Project> {
  await createMediaAttachment(mediaId, {
    entity_type: "project",
    entity_id: projectId,
    role: "cover",
  });
  return fetchProject(projectId);
}

export async function deleteProjectMediaByMediaId(
  projectId: number,
  mediaId: string,
): Promise<void> {
  const attachments = await fetchEntityAttachments("project", projectId);
  const attachment = attachments.find((row) => row.media_id === mediaId);
  if (!attachment) {
    throw new ApiError("Project media attachment not found.", 404);
  }
  await deleteMediaAttachment(attachment.id);
}

export function deleteProjectMedia(
  _projectId: number,
  attachmentId: number,
): Promise<void> {
  return deleteMediaAttachment(attachmentId);
}

type ProjectMediaUpdatePayload = {
  original_filename: string;
};

export async function updateProjectMedia(
  _projectId: number,
  mediaId: string,
  payload: ProjectMediaUpdatePayload,
): Promise<ProjectMedia> {
  const media = await updateMediaFilename(mediaId, payload.original_filename);
  const attachments = await fetchEntityAttachments("project", _projectId);
  const attachment = attachments.find((row) => row.media_id === media.id);
  if (!attachment) {
    throw new ApiError("Project media attachment not found.", 404);
  }
  return projectMediaFromAttachment({ ...attachment, media });
}

export function fetchProjectMediaBlob(
  _projectId: number,
  mediaId: string,
): Promise<Blob> {
  return fetchMediaBlob(mediaId);
}

export async function uploadProjectMedia(
  projectId: number,
  file: File,
  projectFolderId?: string | null,
): Promise<ProjectMedia> {
  const media = await uploadMedia(file);
  const attachment = await createMediaAttachment(media.id, {
    entity_type: "project",
    entity_id: projectId,
    role: "gallery",
    project_folder_id: projectFolderId ?? null,
  });
  return projectMediaFromAttachment(attachment);
}

export function fetchProjectFolders(
  projectId: number,
  options?: { parentFolderId?: string | null; all?: boolean },
): Promise<ProjectFolder[]> {
  const params = new URLSearchParams();
  if (options?.all) {
    params.set("all_folders", "true");
  } else if (options?.parentFolderId) {
    params.set("parent_folder_id", options.parentFolderId);
  }
  const query = params.toString();
  return apiFetch<ProjectFolder[]>(
    `/projects/${projectId}/folders${query ? `?${query}` : ""}`,
    { credentials },
  );
}

export function createProjectFolder(
  projectId: number,
  payload: ProjectFolderCreatePayload,
): Promise<ProjectFolder> {
  return apiFetch<ProjectFolder>(`/projects/${projectId}/folders`, {
    method: "POST",
    credentials,
    body: payload,
  });
}

export function updateProjectFolder(
  projectId: number,
  folderId: string,
  payload: ProjectFolderUpdatePayload,
): Promise<ProjectFolder> {
  return apiFetch<ProjectFolder>(`/projects/${projectId}/folders/${folderId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export function deleteProjectFolder(
  projectId: number,
  folderId: string,
): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}/folders/${folderId}`, {
    method: "DELETE",
    credentials,
  });
}

export async function attachProjectMediaFromLibrary(
  projectId: number,
  mediaId: string,
  projectFolderId?: string | null,
): Promise<ProjectMedia> {
  const attachment = await createMediaAttachment(mediaId, {
    entity_type: "project",
    entity_id: projectId,
    role: "gallery",
    project_folder_id: projectFolderId ?? null,
  });
  return projectMediaFromAttachment(attachment);
}

export { isAllowedProjectMediaFile } from "./lib/project/media";

export const MAX_MEDIA_BYTES = 100 * 1024 * 1024;

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
