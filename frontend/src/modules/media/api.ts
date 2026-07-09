// keel_web/src/modules/media/api.ts

// Media module API: list and upload Garage objects for the current user.

import { ApiError, apiFetch, getApiBaseUrl } from "../../lib/api";

export type MediaObjectStatus = "pending" | "ready";

export type MediaObject = {
  id: string;
  user_id: number;
  folder_id: string | null;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  media_kind: string;
  status: MediaObjectStatus | string;
  url: string;
  attachment_count?: number;
  created_at: string;
  updated_at: string;
};

export type MediaFolder = {
  id: string;
  user_id: number;
  parent_folder_id: string | null;
  name: string;
  byte_size: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type MediaFolderContents = {
  folder: MediaFolder | null;
  breadcrumbs: MediaFolder[];
  folders: MediaFolder[];
  media: MediaObject[];
};

export type MediaPanel = {
  id: string;
  user_id: number;
  name: string;
  column_count: number;
  row_unit_px: number;
  sort_order: number;
  item_count: number;
  preview_media_id: string | null;
  created_at: string;
  updated_at: string;
};

export type MediaPanelItem = {
  id: string;
  panel_id: string;
  media_id: string;
  grid_x: number;
  grid_y: number;
  col_span: number;
  row_span: number;
  preview_scale?: number;
  preview_focal_x?: number;
  preview_focal_y?: number;
  border_color?: string | null;
  created_at: string;
  updated_at: string;
  media: MediaObject;
};

export type MediaPanelDetail = {
  id: string;
  user_id: number;
  name: string;
  column_count: number;
  row_unit_px: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  items: MediaPanelItem[];
};

export type MediaPanelLayoutItemPayload = {
  id: string;
  grid_x: number;
  grid_y: number;
  col_span: number;
  row_span: number;
};

export const mediaQueryKeys = {
  all: ["media"] as const,
  contents: (folderId?: string | null) =>
    [...mediaQueryKeys.all, "contents", folderId ?? "root"] as const,
  allMedia: () => [...mediaQueryKeys.all, "all"] as const,
  detail: (mediaId: string) => [...mediaQueryKeys.all, "detail", mediaId] as const,
  attachments: (mediaId: string) =>
    [...mediaQueryKeys.all, "attachments", mediaId] as const,
  panels: () => [...mediaQueryKeys.all, "panels"] as const,
  panel: (panelId: string) => [...mediaQueryKeys.all, "panel", panelId] as const,
};

const credentials: RequestCredentials = "include";

function apiBase(): string {
  return getApiBaseUrl().replace(/\/$/, "");
}

function folderQuery(folderId?: string | null): string {
  if (!folderId) {
    return "";
  }
  return `?folder_id=${encodeURIComponent(folderId)}`;
}

export function fetchMediaFolderContents(
  folderId?: string | null,
): Promise<MediaFolderContents> {
  return apiFetch<MediaFolderContents>(`/media${folderQuery(folderId)}`, {
    credentials,
  });
}

export function fetchAllMedia(): Promise<MediaObject[]> {
  return apiFetch<MediaObject[]>("/media/all", { credentials });
}

export function fetchMediaMetadata(mediaId: string): Promise<MediaObject> {
  return apiFetch<MediaObject>(`/media/${mediaId}/metadata`, { credentials });
}

export function buildMediaContentUrl(
  mediaId: string,
  cacheBuster?: string | null,
): string {
  const url = `${apiBase()}/media/${mediaId}`;
  if (!cacheBuster) {
    return url;
  }
  return `${url}?v=${encodeURIComponent(cacheBuster)}`;
}

export async function fetchMediaBlob(mediaId: string): Promise<Blob> {
  const response = await fetch(`${apiBase()}/media/${mediaId}`, { credentials });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(
      `API ${response.status} ${response.statusText}${body ? `: ${body}` : ""}`,
      response.status,
    );
  }

  return response.blob();
}

