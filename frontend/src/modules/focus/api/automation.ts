// keel_web/src/modules/focus/api/automation.ts

import { apiFetch } from "../../../lib/api";
import { credentials } from "./shared";

export type FocusAutomationSession = {
  session_id: string;
  connector: string;
  actor_label: string;
  scopes: string[];
  created_at: string;
  expires_at: string;
  revoked: boolean;
  last_used_at: string | null;
};

export type FocusAutomationSessionCreated = FocusAutomationSession & {
  token: string;
};

export type FocusAutomationGuide = {
  format: "markdown";
  content: string;
};

export async function createFocusAutomationSession(
  actorLabel = "External LLM",
): Promise<FocusAutomationSessionCreated> {
  return apiFetch<FocusAutomationSessionCreated>("/connectors/focus/sessions", {
    method: "POST",
    credentials,
    body: { actor_label: actorLabel },
  });
}

export async function fetchFocusAutomationSession(): Promise<FocusAutomationSession | null> {
  return apiFetch<FocusAutomationSession | null>("/connectors/focus/sessions/current", {
    credentials,
  });
}

export async function revokeFocusAutomationSession(): Promise<FocusAutomationSession | null> {
  return apiFetch<FocusAutomationSession | null>("/connectors/focus/sessions/current", {
    method: "DELETE",
    credentials,
  });
}

export async function fetchFocusAutomationGuide(): Promise<FocusAutomationGuide> {
  return apiFetch<FocusAutomationGuide>("/connectors/focus/guide", { credentials });
}

export async function fetchFocusAutomationManifest(): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>("/connectors/focus/manifest", { credentials });
}
