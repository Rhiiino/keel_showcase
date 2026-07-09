// keel_web/src/modules/coak/api/workspace.ts

import { apiFetch } from "../../../lib/api";
import type {
  CoakConfigurationSettings,
  CoakConfigurationSettingsPayload,
  CoakWorkspaceSettings,
  CoakWorkspaceSettingsPayload,
  CoakWorkspaceState,
  CoakWorkspaceStatePayload,
} from "./types";

const credentials: RequestCredentials = "include";



export async function fetchCoakWorkspaceState(recordId: number): Promise<CoakWorkspaceState> {
  return apiFetch<CoakWorkspaceState>(`/coak/records/${recordId}/workspace-state`, {
    credentials,
  });
}


export async function updateCoakWorkspaceState(
  recordId: number,
  payload: CoakWorkspaceStatePayload,
): Promise<CoakWorkspaceState> {
  return apiFetch<CoakWorkspaceState>(`/coak/records/${recordId}/workspace-state`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}


export async function fetchCoakWorkspaceSettings(
  recordId: number,
): Promise<CoakWorkspaceSettings> {
  return apiFetch<CoakWorkspaceSettings>(`/coak/records/${recordId}/workspace-settings`, {
    credentials,
  });
}


export async function updateCoakWorkspaceSettings(
  recordId: number,
  payload: CoakWorkspaceSettingsPayload,
): Promise<CoakWorkspaceSettings> {
  return apiFetch<CoakWorkspaceSettings>(`/coak/records/${recordId}/workspace-settings`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}


export async function fetchCoakConfigurationSettings(
  recordId: number,
): Promise<CoakConfigurationSettings> {
  return apiFetch<CoakConfigurationSettings>(
    `/coak/records/${recordId}/configuration-settings`,
    { credentials },
  );
}


export async function updateCoakConfigurationSettings(
  recordId: number,
  payload: CoakConfigurationSettingsPayload,
): Promise<CoakConfigurationSettings> {
  return apiFetch<CoakConfigurationSettings>(
    `/coak/records/${recordId}/configuration-settings`,
    {
      method: "PATCH",
      credentials,
      body: payload,
    },
  );
}
