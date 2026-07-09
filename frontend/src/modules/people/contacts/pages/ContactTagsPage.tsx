// keel_web/src/modules/contacts/pages/ContactTagsPage.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { IconPlusButton } from "../../../../components/buttons/IconPlusButton";
import { ListPageLayout } from "../../../../views/list/ListPageLayout";
import { ApiError } from "../../../../lib/api";
import { ListSearch } from "../../../../components/ListSearch";
import { ContactTagsListView } from "../components/tags/ContactTagsListView";
import {
  contactsQueryKeys,
  createContactTag,
  deleteContactTag,
  fetchContactTags,
  updateContactTag,
} from "../api";
import { DEFAULT_CONTACT_TAG_COLOR } from "../lib/contactTagDisplay";
import { filterContactTags, sortContactTags } from "../lib/contactTagSearch";

export function ContactTagsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [draftTag, setDraftTag] = useState<{ name: string; colorHex: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);

  const tagsQuery = useQuery({
    queryKey: contactsQueryKeys.tags(),
    queryFn: fetchContactTags,
  });

  const filteredTags = useMemo(() => {
    const sorted = sortContactTags(tagsQuery.data ?? []);
    return filterContactTags(sorted, searchQuery);
  }, [tagsQuery.data, searchQuery]);

  const isSearchActive = searchQuery.trim().length > 0;
  const emptyMessage =
    isSearchActive && filteredTags.length === 0
      ? "No tags match your search."
      : "No tags yet.";

  useEffect(() => {
    if (!draftTag) {
      return;
    }
    draftInputRef.current?.focus();
  }, [draftTag]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: contactsQueryKeys.tags() });
    void queryClient.invalidateQueries({ queryKey: contactsQueryKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; colorHex: string }) =>
      createContactTag({
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
      colorHex,
    }: {
      tagId: number;
      name?: string;
      colorHex?: string;
    }) =>
      updateContactTag(tagId, {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(colorHex !== undefined ? { color_hex: colorHex } : {}),
      }),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (tagId: number) => deleteContactTag(tagId),
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
        : "Contact tag action failed."
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

  return (
    <ListPageLayout
      title="Tags"
      recordCount={tagsQuery.data?.length}
      subtitle="Colored labels you can assign to contacts."
      actions={
        <IconPlusButton
          onClick={() =>
            setDraftTag({
              name: "",
              colorHex: DEFAULT_CONTACT_TAG_COLOR,
            })
          }
          ariaLabel="New contact tag"
          disabled={pending || draftTag !== null}
        />
      }
    >
      <ListSearch
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search tags…"
        className="mb-6"
      />

      {tagsQuery.isLoading ? (
        <p className="text-sm text-stone-500">Loading tags…</p>
      ) : null}
      {tagsQuery.isError ? (
        <p className="text-sm text-red-400">Failed to load tags.</p>
      ) : null}
      {errorMessage ? <p className="mb-4 text-sm text-red-400">{errorMessage}</p> : null}

      {tagsQuery.data ? (
        <ContactTagsListView
            tags={filteredTags}
            draftTag={draftTag}
            draftInputRef={draftInputRef}
            onDraftNameChange={(name) =>
              setDraftTag((current) => (current ? { ...current, name } : current))
            }
            onDraftColorChange={(colorHex) =>
              setDraftTag((current) => (current ? { ...current, colorHex } : current))
            }
            onDraftCommit={handleDraftCommit}
            onDraftCancel={() => setDraftTag(null)}
            onRename={(tagId, name) => updateMutation.mutate({ tagId, name })}
            onColorChange={(tagId, colorHex) =>
              updateMutation.mutate({ tagId, colorHex })
            }
            onDelete={(tagId) => deleteMutation.mutate(tagId)}
            rowDisabled={pending}
            deleteDisabled={pending}
            emptyMessage={emptyMessage}
            paginationResetKey={searchQuery}
        />
      ) : null}
    </ListPageLayout>
  );
}
