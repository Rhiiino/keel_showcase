// keel_web/src/hooks/useRecordNotFoundRedirect.ts

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { isNotFound } from "../lib/apiErrors";

export type RecordNotFoundRedirectState = {
  notice: string;
};

type UseRecordNotFoundRedirectOptions = {
  /** When true, redirect immediately (e.g. invalid route param). */
  invalidId?: boolean;
  isLoading?: boolean;
  error?: unknown;
  /** Also treat a settled fetch with no data as not found. */
  isFetched?: boolean;
  hasData?: boolean;
  listPath: string;
  notice: string;
};

export function useRecordNotFoundRedirect({
  invalidId = false,
  isLoading = false,
  error,
  isFetched = false,
  hasData = true,
  listPath,
  notice,
}: UseRecordNotFoundRedirectOptions): boolean {
  const navigate = useNavigate();

  const shouldRedirect =
    invalidId ||
    isNotFound(error) ||
    (!isLoading && isFetched && !hasData);

  useEffect(() => {
    if (!shouldRedirect) {
      return;
    }

    navigate(listPath, {
      replace: true,
      state: { notice } satisfies RecordNotFoundRedirectState,
    });
  }, [listPath, navigate, notice, shouldRedirect]);

  return shouldRedirect;
}

type EditorRecordAccess = {
  invalidRecordId?: boolean;
  fetchError?: unknown;
  isRecordFetched?: boolean;
  hasRecordData?: boolean;
  isFetchLoading?: boolean;
};

export function useEditorRecordNotFoundRedirect(
  editor: EditorRecordAccess,
  options: Pick<UseRecordNotFoundRedirectOptions, "listPath" | "notice">,
): boolean {
  return useRecordNotFoundRedirect({
    invalidId: editor.invalidRecordId,
    isLoading: editor.isFetchLoading,
    error: editor.fetchError,
    isFetched: editor.isRecordFetched,
    hasData: editor.hasRecordData,
    ...options,
  });
}
