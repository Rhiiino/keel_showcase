// keel_web/src/modules/focus/lib/constellation/nodeSurfaceStyle.ts

import type { CSSProperties } from "react";

import {
  FOCUS_NODE_STATUS_GLOW_RGB,
  type FocusConstellationListNodeStyle,
  type FocusConstellationNodeShape,
  type FocusNodeStatus,
} from "../focus";
import { focusListCardTintRgb } from "../appearance";
import {
  AUTOMATION_HIGHLIGHT_RING_GLOW,
  PATH_HIGHLIGHT_RING_GLOW,
  SELECTION_RING_COLOR,
  SELECTION_RING_GLOW,
} from "../../components/constellation/node";
import { buildFocusConstellationListNodeSurface } from "./listNodeStyle";

export function buildHoverGlow(
  tint: { r: number; g: number; b: number } | null,
): string {
  if (tint) {
    return `0 0 0 2px rgba(${tint.r}, ${tint.g}, ${tint.b}, 0.62), 0 0 22px rgba(${tint.r}, ${tint.g}, ${tint.b}, 0.38)`;
  }
  return "0 0 0 2px rgba(226, 232, 240, 0.5), 0 0 20px rgba(148, 163, 184, 0.32)";
}

export function buildStatusBackGlow(status: FocusNodeStatus): string | null {
  const glow = FOCUS_NODE_STATUS_GLOW_RGB[status];
  if (!glow) {
    return null;
  }
  return `radial-gradient(circle, rgba(${glow.r}, ${glow.g}, ${glow.b}, 0.46) 0%, rgba(${glow.r}, ${glow.g}, ${glow.b}, 0.28) 38%, rgba(${glow.r}, ${glow.g}, ${glow.b}, 0) 72%)`;
}

export function buildSolidHoverBackground(
  tint: { r: number; g: number; b: number } | null,
): string {
  if (tint) {
    return `radial-gradient(circle at 50% 30%, rgb(${Math.round((tint.r + 20) / 2)}, ${Math.round((tint.g + 25) / 2)}, ${Math.round((tint.b + 31) / 2)}) 0%, rgb(20, 25, 31) 72%)`;
  }
  return "radial-gradient(circle at 50% 30%, rgb(36, 42, 50) 0%, rgb(20, 25, 31) 72%)";
}

export function styleList(...styles: Array<string | null | undefined>): string {
  return styles.filter(Boolean).join(", ");
}

export type FocusConstellationNodeSurfaceInput = {
  colorHex: string | null;
  listNodeStyle: FocusConstellationListNodeStyle;
  shape: FocusConstellationNodeShape;
  status: FocusNodeStatus;
  isOrigin: boolean;
  isSelected: boolean;
  isOnHighlightedPath: boolean;
  isAutomationHighlighted: boolean;
  isListNode: boolean;
  isNodeSurfaceHovered: boolean;
  isTaskLeafNode: boolean;
};

export type FocusConstellationNodeSurfaceStyles = {
  surfaceStyle: CSSProperties;
  hexStrokeColor: string;
  originAccentRgb: string;
  statusBackGlow: string | null;
};