export function uploadMedia(
  file: File,
  folderId?: string | null,
): Promise<MediaObject> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    if (folderId) {
      formData.append("folder_id", folderId);
    }

    xhr.open("POST", `${apiBase()}/media`);
    xhr.withCredentials = true;

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as MediaObject);
        } catch {
          reject(new ApiError("Invalid upload response.", xhr.status));
        }
        return;
      }
      reject(
        new ApiError(
          `API ${xhr.status}${xhr.responseText ? `: ${xhr.responseText}` : ""}`,
          xhr.status,
        ),
      );
    };

    xhr.onerror = () => {
      reject(new ApiError("Upload failed.", 0));
    };

    xhr.send(formData);
  });
}

export function replaceMediaContent(
  mediaId: string,
  file: File,
  originalFilename: string,
): Promise<MediaObject> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("original_filename", originalFilename);

    xhr.open("PUT", `${apiBase()}/media/${mediaId}/content`);
    xhr.withCredentials = true;

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as MediaObject);
        } catch {
          reject(new ApiError("Invalid replace response.", xhr.status));
        }
        return;
      }
      reject(
        new ApiError(
          `API ${xhr.status}${xhr.responseText ? `: ${xhr.responseText}` : ""}`,
          xhr.status,
        ),
      );
    };

    xhr.onerror = () => {
      reject(new ApiError("Replace failed.", 0));
    };

    xhr.send(formData);
  });
}

export function updateMediaFilename(
  mediaId: string,
  originalFilename: string,
): Promise<MediaObject> {
  return apiFetch<MediaObject>(`/media/${mediaId}`, {
    method: "PATCH",
    credentials,
    body: { original_filename: originalFilename },
  });
}

export function moveMediaToFolder(
  mediaId: string,
  folderId: string | null,
): Promise<MediaObject> {
  return apiFetch<MediaObject>(`/media/${mediaId}`, {
    method: "PATCH",
    credentials,
    body: { folder_id: folderId },
  });
}

export function createMediaFolder(
  name: string,
  parentFolderId?: string | null,
): Promise<MediaFolder> {
  return apiFetch<MediaFolder>("/media/folders", {
    method: "POST",
    credentials,
    body: {
      name,
      parent_folder_id: parentFolderId ?? null,
    },
  });
}

export function updateMediaFolderName(
  folderId: string,
  name: string,
): Promise<MediaFolder> {
  return apiFetch<MediaFolder>(`/media/folders/${folderId}`, {
    method: "PATCH",
    credentials,
    body: { name },
  });
}

export function moveMediaFolder(
  folderId: string,
  parentFolderId: string | null,
): Promise<MediaFolder> {
  return apiFetch<MediaFolder>(`/media/folders/${folderId}`, {
    method: "PATCH",
    credentials,
    body: { parent_folder_id: parentFolderId },
  });
}

export function deleteMediaFolder(folderId: string): Promise<void> {
  return apiFetch<void>(`/media/folders/${folderId}`, {
    method: "DELETE",
    credentials,
  });
}

export function deleteMedia(mediaId: string): Promise<void> {
  return apiFetch<void>(`/media/${mediaId}`, {
    method: "DELETE",
    credentials,
  });
}

export type MediaAttachment = {
  id: number;
  media_id: string;
  entity_type: string;
  entity_id: number;
  role: string;
  sort_order: number;
  display_name: string | null;
  project_folder_id: string | null;
  created_at: string;
  media: MediaObject;
};

export type GalleryEntry = {
  attachmentId: number;
  mediaId: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  media_kind: string;
  url: string;
  updated_at: string;
};

export function galleryEntryFromAttachment(attachment: MediaAttachment): GalleryEntry {
  return {
    attachmentId: attachment.id,
    mediaId: attachment.media_id,
    original_filename: attachment.media.original_filename,
    mime_type: attachment.media.mime_type,
    byte_size: attachment.media.byte_size,
    media_kind: attachment.media.media_kind,
    url: attachment.media.url,
    updated_at: attachment.media.updated_at,
  };
}

export type MediaAttachmentCreatePayload = {
  entity_type: string;
  entity_id: number;
  role: string;
  sort_order?: number;
  display_name?: string | null;
  project_folder_id?: string | null;
};

export function fetchEntityAttachments(
  entityType: string,
  entityId: number,
): Promise<MediaAttachment[]> {
  return apiFetch<MediaAttachment[]>(
    `/media/by-entity/${encodeURIComponent(entityType)}/${entityId}`,
    { credentials },
  );
}

