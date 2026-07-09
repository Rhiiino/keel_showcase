// keel_web/src/modules/coak/hooks/tabs/directory/useCoakItemFilePicker.tsx

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { createPortal } from "react-dom";

import { ApiError } from "../../../../../lib/api";
import type { MediaObject } from "../../../../media/api";
import { MediaObjectPickerDialog } from "../../../../media/components/pickers";

type UseCoakItemFilePickerOptions = {
  disabled?: boolean;
  hasAttachedFile?: boolean;
  /** Portal overlays to document.body (required for constellation floating modals inside CSS transforms). */
  portalDialogs?: boolean;
  mediaPickerZIndexClass?: string;
  onAttachFile: (file: File) => Promise<void>;
  onAttachMedia: (media: MediaObject) => Promise<void>;
  onReplaceFile: (file: File) => Promise<void>;
  onReplaceMedia: (media: MediaObject) => Promise<void>;
};

function resolveFileActionError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Failed to update the attached file.";
}

export function useCoakItemFilePicker({
  disabled = false,
  hasAttachedFile = false,
  portalDialogs = false,
  mediaPickerZIndexClass = "z-[70]",
  onAttachFile,
  onAttachMedia,
  onReplaceFile,
  onReplaceMedia,
}: UseCoakItemFilePickerOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const hasAttachedFileRef = useRef(hasAttachedFile);
  const onAttachFileRef = useRef(onAttachFile);
  const onAttachMediaRef = useRef(onAttachMedia);
  const onReplaceFileRef = useRef(onReplaceFile);
  const onReplaceMediaRef = useRef(onReplaceMedia);

  useEffect(() => {
    hasAttachedFileRef.current = hasAttachedFile;
  }, [hasAttachedFile]);

  useEffect(() => {
    onAttachFileRef.current = onAttachFile;
  }, [onAttachFile]);

  useEffect(() => {
    onAttachMediaRef.current = onAttachMedia;
  }, [onAttachMedia]);

  useEffect(() => {
    onReplaceFileRef.current = onReplaceFile;
  }, [onReplaceFile]);

  useEffect(() => {
    onReplaceMediaRef.current = onReplaceMedia;
  }, [onReplaceMedia]);

  const runAction = async (action: () => Promise<void>) => {
    setActionPending(true);
    setActionError(null);
    try {
      await action();
    } catch (error) {
      setActionError(resolveFileActionError(error));
      throw error;
    } finally {
      setActionPending(false);
    }
  };

  const openUploadFromDevice = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const openUploadFromMedia = useCallback(() => {
    setMediaPickerOpen(true);
  }, []);

  const handleFileInputChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (hasAttachedFileRef.current) {
      await runAction(() => onReplaceFileRef.current(file));
      return;
    }

    await runAction(() => onAttachFileRef.current(file));
  }, []);

  const handleMediaSelected = useCallback(async (media: MediaObject) => {
    setMediaPickerOpen(false);

    if (hasAttachedFileRef.current) {
      await runAction(() => onReplaceMediaRef.current(media));
      return;
    }

    await runAction(() => onAttachMediaRef.current(media));
  }, []);

  const controlsDisabled = disabled || actionPending;

  const filePickerDialogs = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(event) => void handleFileInputChange(event)}
      />
      <MediaObjectPickerDialog
        open={mediaPickerOpen}
        title="Select file from media"
        selectLabel="Add file"
        disabled={controlsDisabled}
        multiSelect={false}
        overlayZIndexClass={mediaPickerZIndexClass}
        onSelect={(media) => void handleMediaSelected(media)}
        onClose={() => setMediaPickerOpen(false)}
      />
    </>
  );

  return {
    actionPending,
    actionError,
    controlsDisabled,
    openUploadFromDevice,
    openUploadFromMedia,
    filePickerDialogs: portalDialogs
      ? createPortal(filePickerDialogs, document.body)
      : filePickerDialogs,
  };
}
