// stack_sandbox/frontend_web/src/modules/projects/hooks/usePagePaste.ts

// Window-level paste handler for file uploads on detail/create pages.

import { useEffect, useRef } from "react";

type UsePagePasteOptions = {
  enabled: boolean;
  onPasteFiles: (files: File[]) => void;
  shouldAcceptPaste?: () => boolean;
};

function isEditableFocused(): boolean {
  const active = document.activeElement;
  if (!active || !(active instanceof HTMLElement)) {
    return false;
  }
  const tag = active.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }
  return active.isContentEditable;
}

export function usePagePaste({
  enabled,
  onPasteFiles,
  shouldAcceptPaste,
}: UsePagePasteOptions): void {
  const onPasteFilesRef = useRef(onPasteFiles);
  const shouldAcceptPasteRef = useRef(shouldAcceptPaste);

  useEffect(() => {
    onPasteFilesRef.current = onPasteFiles;
  }, [onPasteFiles]);

  useEffect(() => {
    shouldAcceptPasteRef.current = shouldAcceptPaste;
  }, [shouldAcceptPaste]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onPaste = (event: ClipboardEvent) => {
      if (isEditableFocused()) {
        return;
      }

      const items = event.clipboardData?.items;
      if (!items?.length) {
        return;
      }

      const files: File[] = [];
      for (const item of items) {
        if (item.kind !== "file") {
          continue;
        }
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }

      if (files.length === 0) {
        return;
      }

      if (shouldAcceptPasteRef.current && !shouldAcceptPasteRef.current()) {
        return;
      }

      event.preventDefault();
      onPasteFilesRef.current(files);
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [enabled]);
}
