// keel_web/src/hooks/usePageFileDrop.ts

// Window-level file drag detection and drop handling for detail pages.

import { useEffect, useRef, useState } from "react";

type UsePageFileDropOptions = {
  enabled: boolean;
  onDropFiles: (files: File[]) => void;
  shouldAcceptDrop?: () => boolean;
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

function isFileDrag(event: DragEvent): boolean {
  return event.dataTransfer?.types.includes("Files") ?? false;
}

export function usePageFileDrop({
  enabled,
  onDropFiles,
  shouldAcceptDrop,
}: UsePageFileDropOptions): boolean {
  const [dragActive, setDragActive] = useState(false);
  const depthRef = useRef(0);
  const onDropFilesRef = useRef(onDropFiles);
  const shouldAcceptDropRef = useRef(shouldAcceptDrop);

  useEffect(() => {
    onDropFilesRef.current = onDropFiles;
  }, [onDropFiles]);

  useEffect(() => {
    shouldAcceptDropRef.current = shouldAcceptDrop;
  }, [shouldAcceptDrop]);

  useEffect(() => {
    if (!enabled) {
      depthRef.current = 0;
      setDragActive(false);
      return;
    }

    const onDragEnter = (event: DragEvent) => {
      if (!isFileDrag(event)) {
        return;
      }
      event.preventDefault();
      depthRef.current += 1;
      setDragActive(true);
    };

    const onDragLeave = (event: DragEvent) => {
      if (!isFileDrag(event)) {
        return;
      }
      event.preventDefault();
      depthRef.current = Math.max(0, depthRef.current - 1);
      if (depthRef.current === 0) {
        setDragActive(false);
      }
    };

    const onDragOver = (event: DragEvent) => {
      if (!isFileDrag(event)) {
        return;
      }
      event.preventDefault();
    };

    const resetDragState = () => {
      depthRef.current = 0;
      setDragActive(false);
    };

    // Capture phase so nested drop zones can stopPropagation without leaving drag UI stuck.
    const onDropCapture = (event: DragEvent) => {
      if (!isFileDrag(event)) {
        return;
      }
      resetDragState();
    };

    const onDrop = (event: DragEvent) => {
      if (!isFileDrag(event)) {
        return;
      }
      event.preventDefault();

      if (isEditableFocused()) {
        return;
      }

      if (shouldAcceptDropRef.current && !shouldAcceptDropRef.current()) {
        return;
      }

      if (event.dataTransfer?.files.length) {
        onDropFilesRef.current(Array.from(event.dataTransfer.files));
      }
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDropCapture, true);
    window.addEventListener("drop", onDrop);

    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDropCapture, true);
      window.removeEventListener("drop", onDrop);
    };
  }, [enabled]);

  return dragActive;
}
