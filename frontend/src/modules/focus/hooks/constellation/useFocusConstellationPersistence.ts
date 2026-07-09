// keel_web/src/modules/focus/hooks/constellation/useFocusConstellationPersistence.ts

// Loads and saves focus constellation layout state via the API.

import type { Viewport } from "@xyflow/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchFocusConstellationState,
  focusQueryKeys,
  updateFocusConstellationState,
  type FocusConstellationState,
} from "../../api";
import {
  FOCUS_CONSTELLATION_EXPANDED_IDS_STORAGE_KEY,
  FOCUS_CONSTELLATION_NODE_POSITIONS_STORAGE_KEY,
  FOCUS_CONSTELLATION_WORK_ORDER_BADGE_ANGLE_STORAGE_KEY_PREFIX,
  FOCUS_CONSTELLATION_VIEWPORT_STORAGE_KEY,
} from "../../lib/focus";
import type { ConstellationPoint } from "../../lib/constellation/layout";
import { isStoredViewport } from "../../lib/constellation/viewport";

const CONSTELLATION_STATE_VERSION = 6;
const SAVE_DEBOUNCE_MS = 400;

type StoredNodePosition = {
  key: string;
  x: number;
  y: number;
};

type StoredWorkOrderBadgeAngle = {
  key: string;
  angle: number;
};

function isStoredNodePosition(value: unknown): value is StoredNodePosition {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<StoredNodePosition>;
  return (
    typeof candidate.key === "string" &&
    typeof candidate.x === "number" &&
    typeof candidate.y === "number"
  );
}

function nodePositionsToMap(
  positions: readonly { key: string; x: number; y: number }[],
): Map<string, ConstellationPoint> {
  return new Map(positions.map((entry) => [entry.key, { x: entry.x, y: entry.y }] as const));
}

function mapToNodePositions(
  positions: ReadonlyMap<string, ConstellationPoint>,
): StoredNodePosition[] {
  return [...positions.entries()].map(([key, point]) => ({
    key,
    x: point.x,
    y: point.y,
  }));
}

function badgeAnglesToMap(
  angles: readonly { key: string; angle: number }[] | undefined,
): Map<string, number> {
  return new Map((angles ?? []).map((entry) => [entry.key, entry.angle] as const));
}

function mapToBadgeAngles(
  angles: ReadonlyMap<string, number>,
): StoredWorkOrderBadgeAngle[] {
  return [...angles.entries()].map(([key, angle]) => ({ key, angle }));
}

