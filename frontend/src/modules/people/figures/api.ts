// keel_web/src/modules/people/figures/api.ts

// Figures module API.

import { apiFetch } from "../../../lib/api";
import {
  createMediaAttachment,
  uploadMedia,
  type MediaObject,
} from "../../media/api";

export { formatBirthDate } from "../shared/lib/birthDate";

const credentials: RequestCredentials = "include";

export type FigureGender = "male" | "female";

export type Figure = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  gender: FigureGender | null;
  birth_date: string | null;
  birth_date_year_known: boolean;
  death_date: string | null;
  notes: string;
  status: string;
  photo: MediaObject | null;
  created_at: string;
  updated_at: string;
};

export type FigureCreatePayload = {
  first_name?: string | null;
  last_name?: string | null;
  gender?: FigureGender | null;
  birth_date?: string | null;
  birth_date_year_known?: boolean;
  death_date?: string | null;
  notes?: string;
  status?: string;
};

export type FigureUpdatePayload = Partial<FigureCreatePayload>;

export const figuresQueryKeys = {
  all: ["figures"] as const,
  list: () => [...figuresQueryKeys.all, "list"] as const,
  detail: (id: number) => [...figuresQueryKeys.all, "detail", id] as const,
};

export function figureNameFromParts(
  firstName: string | null,
  lastName: string | null,
): string {
  const parts = [firstName?.trim(), lastName?.trim()].filter(Boolean);
  return parts.join(" ");
}

export function figureEditableName(
  figure: Pick<Figure, "first_name" | "last_name">,
): string {
  return figureNameFromParts(figure.first_name, figure.last_name);
}

export function parseFigureFullName(
  fullName: string,
): Pick<Figure, "first_name" | "last_name"> {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { first_name: null, last_name: null };
  }
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) {
    return { first_name: trimmed, last_name: null };
  }
  return {
    first_name: trimmed.slice(0, spaceIndex),
    last_name: trimmed.slice(spaceIndex + 1).trim() || null,
  };
}

export function formatFigureName(
  figure: Pick<Figure, "first_name" | "last_name"> & { id?: number },
): string {
  const name = figureNameFromParts(figure.first_name, figure.last_name);
  if (name) {
    return name;
  }
  return figure.id ? `Figure #${figure.id}` : "Unnamed figure";
}

export function figureInitials(
  figure: Pick<Figure, "first_name" | "last_name">,
): string {
  const first = figure.first_name?.trim().charAt(0) ?? "";
  const last = figure.last_name?.trim().charAt(0) ?? "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "?";
}

export async function fetchFigures(): Promise<Figure[]> {
  return apiFetch<Figure[]>("/figures", { credentials });
}

export async function fetchFigure(figureId: number): Promise<Figure> {
  return apiFetch<Figure>(`/figures/${figureId}`, { credentials });
}

export async function createFigure(payload: FigureCreatePayload): Promise<Figure> {
  return apiFetch<Figure>("/figures", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export async function updateFigure(
  figureId: number,
  payload: FigureUpdatePayload,
): Promise<Figure> {
  return apiFetch<Figure>(`/figures/${figureId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export async function deleteFigure(figureId: number): Promise<void> {
  return apiFetch<void>(`/figures/${figureId}`, {
    method: "DELETE",
    credentials,
  });
}

export const MAX_FIGURE_PHOTO_BYTES = 10 * 1024 * 1024;

export function validateFigurePhotoFile(
  file: File,
): { ok: true } | { ok: false; error: string } {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Choose a JPEG, PNG, WebP, or GIF image." };
  }
  if (file.size > MAX_FIGURE_PHOTO_BYTES) {
    return { ok: false, error: "Image must be 10 MB or smaller." };
  }
  return { ok: true };
}

export async function uploadFigurePhoto(
  figureId: number,
  file: File,
): Promise<Figure> {
  const media = await uploadMedia(file);
  await createMediaAttachment(media.id, {
    entity_type: "figure",
    entity_id: figureId,
    role: "photo",
  });
  return fetchFigure(figureId);
}

export async function setFigurePhotoFromMedia(
  figureId: number,
  mediaId: string,
): Promise<Figure> {
  await createMediaAttachment(mediaId, {
    entity_type: "figure",
    entity_id: figureId,
    role: "photo",
  });
  return fetchFigure(figureId);
}

export function figureMatchesSearch(
  figure: Pick<Figure, "first_name" | "last_name">,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return formatFigureName(figure).toLowerCase().includes(needle);
}
