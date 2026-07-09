// keel_web/src/modules/coak/lib/modals/coakItemEditorDrag.ts

export type CoakItemEditorNodeDragRequest = {
  nodeId: string;
  pointerId: number;
  clientX: number;
  clientY: number;
  token: number;
};

export function isCoakItemEditorInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  return (
    target.closest(
      'input, textarea, button, select, a, label, [contenteditable="true"], [role="button"]',
    ) != null
  );
}
