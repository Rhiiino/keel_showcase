// keel_web/src/modules/coak/lib/search/coakSearchFocus.ts

export type CoakSearchFocusSlot = "directory" | "constellation";

const searchInputs: Record<CoakSearchFocusSlot, HTMLInputElement | null> = {
  directory: null,
  constellation: null,
};

let activeSearchSlot: CoakSearchFocusSlot | null = null;

export function registerCoakSearchInput(
  slot: CoakSearchFocusSlot,
  input: HTMLInputElement | null,
) {
  searchInputs[slot] = input;
  if (input == null && activeSearchSlot === slot) {
    activeSearchSlot = null;
  }
}

export function setActiveCoakSearchSlot(slot: CoakSearchFocusSlot | null) {
  activeSearchSlot = slot;
}

export function restoreCoakSearchInputFocus() {
  const slot = activeSearchSlot;
  const input = slot != null ? searchInputs[slot] : null;
  if (input == null) {
    return;
  }

  input.focus({ preventScroll: true });
}

/** Run after search side effects (e.g. closing editors) that may steal focus. */
export function scheduleCoakSearchInputFocusRestore() {
  queueMicrotask(() => {
    restoreCoakSearchInputFocus();
    requestAnimationFrame(() => {
      restoreCoakSearchInputFocus();
    });
  });
}
