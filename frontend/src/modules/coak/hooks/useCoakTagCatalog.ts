// keel_web/src/modules/coak/hooks/useCoakTagCatalog.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";

import { ApiError } from "../../../lib/api";
import {
  coakQueryKeys,
  createCoakTag,
  deleteCoakTag,
  fetchCoakTags,
  updateCoakTag,
} from "../api";
import { DEFAULT_COAK_TAG_COLOR } from "../lib/coakTagDisplay";
import { filterCoakTags, sortCoakTags } from "../lib/coakTagSearch";

export function useCoakTagCatalog(recordId: number) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [draftTag, setDraftTag] = useState<{ name: string; colorHex: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);

  const tagsQuery = useQuery({
    queryKey: coakQueryKeys.tags(recordId),
    queryFn: () => fetchCoakTags(recordId),
  });

  const filteredTags = useMemo(() => {
    const sorted = sortCoakTags(tagsQuery.data ?? []);
    return filterCoakTags(sorted, searchQuery);
  }, [tagsQuery.data, searchQuery]);

  const isSearchActive = searchQuery.trim().length > 0;
  const emptyMessage =
    isSearchActive && filteredTags.length === 0
      ? "No tags match your search."
      : "No tags yet.";

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: coakQueryKeys.tags(recordId) });
    void queryClient.invalidateQueries({ queryKey: coakQueryKeys.items(recordId) });
  };

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; colorHex: string }) =>
      createCoakTag(recordId, {
        name: payload.name.trim(),
        color_hex: payload.colorHex,
      }),
    onSuccess: () => {
      setDraftTag(null);
      setActionError(null);
      invalidate();
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      tagId,
      name,
      description,
      colorHex,
    }: {
      tagId: number;
      name?: string;
      description?: string | null;
      colorHex?: string;
    }) =>
      updateCoakTag(recordId, tagId, {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(colorHex !== undefined ? { color_hex: colorHex } : {}),
      }),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (tagId: number) => deleteCoakTag(recordId, tagId),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const startDraftTag = () => {
    setActionError(null);
    setDraftTag({ name: "", colorHex: DEFAULT_COAK_TAG_COLOR });
  };

  const handleDraftCommit = () => {
    const trimmed = draftTag?.name.trim() ?? "";
    if (!trimmed) {
      setDraftTag(null);
      return;
    }
    createMutation.mutate({ name: trimmed, colorHex: draftTag?.colorHex ?? DEFAULT_COAK_TAG_COLOR });
  };

  const pending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const errorMessage =
    actionError ??
    (tagsQuery.error instanceof ApiError ? tagsQuery.error.message : null);

  return {
    searchQuery,
    setSearchQuery,
    draftTag,
    setDraftTag,
    draftInputRef,
    tagsQuery,
    filteredTags,
    emptyMessage,
    pending,
    errorMessage,
    handleDraftCommit,
    startDraftTag,
    updateMutation,
    deleteMutation,
  };
}
