// keel_web/src/modules/shop/hooks/useFinanceTransactionTagCatalog.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";

import { ApiError } from "../../../lib/api";
import {
  createFinanceTransactionTag,
  deleteFinanceTransactionTag,
  fetchFinanceTransactionTags,
  financeQueryKeys,
  updateFinanceTransactionTag,
} from "../api";
import { DEFAULT_FINANCE_TRANSACTION_TAG_COLOR } from "../lib/transactionTagDisplay";
import { filterFinanceTransactionTags, sortFinanceTransactionTags } from "../lib/transactionTagSearch";

export function useFinanceTransactionTagCatalog() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [draftTag, setDraftTag] = useState<{ name: string; colorHex: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);

  const tagsQuery = useQuery({
    queryKey: financeQueryKeys.transactionTags(),
    queryFn: fetchFinanceTransactionTags,
  });

  const filteredTags = useMemo(() => {
    const sorted = sortFinanceTransactionTags(tagsQuery.data ?? []);
    return filterFinanceTransactionTags(sorted, searchQuery);
  }, [tagsQuery.data, searchQuery]);

  const isSearchActive = searchQuery.trim().length > 0;
  const emptyMessage =
    isSearchActive && filteredTags.length === 0
      ? "No tags match your search."
      : "No tags yet.";

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: financeQueryKeys.transactionTags() });
    void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; colorHex: string }) =>
      createFinanceTransactionTag({
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
      updateFinanceTransactionTag(tagId, {
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
    mutationFn: (tagId: number) => deleteFinanceTransactionTag(tagId),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const pending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const mutationError =
    createMutation.error ?? updateMutation.error ?? deleteMutation.error;

  const errorMessage = mutationError
    ? mutationError instanceof ApiError
      ? mutationError.message
      : mutationError instanceof Error
        ? mutationError.message
        : "Transaction tag action failed."
    : actionError;

  const handleDraftCommit = () => {
    if (!draftTag) {
      return;
    }
    const trimmed = draftTag.name.trim();
    if (!trimmed) {
      setDraftTag(null);
      return;
    }
    createMutation.mutate({
      name: trimmed,
      colorHex: draftTag.colorHex,
    });
  };

  const startDraftTag = () => {
    setDraftTag({
      name: "",
      colorHex: DEFAULT_FINANCE_TRANSACTION_TAG_COLOR,
    });
  };

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
