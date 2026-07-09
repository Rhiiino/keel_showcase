// keel_web/src/modules/projects/lib/workspace/canvas/workspaceCanvasPaste.ts

// System clipboard paste on the project workspace canvas (text notes and files).

import { WORKSPACE_MEDIA_DRAG_PREFIX } from "./workspaceDrag";

const FILE_PASTE_OFFSET = { x: 28, y: 28 } as const;

export function isEditablePasteTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true;
  }
  return target.isContentEditable;
}

export function isPointerOverElement(
  element: HTMLElement,
  clientX: number,
  clientY: number,
): boolean {
  const rect = element.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

export function readClipboardFiles(dataTransfer: DataTransfer): File[] {
  // Browsers expose pasted files on `files` and again via `items`. Reading both
  // duplicates uploads when metadata (e.g. lastModified) differs between sources.
  const fromList =
    dataTransfer.files.length > 0
      ? Array.from(dataTransfer.files)
      : Array.from(dataTransfer.items)
          .filter((item) => item.kind === "file")
          .map((item) => item.getAsFile())
          .filter((file): file is File => file !== null);

  const seen = new Set<string>();
  return fromList.filter((file) => {
    const key = `${file.name}:${file.size}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function readClipboardPlainText(dataTransfer: DataTransfer): string | null {
  const text = dataTransfer.getData("text/plain")?.trim();
  if (!text) {
    return null;
  }
  if (text.startsWith(WORKSPACE_MEDIA_DRAG_PREFIX)) {
    return null;
  }
  return text;
}

export function flowPositionForPastedFiles(
  base: { x: number; y: number },
  index: number,
): { x: number; y: number } {
  return {
    x: base.x + FILE_PASTE_OFFSET.x * index,
    y: base.y + FILE_PASTE_OFFSET.y * index,
  };
}

export function clientPointInElementCenter(element: HTMLElement): {
  x: number;
  y: number;
} {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}
