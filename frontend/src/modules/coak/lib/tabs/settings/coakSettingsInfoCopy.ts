// keel_web/src/modules/coak/lib/tabs/settings/coakSettingsInfoCopy.ts

import type { CoakItemKind } from "../../../api";

export const COAK_SETTINGS_INFO = {
  connectionColor:
    "Color of the lines linking parent and child nodes. Opacity fades from the source node toward the target.",
  titleColor: "Color of node name labels drawn on the constellation graph.",
  connectionWidth: "Thickness of the connection lines between nodes.",
  autoOptimizeLayout:
    "Locks manual node dragging and re-layouts the tree when structure changes. Children are distributed around the origin; siblings branch at the chosen angle.",
  autoOptimizeConnectionDistance:
    "Uniform spacing between a parent node and its direct children when auto-optimize re-layouts the tree.",
  autoOptimizeConnectionAngle:
    "Branch angle between sibling connections from the same parent (0–180°). A single child still uses the inline 180° layout.",
  constellationBackground:
    "Gradient behind the 3D constellation canvas. Stormy sky adds intermittent lightning; Rainy night adds layered falling rain.",
  persistentNodeModals:
    "Keep item editor modals visible for every node on the constellation, not only nodes you select.",
  itemEditorEnlarge:
    "Scale item editor modals larger when you hover over them or focus a field inside them.",
  originPulse:
    "Animate the origin node and send a repeating color wave along connections to terminal nodes.",
  nodeRevolveSpeed:
    "Angular speed for the Spin context-menu action, which rotates a node and its descendants around the parent connection until you click the canvas.",
  nodeSize:
    "Scale the diameter of constellation item nodes. Applies to every node visual style and scales the origin node proportionally.",
} as const;

const NODE_VISUAL_INFO: Record<CoakItemKind, string> = {
  folder: "Choose the 3D sphere style used for folder items on the constellation.",
  note: "Choose the 3D sphere style used for note items on the constellation.",
  flash: "Choose the 3D sphere style used for flash card items on the constellation.",
};

export function coakNodeVisualSettingInfo(kind: CoakItemKind): string {
  return NODE_VISUAL_INFO[kind];
}
