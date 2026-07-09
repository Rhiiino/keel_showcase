// keel_web/src/modules/focus/api/constellation.ts

import { apiFetch } from "../../../lib/api";
import { credentials } from "./shared";
import type {
  FocusConstellationSettings,
  FocusConstellationSettingsPayload,
  FocusConstellationState,
} from "./types";

export async function fetchFocusConstellationState(): Promise<FocusConstellationState> {
  return apiFetch<FocusConstellationState>("/focus/constellation-state", { credentials });
}

export async function updateFocusConstellationState(
  payload: FocusConstellationState,
): Promise<FocusConstellationState> {
  return apiFetch<FocusConstellationState>("/focus/constellation-state", {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export async function fetchFocusConstellationSettings(): Promise<FocusConstellationSettings> {
  return apiFetch<FocusConstellationSettings>("/focus/constellation-settings", {
    credentials,
  });
}

export async function updateFocusConstellationSettings(
  payload: FocusConstellationSettingsPayload,
): Promise<FocusConstellationSettings> {
  return apiFetch<FocusConstellationSettings>("/focus/constellation-settings", {
    method: "PATCH",
    credentials,
    body: payload,
  });
}