export function fetchMediaAttachments(mediaId: string): Promise<MediaAttachment[]> {
  return apiFetch<MediaAttachment[]>(`/media/${mediaId}/attachments`, {
    credentials,
  });
}

export function createMediaAttachment(
  mediaId: string,
  payload: MediaAttachmentCreatePayload,
): Promise<MediaAttachment> {
  return apiFetch<MediaAttachment>(`/media/${mediaId}/attachments`, {
    method: "POST",
    credentials,
    body: payload,
  });
}

export function deleteMediaAttachment(attachmentId: number): Promise<void> {
  return apiFetch<void>(`/media/attachments/${attachmentId}`, {
    method: "DELETE",
    credentials,
  });
}

export type MediaAttachmentUpdatePayload = {
  role?: string;
  sort_order?: number;
  display_name?: string | null;
  project_folder_id?: string | null;
};

export function updateMediaAttachment(
  attachmentId: number,
  payload: MediaAttachmentUpdatePayload,
): Promise<MediaAttachment> {
  return apiFetch<MediaAttachment>(`/media/attachments/${attachmentId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export function fetchMediaPanels(): Promise<MediaPanel[]> {
  return apiFetch<MediaPanel[]>("/media/panels", { credentials });
}

export function createMediaPanel(name: string): Promise<MediaPanel> {
  return apiFetch<MediaPanel>("/media/panels", {
    method: "POST",
    credentials,
    body: { name },
  });
}

export function fetchMediaPanel(panelId: string): Promise<MediaPanelDetail> {
  return apiFetch<MediaPanelDetail>(`/media/panels/${panelId}`, { credentials });
}

export function updateMediaPanelName(panelId: string, name: string): Promise<MediaPanel> {
  return apiFetch<MediaPanel>(`/media/panels/${panelId}`, {
    method: "PATCH",
    credentials,
    body: { name },
  });
}

export function deleteMediaPanel(panelId: string): Promise<void> {
  return apiFetch<void>(`/media/panels/${panelId}`, {
    method: "DELETE",
    credentials,
  });
}

export function addMediaPanelItem(
  panelId: string,
  mediaId: string,
  options?: {
    grid_x?: number;
    grid_y?: number;
    col_span?: number;
    row_span?: number;
    layout_updates?: MediaPanelLayoutItemPayload[];
  },
): Promise<MediaPanelItem> {
  return apiFetch<MediaPanelItem>(`/media/panels/${panelId}/items`, {
    method: "POST",
    credentials,
    body: {
      media_id: mediaId,
      ...options,
    },
  });
}

export function replaceMediaPanelLayout(
  panelId: string,
  items: MediaPanelLayoutItemPayload[],
): Promise<MediaPanelDetail> {
  return apiFetch<MediaPanelDetail>(`/media/panels/${panelId}/layout`, {
    method: "PUT",
    credentials,
    body: { items },
  });
}

export function removeMediaPanelItem(
  panelId: string,
  itemId: string,
): Promise<MediaPanelDetail> {
  return apiFetch<MediaPanelDetail>(`/media/panels/${panelId}/items/${itemId}`, {
    method: "DELETE",
    credentials,
  });
}

export function updateMediaPanelItemPreview(
  panelId: string,
  itemId: string,
  preview: {
    preview_scale: number;
    preview_focal_x: number;
    preview_focal_y: number;
  },
): Promise<MediaPanelItem> {
  return apiFetch<MediaPanelItem>(`/media/panels/${panelId}/items/${itemId}`, {
    method: "PATCH",
    credentials,
    body: preview,
  });
}

export function updateMediaPanelItemBorderColor(
  panelId: string,
  itemId: string,
  borderColor: string | null,
): Promise<MediaPanelItem> {
  return apiFetch<MediaPanelItem>(`/media/panels/${panelId}/items/${itemId}`, {
    method: "PATCH",
    credentials,
    body: { border_color: borderColor },
  });
}

export function swapMediaPanelItems(
  panelId: string,
  itemAId: string,
  itemBId: string,
): Promise<MediaPanelDetail> {
  return apiFetch<MediaPanelDetail>(`/media/panels/${panelId}/items/swap`, {
    method: "POST",
    credentials,
    body: {
      item_a_id: itemAId,
      item_b_id: itemBId,
    },
  });
}
