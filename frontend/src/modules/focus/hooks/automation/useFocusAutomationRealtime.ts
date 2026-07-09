// keel_web/src/modules/focus/hooks/automation/useFocusAutomationRealtime.ts

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { getApiBaseUrl } from "../../../../lib/api";
import { parseSseStream, type SseEventHandler } from "../../../../lib/sse";
import { focusQueryKeys } from "../../api/queryKeys";
import type { useFocusAutomationLog } from "./useFocusAutomationLog";

type FocusAutomationRealtimeOptions = {
  enabled: boolean;
  appendEntry: ReturnType<typeof useFocusAutomationLog>["appendEntry"];
  onPanToNode?: (nodeId: number) => void;
  onFrameNodes?: (nodeIds: number[]) => void;
  onSetNodeExpanded?: (nodeId: number, expanded: boolean) => void;
  onAlignChildren?: (parentNodeId: number) => void;
  onPositionsChanged?: (
    positions: ReadonlyArray<{ key: string; x: number; y: number }>,
  ) => void;
};

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function readNodeIds(data: Record<string, unknown>): number[] {
  // Order matters: prefer node_ids, then highlight/changed. Skip empty arrays
  // because the backend serializes all three fields (empty lists included), so
  // `??` would lock onto an empty `highlighted_node_ids` for expansion events.
  for (const key of ["node_ids", "highlighted_node_ids", "changed_node_ids"] as const) {
    const raw = data[key];
    if (Array.isArray(raw) && raw.length > 0) {
      const ids = raw.filter((value): value is number => typeof value === "number");
      if (ids.length > 0) {
        return ids;
      }
    }
  }
  return [];
}

function readConstellationPositions(
  data: Record<string, unknown>,
): Array<{ key: string; x: number; y: number }> {
  const raw = data.constellation_positions;
  if (!Array.isArray(raw)) {
    return [];
  }
  const positions: Array<{ key: string; x: number; y: number }> = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const entry = item as Record<string, unknown>;
    const key = readString(entry.key);
    const x = readNumber(entry.x);
    const y = readNumber(entry.y);
    if (key && x !== undefined && y !== undefined) {
      positions.push({ key, x, y });
    }
  }
  return positions;
}

