// keel_web/src/modules/focus/api/timeEntries.ts

import { apiFetch } from "../../../lib/api";
import { credentials } from "./shared";
import type { FocusNodeTimeEntry, FocusNodeTimerState } from "./types";

export async function fetchFocusNodeTimeEntries(
  nodeId: number,
): Promise<FocusNodeTimeEntry[]> {
  return apiFetch<FocusNodeTimeEntry[]>(`/focus/nodes/${nodeId}/time-entries`, {
    credentials,
  });
}

export async function fetchFocusNodeTimerState(
  nodeId: number,
): Promise<FocusNodeTimerState> {
  return apiFetch<FocusNodeTimerState>(`/focus/nodes/${nodeId}/timer`, {
    credentials,
  });
}

export async function startFocusNodeTimer(
  nodeId: number,
): Promise<FocusNodeTimerState> {
  return apiFetch<FocusNodeTimerState>(`/focus/nodes/${nodeId}/timer/start`, {
    method: "POST",
    credentials,
  });
}

export async function pauseFocusNodeTimer(
  nodeId: number,
): Promise<FocusNodeTimerState> {
  return apiFetch<FocusNodeTimerState>(`/focus/nodes/${nodeId}/timer/pause`, {
    method: "POST",
    credentials,
  });
}

export async function resumeFocusNodeTimer(
  nodeId: number,
): Promise<FocusNodeTimerState> {
  return apiFetch<FocusNodeTimerState>(`/focus/nodes/${nodeId}/timer/resume`, {
    method: "POST",
    credentials,
  });
}

export async function endFocusNodeTimer(
  nodeId: number,
): Promise<FocusNodeTimerState> {
  return apiFetch<FocusNodeTimerState>(`/focus/nodes/${nodeId}/timer/end`, {
    method: "POST",
    credentials,
  });
}
