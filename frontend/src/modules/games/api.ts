// keel_web/src/modules/games/api.ts

import { apiFetch } from "../../lib/api";

const credentials: RequestCredentials = "include";

export const gamesQueryKeys = {
  all: ["games"] as const,
  resume: (gameKey: string) => [...gamesQueryKeys.all, "resume", gameKey] as const,
  active: (gameKey: string, level: number) =>
    [...gamesQueryKeys.all, "active", gameKey, level] as const,
  stats: (gameKey: string) => [...gamesQueryKeys.all, "stats", gameKey] as const,
};

export type GameSession = {
  id: string;
  user_id: number;
  game_key: string;
  level: number;
  status: string;
  state: Record<string, unknown>;
  move_count: number;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
};

export type GameStats = {
  game_key: string;
  stats: Record<string, unknown>;
  updated_at: string;
};

export type GameSessionCompleteResult = {
  session: GameSession;
  duration_ms: number;
  next_level: number | null;
};

export async function fetchResumeSession(gameKey: string): Promise<GameSession> {
  return apiFetch<GameSession>(
    `/games/sessions/resume?game_key=${encodeURIComponent(gameKey)}`,
    { credentials },
  );
}

export async function fetchActiveSession(
  gameKey: string,
  level: number,
): Promise<GameSession> {
  return apiFetch<GameSession>(
    `/games/sessions/active?game_key=${encodeURIComponent(gameKey)}&level=${level}`,
    { credentials },
  );
}

export async function createGameSession(
  gameKey: string,
  level: number,
): Promise<GameSession> {
  return apiFetch<GameSession>("/games/sessions", {
    method: "POST",
    credentials,
    body: { game_key: gameKey, level },
  });
}

export async function patchGameSession(
  sessionId: string,
  payload: { state: Record<string, unknown>; move_count: number },
): Promise<GameSession> {
  return apiFetch<GameSession>(`/games/sessions/${sessionId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export async function completeGameSession(
  sessionId: string,
  payload: { state: Record<string, unknown>; move_count: number },
): Promise<GameSessionCompleteResult> {
  return apiFetch<GameSessionCompleteResult>(`/games/sessions/${sessionId}/complete`, {
    method: "POST",
    credentials,
    body: payload,
  });
}

export async function restartGameSession(sessionId: string): Promise<GameSession> {
  return apiFetch<GameSession>(`/games/sessions/${sessionId}/restart`, {
    method: "POST",
    credentials,
  });
}

export async function fetchGameStats(gameKey: string): Promise<GameStats> {
  return apiFetch<GameStats>(`/games/stats?game_key=${encodeURIComponent(gameKey)}`, {
    credentials,
  });
}

export function gamePlayPath(gameKey: string): string {
  return `/games/${gameKey}`;
}
