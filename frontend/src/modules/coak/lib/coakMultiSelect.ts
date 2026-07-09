// keel_web/src/modules/coak/lib/coakMultiSelect.ts

type CoakMultiSelectModifierEvent = {
  metaKey: boolean;
  ctrlKey: boolean;
};

export function isCoakMultiSelectModifier(event: CoakMultiSelectModifierEvent): boolean {
  return event.metaKey || event.ctrlKey;
}