export function useFocusAutomationRealtime({
  enabled,
  appendEntry,
  onPanToNode,
  onFrameNodes,
  onSetNodeExpanded,
  onAlignChildren,
  onPositionsChanged,
}: FocusAutomationRealtimeOptions) {
  const queryClient = useQueryClient();
  const onPanToNodeRef = useRef(onPanToNode);
  const onFrameNodesRef = useRef(onFrameNodes);
  const onSetNodeExpandedRef = useRef(onSetNodeExpanded);
  const onAlignChildrenRef = useRef(onAlignChildren);
  const onPositionsChangedRef = useRef(onPositionsChanged);
  onPanToNodeRef.current = onPanToNode;
  onFrameNodesRef.current = onFrameNodes;
  onSetNodeExpandedRef.current = onSetNodeExpanded;
  onAlignChildrenRef.current = onAlignChildren;
  onPositionsChangedRef.current = onPositionsChanged;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const abortController = new AbortController();
    const baseUrl = getApiBaseUrl().replace(/\/$/, "");

    const run = async () => {
      try {
        const response = await fetch(`${baseUrl}/connectors/focus/events`, {
          credentials: "include",
          signal: abortController.signal,
        });
        await parseSseStream(response, ((eventName: string, data: Record<string, unknown>) => {
          const actorLabel = readString(
            typeof data.actor === "object" && data.actor !== null
              ? (data.actor as Record<string, unknown>).label
              : undefined,
          );
          const toolName = readString(data.tool_name);
          const durationMs = readNumber(data.duration_ms);
          const panToNodeId = readNumber(data.pan_to_node_id);
          const nodeIds = readNodeIds(data);
          const expanded = readBoolean(data.expanded);

          if (eventName === "focus.automation.session.enabled") {
            appendEntry({
              kind: "session",
              summary: "Automation session enabled",
              detail: actorLabel,
            });
            return;
          }

          if (eventName === "focus.automation.session.disabled") {
            queryClient.setQueryData(focusQueryKeys.automationSession(), null);
            appendEntry({
              kind: "session",
              summary: "Automation session ended",
              detail: actorLabel,
            });
            return;
          }

          if (eventName === "focus.nodes.highlighted") {
            const summary =
              nodeIds.length > 1
                ? `Highlighted ${nodeIds.length} nodes`
                : nodeIds.length === 1
                  ? `Highlighted node ${nodeIds[0]}`
                  : "Highlighted nodes";
            appendEntry({
              kind: "nodes_highlighted",
              summary,
              detail: nodeIds.length ? `Nodes: ${nodeIds.join(", ")}` : undefined,
            });
            if (nodeIds.length > 0) {
              onFrameNodesRef.current?.(nodeIds);
            }
            return;
          }

          if (eventName === "focus.constellation.node.expansion_changed") {
            const nodeId = nodeIds[0];
            if (nodeId && expanded !== undefined) {
              onSetNodeExpandedRef.current?.(nodeId, expanded);
            }
            appendEntry({
              kind: "expansion_changed",
              summary:
                nodeId && expanded !== undefined
                  ? `${expanded ? "Expanded" : "Collapsed"} node ${nodeId}`
                  : "Constellation expansion changed",
            });
            return;
          }

          if (eventName === "focus.constellation.children_aligned") {
            const parentId = nodeIds[0];
            if (parentId) {
              onAlignChildrenRef.current?.(parentId);
            }
            appendEntry({
              kind: "children_aligned",
              summary: parentId
                ? `Aligned children around node ${parentId}`
                : "Aligned constellation children",
            });
            return;
          }

          if (eventName === "focus.constellation.positions_changed") {
            const positions = readConstellationPositions(data);
            if (positions.length > 0) {
              onPositionsChangedRef.current?.(positions);
            }
            appendEntry({
              kind: "positions_changed",
              summary:
                nodeIds.length > 0
                  ? `Moved constellation node ${nodeIds[0]}`
                  : "Updated constellation positions",
              detail:
                positions.length > 0
                  ? positions.map((entry) => `${entry.key}=(${entry.x}, ${entry.y})`).join(", ")
                  : undefined,
            });
            if (nodeIds[0]) {
              onPanToNodeRef.current?.(nodeIds[0]!);
            }
            return;
          }

          if (eventName === "focus.tool_call.started") {
            appendEntry({
              kind: "tool_start",
              summary: toolName ? `Started ${toolName}` : "Tool call started",
              detail: readString(data.arguments_summary),
            });
            // Expand/collapse is handled by the expansion_changed event; panning
            // here would only flash a highlight without unfolding the node.
            if (panToNodeId && toolName !== "set_focus_constellation_node_expanded") {
              onPanToNodeRef.current?.(panToNodeId);
            }
            return;
          }

          if (eventName === "focus.tool_call.completed") {
            appendEntry({
              kind: "tool_complete",
              summary: toolName ? `Completed ${toolName}` : "Tool call completed",
              detail:
                readString(data.result_summary) ??
                (nodeIds.length ? `Nodes: ${nodeIds.join(", ")}` : undefined),
              durationMs,
            });
            if (data.should_refetch_focus === true) {
              void queryClient.invalidateQueries({ queryKey: focusQueryKeys.all });
            }
            if (toolName === "highlight_focus_nodes" && nodeIds.length > 0) {
              onFrameNodesRef.current?.(nodeIds);
            } else if (panToNodeId && toolName !== "set_focus_constellation_node_expanded") {
              onPanToNodeRef.current?.(panToNodeId);
            }
            return;
          }

          if (eventName === "focus.tool_call.failed") {
            appendEntry({
              kind: "tool_failed",
              summary: toolName ? `Failed ${toolName}` : "Tool call failed",
              detail: readString(data.message),
              durationMs,
            });
            return;
          }

          if (eventName === "focus.node.viewed") {
            appendEntry({
              kind: "node_viewed",
              summary: nodeIds.length ? `Viewing node ${nodeIds[0]}` : "Viewing node",
            });
            if (panToNodeId ?? nodeIds[0]) {
              onPanToNodeRef.current?.(panToNodeId ?? nodeIds[0]!);
            }
          }
        }) satisfies SseEventHandler);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }
        const message = error instanceof Error ? error.message : "Automation stream disconnected";
        appendEntry({
          kind: "info",
          summary: "Automation stream disconnected",
          detail: message,
        });
      }
    };

    void run();

    return () => {
      abortController.abort();
    };
  }, [appendEntry, enabled, queryClient]);
}
