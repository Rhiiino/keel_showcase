// keel_web/src/modules/projects/lib/project/media/projectCardInteraction.ts

// Shared guards for project file/folder card click vs drag.

export function isProjectCardInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(target.closest("button, a, input, textarea, select, [data-no-row-drag]"));
}