export function resolveFocusConstellationNodeSurfaceStyles(
  input: FocusConstellationNodeSurfaceInput,
): FocusConstellationNodeSurfaceStyles {
  const {
    colorHex,
    listNodeStyle,
    shape,
    status,
    isOrigin,
    isSelected,
    isOnHighlightedPath,
    isAutomationHighlighted,
    isListNode,
    isNodeSurfaceHovered,
    isTaskLeafNode,
  } = input;

  const tint = focusListCardTintRgb(colorHex);
  const statusBackGlow = buildStatusBackGlow(status);

  const listSurface = isListNode
    ? buildFocusConstellationListNodeSurface({
        style: listNodeStyle,
        colorHex,
        shape,
      })
    : null;

  const ringColor = listSurface
    ? listSurface.ringColor
    : tint
      ? `rgba(${tint.r}, ${tint.g}, ${tint.b}, 0.72)`
      : "rgba(226, 232, 240, 0.2)";

  const nodeSurfaceStyle = listSurface
    ? {
        background: listSurface.background,
        boxShadow: listSurface.boxShadow,
      }
    : tint
      ? {
          boxShadow:
            shape === "circle" ? `inset 0 0 0 0.75px ${ringColor}` : "none",
          background: `radial-gradient(circle at 50% 30%, rgba(${tint.r}, ${tint.g}, ${tint.b}, 0.24), rgba(20, 25, 31, 0.96) 70%)`,
        }
      : {
          boxShadow:
            shape === "circle" ? `inset 0 0 0 0.75px ${ringColor}` : "none",
          background:
            "radial-gradient(circle at 50% 30%, rgba(226, 232, 240, 0.06), rgba(20, 25, 31, 0.96) 72%)",
        };

  const originAccent = tint ?? { r: 251, g: 191, b: 36 };
  const originAccentRgb = `${originAccent.r}, ${originAccent.g}, ${originAccent.b}`;
  const originSurfaceStyle = isOrigin
    ? {
        background: `radial-gradient(circle at 50% 24%, rgba(255, 255, 255, 0.34) 0%, rgba(${originAccentRgb}, 0.42) 34%, rgba(20, 25, 31, 0.98) 76%)`,
        boxShadow: styleList(
          nodeSurfaceStyle.boxShadow,
          `inset 0 0 0 2px rgba(${originAccentRgb}, 0.92)`,
          `inset 0 0 32px rgba(${originAccentRgb}, 0.28)`,
        ),
      }
    : nodeSurfaceStyle;
  const hoverGlow = isOrigin
    ? `0 0 0 3px rgba(${originAccentRgb}, 0.72)`
    : buildHoverGlow(tint);
  const isSelectionRingActive = isSelected && !isOrigin;
  const isPathHighlightActive = isOnHighlightedPath && !isSelectionRingActive;
  const isAutomationHighlightActive =
    isAutomationHighlighted && !isSelectionRingActive && !isPathHighlightActive;
  const interactiveSurfaceStyle: CSSProperties = {
    ...originSurfaceStyle,
    ...(isNodeSurfaceHovered
      ? {
          boxShadow: originSurfaceStyle.boxShadow
            ? `${originSurfaceStyle.boxShadow}, ${hoverGlow}`
            : hoverGlow,
          ...(isTaskLeafNode
            ? { background: buildSolidHoverBackground(tint) }
            : null),
          transform: "scale(1.04)",
        }
      : null),
    transition:
      "box-shadow 150ms ease, filter 150ms ease, transform 150ms ease",
    ...(isNodeSurfaceHovered ? { filter: "brightness(1.08)" } : null),
  };

  const surfaceStyle: CSSProperties = isSelectionRingActive
    ? {
        ...interactiveSurfaceStyle,
        boxShadow: interactiveSurfaceStyle.boxShadow
          ? `${interactiveSurfaceStyle.boxShadow}, ${SELECTION_RING_GLOW}`
          : SELECTION_RING_GLOW,
      }
    : isPathHighlightActive
      ? {
          ...interactiveSurfaceStyle,
          boxShadow: interactiveSurfaceStyle.boxShadow
            ? `${interactiveSurfaceStyle.boxShadow}, ${PATH_HIGHLIGHT_RING_GLOW}`
            : PATH_HIGHLIGHT_RING_GLOW,
        }
      : isAutomationHighlightActive
        ? {
            ...interactiveSurfaceStyle,
            boxShadow: interactiveSurfaceStyle.boxShadow
              ? `${interactiveSurfaceStyle.boxShadow}, ${AUTOMATION_HIGHLIGHT_RING_GLOW}`
              : AUTOMATION_HIGHLIGHT_RING_GLOW,
          }
        : interactiveSurfaceStyle;

  const hexStrokeColor = isSelectionRingActive
    ? SELECTION_RING_COLOR
    : isPathHighlightActive
      ? "rgba(125, 211, 252, 0.82)"
      : isAutomationHighlightActive
        ? "rgba(167, 139, 250, 0.95)"
    : isNodeSurfaceHovered
      ? tint
        ? `rgba(${tint.r}, ${tint.g}, ${tint.b}, 0.95)`
        : "rgba(226, 232, 240, 0.85)"
      : isOrigin
        ? `rgba(${originAccentRgb}, 0.94)`
        : ringColor;

  return {
    surfaceStyle,
    hexStrokeColor,
    originAccentRgb,
    statusBackGlow,
  };
}