function readLegacyExpandedIds(): string[] {
  try {
    const raw = window.localStorage.getItem(FOCUS_CONSTELLATION_EXPANDED_IDS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.every((id) => typeof id === "string") ? parsed : [];
  } catch {
    return [];
  }
}

function readLegacyNodePositions(): StoredNodePosition[] {
  try {
    const raw = window.localStorage.getItem(FOCUS_CONSTELLATION_NODE_POSITIONS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isStoredNodePosition);
  } catch {
    return [];
  }
}

function readLegacyViewport(): Viewport | null {
  try {
    const raw = window.localStorage.getItem(FOCUS_CONSTELLATION_VIEWPORT_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return isStoredViewport(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readLegacyWorkOrderBadgeAngles(): StoredWorkOrderBadgeAngle[] {
  const angles: StoredWorkOrderBadgeAngle[] = [];
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const storageKey = window.localStorage.key(index);
      if (!storageKey?.startsWith(FOCUS_CONSTELLATION_WORK_ORDER_BADGE_ANGLE_STORAGE_KEY_PREFIX)) {
        continue;
      }
      const key = storageKey.slice(
        FOCUS_CONSTELLATION_WORK_ORDER_BADGE_ANGLE_STORAGE_KEY_PREFIX.length,
      );
      const raw = window.localStorage.getItem(storageKey);
      const angle = raw ? Number.parseFloat(raw) : Number.NaN;
      if (key.length > 0 && Number.isFinite(angle)) {
        angles.push({ key, angle });
      }
    }
  } catch {
    return [];
  }
  return angles;
}

function clearLegacyConstellationStorage() {
  try {
    window.localStorage.removeItem(FOCUS_CONSTELLATION_EXPANDED_IDS_STORAGE_KEY);
    window.localStorage.removeItem(FOCUS_CONSTELLATION_NODE_POSITIONS_STORAGE_KEY);
    window.localStorage.removeItem(FOCUS_CONSTELLATION_VIEWPORT_STORAGE_KEY);
    const badgeAngleKeys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const storageKey = window.localStorage.key(index);
      if (storageKey?.startsWith(FOCUS_CONSTELLATION_WORK_ORDER_BADGE_ANGLE_STORAGE_KEY_PREFIX)) {
        badgeAngleKeys.push(storageKey);
      }
    }
    for (const storageKey of badgeAngleKeys) {
      window.localStorage.removeItem(storageKey);
    }
  } catch {
    // Ignore storage failures.
  }
}

function isEmptyServerState(state: FocusConstellationState): boolean {
  return (
    state.node_positions.length === 0 &&
    (state.work_order_badge_angles?.length ?? 0) === 0 &&
    state.expanded_ids.length === 0 &&
    state.standalone_list_ids.length === 0 &&
    state.viewport === null
  );
}

function buildLegacyState(): FocusConstellationState | null {
  const nodePositions = readLegacyNodePositions();
  const expandedIds = readLegacyExpandedIds();
  const workOrderBadgeAngles = readLegacyWorkOrderBadgeAngles();
  const viewport = readLegacyViewport();

  if (
    nodePositions.length === 0 &&
    expandedIds.length === 0 &&
    workOrderBadgeAngles.length === 0 &&
    viewport === null
  ) {
    return null;
  }

  return {
    state_version: CONSTELLATION_STATE_VERSION,
    node_positions: nodePositions,
    work_order_badge_angles: workOrderBadgeAngles,
    expanded_ids: expandedIds,
    standalone_list_ids: [],
    viewport,
  };
}

function serializeState(args: {
  expandedIds: ReadonlySet<string>;
  nodePositions: ReadonlyMap<string, ConstellationPoint>;
  workOrderBadgeAngles: ReadonlyMap<string, number>;
  viewport: Viewport | null;
}): FocusConstellationState {
  return {
    state_version: CONSTELLATION_STATE_VERSION,
    node_positions: mapToNodePositions(args.nodePositions),
    work_order_badge_angles: mapToBadgeAngles(args.workOrderBadgeAngles),
    expanded_ids: [...args.expandedIds],
    standalone_list_ids: [],
    viewport: args.viewport,
  };
}

function stableSerializeState(args: {
  expandedIds: ReadonlySet<string>;
  nodePositions: ReadonlyMap<string, ConstellationPoint>;
  workOrderBadgeAngles: ReadonlyMap<string, number>;
  viewport: Viewport | null;
}): string {
  const payload = serializeState(args);
  return JSON.stringify({
    ...payload,
    expanded_ids: [...payload.expanded_ids].sort(),
    node_positions: [...payload.node_positions].sort((left, right) =>
      left.key.localeCompare(right.key),
    ),
    work_order_badge_angles: [...(payload.work_order_badge_angles ?? [])].sort((left, right) =>
      left.key.localeCompare(right.key),
    ),
  });
}

function snapshotFromServerState(state: FocusConstellationState): string {
  return stableSerializeState({
    expandedIds: new Set(state.expanded_ids),
    nodePositions: nodePositionsToMap(state.node_positions),
    workOrderBadgeAngles: badgeAnglesToMap(state.work_order_badge_angles),
    viewport: state.viewport,
  });
}



// ----- Constellation persistence hook
export function useFocusConstellationPersistence() {
  const queryClient = useQueryClient();
  const stateQuery = useQuery({
    queryKey: focusQueryKeys.constellationState(),
    queryFn: fetchFocusConstellationState,
  });

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [nodePositions, setNodePositions] = useState<Map<string, ConstellationPoint>>(
    () => new Map(),
  );
  const [workOrderBadgeAngles, setWorkOrderBadgeAngles] = useState<Map<string, number>>(
    () => new Map(),
  );
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [hasPendingSave, setHasPendingSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const skipSaveRef = useRef(true);
  const saveTimerRef = useRef<number | null>(null);
  const savedSnapshotRef = useRef<string | null>(null);
  const latestStateRef = useRef({
    expandedIds,
    nodePositions,
    workOrderBadgeAngles,
    viewport,
  });

  useEffect(() => {
    savedSnapshotRef.current = savedSnapshot;
  }, [savedSnapshot]);

  useEffect(() => {
    latestStateRef.current = {
      expandedIds,
      nodePositions,
      workOrderBadgeAngles,
      viewport,
    };
  }, [expandedIds, nodePositions, viewport, workOrderBadgeAngles]);

  useEffect(() => {
    if (!stateQuery.data || isHydrated) {
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      let nextState = stateQuery.data;
      const legacyState = buildLegacyState();

      if (legacyState && isEmptyServerState(nextState)) {
        try {
          nextState = await updateFocusConstellationState(legacyState);
          queryClient.setQueryData(focusQueryKeys.constellationState(), nextState);
          clearLegacyConstellationStorage();
        } catch {
          nextState = legacyState;
        }
      } else if (legacyState && legacyState.work_order_badge_angles.length > 0) {
        const existingKeys = new Set(
          (nextState.work_order_badge_angles ?? []).map((entry) => entry.key),
        );
        const migratedBadgeAngles = legacyState.work_order_badge_angles.filter(
          (entry) => !existingKeys.has(entry.key),
        );

        if (migratedBadgeAngles.length > 0) {
          try {
            nextState = await updateFocusConstellationState({
              ...nextState,
              state_version: CONSTELLATION_STATE_VERSION,
              work_order_badge_angles: [
                ...(nextState.work_order_badge_angles ?? []),
                ...migratedBadgeAngles,
              ],
            });
            queryClient.setQueryData(focusQueryKeys.constellationState(), nextState);
            clearLegacyConstellationStorage();
          } catch {
            nextState = {
              ...nextState,
              work_order_badge_angles: [
                ...(nextState.work_order_badge_angles ?? []),
                ...migratedBadgeAngles,
              ],
            };
          }
        }
      }

      if (cancelled) {
        return;
      }

      setExpandedIds(new Set(nextState.expanded_ids));
      setNodePositions(nodePositionsToMap(nextState.node_positions));
      setWorkOrderBadgeAngles(
        badgeAnglesToMap(nextState.work_order_badge_angles),
      );
      setViewport(nextState.viewport);
      setSavedSnapshot(snapshotFromServerState(nextState));
      setIsHydrated(true);
      skipSaveRef.current = false;
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, queryClient, stateQuery.data]);

  const currentSnapshot = stableSerializeState({
    expandedIds,
    nodePositions,
    workOrderBadgeAngles,
    viewport,
  });

  const isDirty =
    isHydrated &&
    (hasPendingSave ||
      isSaving ||
      (savedSnapshot !== null && currentSnapshot !== savedSnapshot));

  const flushSave = useCallback(async () => {
    if (skipSaveRef.current || !isHydrated) {
      return;
    }

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      setHasPendingSave(false);
    }

    const snapshot = stableSerializeState(latestStateRef.current);
    if (
      savedSnapshotRef.current !== null &&
      snapshot === savedSnapshotRef.current
    ) {
      return;
    }

    const payload = serializeState(latestStateRef.current);
    setIsSaving(true);
    try {
      const saved = await updateFocusConstellationState(payload);
      queryClient.setQueryData(focusQueryKeys.constellationState(), saved);
      const nextSnapshot = stableSerializeState(latestStateRef.current);
      savedSnapshotRef.current = nextSnapshot;
      setSavedSnapshot(nextSnapshot);
    } catch {
      // Ignore transient save failures; the next change will retry.
    } finally {
      setIsSaving(false);
    }
  }, [isHydrated, queryClient]);

  const scheduleSave = useCallback(() => {
    if (skipSaveRef.current || !isHydrated) {
      return;
    }
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    setHasPendingSave(true);
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      setHasPendingSave(false);
      void flushSave();
    }, SAVE_DEBOUNCE_MS);
  }, [flushSave, isHydrated]);

  useEffect(() => {
    scheduleSave();
  }, [expandedIds, nodePositions, viewport, workOrderBadgeAngles, scheduleSave]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      void flushSave();
    };
  }, [flushSave]);

  const persistViewport = useCallback((nextViewport: Viewport) => {
    setViewport((current) => {
      if (
        current &&
        current.x === nextViewport.x &&
        current.y === nextViewport.y &&
        current.zoom === nextViewport.zoom
      ) {
        return current;
      }
      return nextViewport;
    });
  }, []);

  return {
    expandedIds,
    setExpandedIds,
    nodePositions,
    setNodePositions,
    workOrderBadgeAngles,
    setWorkOrderBadgeAngles,
    viewport,
    persistViewport,
    flushSave,
    isDirty,
    isSaving,
    isStateLoading: stateQuery.isLoading,
    isStateHydrated: isHydrated,
    isStateError: stateQuery.isError,
  };
}
