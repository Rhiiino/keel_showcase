// keel_web/src/lib/keelPersona/applyLook.ts

import type { KeelPersonaElement, KeelPersonaLook } from "./types";

export function applyKeelPersonaLook(
  elements: readonly KeelPersonaElement[],
  look: KeelPersonaLook | Partial<KeelPersonaLook> | null | undefined,
): KeelPersonaElement[] {
  if (!look) {
    return elements.map((element) => ({ ...element }));
  }

  const visibleGroupIds = new Set(look.visibleGroupIds ?? []);
  const hiddenIds = new Set(look.hiddenElementIds ?? []);
  const visibleIds = look.visibleElementIds ? new Set(look.visibleElementIds) : null;

  return elements.map((element) => {
    let visible = element.visible;

    if (element.groupId && visibleGroupIds.size > 0) {
      const inListedGroup = visibleGroupIds.has(element.groupId);
      if (inListedGroup) {
        visible = true;
      } else if (element.tags?.includes("gaze") || element.tags?.includes("accessory")) {
        visible = false;
      }
    }

    if (hiddenIds.has(element.id)) {
      visible = false;
    }

    if (visibleIds?.has(element.id)) {
      visible = true;
    }

    return { ...element, visible };
  });
}

export function captureLookFromElements(
  elements: readonly KeelPersonaElement[],
  name: string,
): KeelPersonaLook {
  const visibleGroupIds = [
    ...new Set(
      elements
        .filter((element) => element.visible && element.groupId)
        .map((element) => element.groupId as string),
    ),
  ];

  return {
    id: crypto.randomUUID(),
    name,
    visibleGroupIds,
    visibleElementIds: elements.filter((element) => element.visible).map((element) => element.id),
    hiddenElementIds: elements.filter((element) => !element.visible).map((element) => element.id),
  };
}

export const KEEL_PERSONA_GAZE_GROUPS = [
  { id: "gaze-straight", label: "Straight on" },
  { id: "gaze-bottom-left", label: "Bottom left" },
  { id: "gaze-bottom-right", label: "Bottom right" },
  { id: "gaze-top-left", label: "Top left" },
  { id: "gaze-top-right", label: "Top right" },
] as const;
