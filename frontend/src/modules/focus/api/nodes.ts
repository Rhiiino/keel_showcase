// keel_web/src/modules/focus/api/nodes.ts

import { apiFetch } from "../../../lib/api";
import { credentials } from "./shared";
import type {
  FocusEntryReorderEntry,
  FocusNode,
  FocusNodeCreatePayload,
  FocusNodeListFilters,
  FocusNodeUpdatePayload,
} from "./types";

export async function fetchFocusNodes(
  filters?: FocusNodeListFilters,
): Promise<FocusNode[]> {
  const params = new URLSearchParams();
  if (filters?.parent_id !== undefined && filters.parent_id !== null) {
    params.set("parent_id", String(filters.parent_id));
  }
  if (filters?.roots_only) {
    params.set("roots_only", "true");
  }
  if (filters?.kind) {
    params.set("kind", filters.kind);
  }
  if (filters?.kinds?.length) {
    for (const entry of filters.kinds) {
      params.append("kinds", entry);
    }
  }
  if (filters?.status) {
    params.set("status", filters.status);
  }
  if (filters?.hub_lists_only) {
    params.set("hub_lists_only", "true");
  }
  const query = params.toString();
  return apiFetch<FocusNode[]>(`/focus/nodes${query ? `?${query}` : ""}`, {
    credentials,
  });
}

export async function fetchFocusNode(
  nodeId: number,
  options?: { include_subtree?: boolean },
): Promise<FocusNode> {
  const params = new URLSearchParams();
  if (options?.include_subtree) {
    params.set("include_subtree", "true");
  }
  const query = params.toString();
  return apiFetch<FocusNode>(
    `/focus/nodes/${nodeId}${query ? `?${query}` : ""}`,
    { credentials },
  );
}

export async function createFocusNode(
  payload: FocusNodeCreatePayload,
): Promise<FocusNode> {
  return apiFetch<FocusNode>("/focus/nodes", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export async function updateFocusNode(
  nodeId: number,
  payload: FocusNodeUpdatePayload,
): Promise<FocusNode> {
  return apiFetch<FocusNode>(`/focus/nodes/${nodeId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export async function deleteFocusNode(nodeId: number): Promise<void> {
  await apiFetch<void>(`/focus/nodes/${nodeId}`, {
    method: "DELETE",
    credentials,
  });
}

export async function completeFocusNode(nodeId: number): Promise<FocusNode> {
  return apiFetch<FocusNode>(`/focus/nodes/${nodeId}/complete`, {
    method: "POST",
    credentials,
  });
}

export async function reorderFocusNodes(
  entries: FocusEntryReorderEntry[],
): Promise<FocusNode[]> {
  return apiFetch<FocusNode[]>("/focus/nodes/reorder", {
    method: "POST",
    credentials,
    body: { entries },
  });
}
