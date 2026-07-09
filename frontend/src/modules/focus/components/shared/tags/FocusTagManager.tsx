// src/modules/focus/components/shared/tags/FocusTagManager.tsx

// Modal for creating, editing, and deleting focus tags.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  createFocusTag,
  deleteFocusTag,
  fetchFocusTags,
  focusQueryKeys,
  updateFocusTag,
  type FocusTag,
} from "../../../api";
import { DEFAULT_FOCUS_TAG_COLOR } from "../../../lib/focus";
import type { FocusConstellationModalOrigin } from "../../../lib/constellation/modalOrigin";
import { FocusConstellationNodeOriginModal } from "../../constellation/modals";
import { TrashIcon } from "../icons";

type TagDraft = {
  name: string;
  colorHex: string;
};

type FocusTagManagerProps = {
  open: boolean;
  onClose: () => void;
  origin?: FocusConstellationModalOrigin | null;
};

function draftFromTag(tag: FocusTag): TagDraft {
  return {
    name: tag.name,
    colorHex: tag.color_hex,
  };
}

function isTagDraftDirty(tag: FocusTag, draft: TagDraft): boolean {
  return (
    draft.name.trim() !== tag.name ||
    draft.colorHex.toUpperCase() !== tag.color_hex.toUpperCase()
  );
}

export function FocusTagManager({ open, onClose, origin = null }: FocusTagManagerProps) {
  const queryClient = useQueryClient();
  const [draftsById, setDraftsById] = useState<Record<number, TagDraft>>({});
  const [newTagDraft, setNewTagDraft] = useState<TagDraft>({
    name: "",
    colorHex: DEFAULT_FOCUS_TAG_COLOR,
  });
  const [actionError, setActionError] = useState<string | null>(null);

  const tagsQuery = useQuery({
    queryKey: focusQueryKeys.tags(),
    queryFn: fetchFocusTags,
    enabled: open,
  });

  const tags = tagsQuery.data ?? [];

  useEffect(() => {
    if (!tagsQuery.data) {
      return;
    }
    setDraftsById(
      Object.fromEntries(tagsQuery.data.map((tag) => [tag.id, draftFromTag(tag)])),
    );
  }, [tagsQuery.data]);

  const dirtyTags = useMemo(
    () =>
      tags.filter((tag) => {
        const draft = draftsById[tag.id] ?? draftFromTag(tag);
        return isTagDraftDirty(tag, draft);
      }),
    [draftsById, tags],
  );

  const hasDirtyEdits = dirtyTags.length > 0;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: focusQueryKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createFocusTag({
        name: newTagDraft.name.trim(),
        color_hex: newTagDraft.colorHex,
      }),
    onSuccess: () => {
      setNewTagDraft({ name: "", colorHex: DEFAULT_FOCUS_TAG_COLOR });
      setActionError(null);
      invalidate();
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const saveAllMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        dirtyTags.map((tag) => {
          const draft = draftsById[tag.id] ?? draftFromTag(tag);
          return updateFocusTag(tag.id, {
            name: draft.name.trim(),
            color_hex: draft.colorHex,
          });
        }),
      );
    },
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (tagId: number) => deleteFocusTag(tagId),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const pending =
    createMutation.isPending || saveAllMutation.isPending || deleteMutation.isPending;

  return (
    <FocusConstellationNodeOriginModal
      open={open}
      origin={origin}
      ariaLabel="Focus tags"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white/90">Focus tags</h2>
          <div className="flex items-center gap-2">
            {hasDirtyEdits ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => saveAllMutation.mutate()}
                className="rounded-lg bg-white/12 px-3 py-1.5 text-sm text-white/90 hover:bg-white/18 disabled:opacity-40"
              >
                Save
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-white/50 hover:bg-white/8 hover:text-white/80"
            >
              Close
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {tags.map((tag) => {
            const draft = draftsById[tag.id] ?? draftFromTag(tag);
            return (
              <div
                key={tag.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-3"
              >
                <input
                  type="text"
                  value={draft.name}
                  disabled={pending}
                  onChange={(event) =>
                    setDraftsById((current) => ({
                      ...current,
                      [tag.id]: { ...draft, name: event.target.value },
                    }))
                  }
                  className="min-w-[8rem] flex-1 rounded-lg border border-white/10 bg-transparent px-2 py-1 text-sm text-white/90"
                />
                <input
                  type="color"
                  value={draft.colorHex}
                  disabled={pending}
                  onChange={(event) =>
                    setDraftsById((current) => ({
                      ...current,
                      [tag.id]: { ...draft, colorHex: event.target.value },
                    }))
                  }
                  className="h-8 w-10 cursor-pointer rounded border border-white/10 bg-transparent"
                  aria-label={`Color for ${tag.name}`}
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm(`Delete tag "${tag.name}"?`)) {
                      deleteMutation.mutate(tag.id);
                    }
                  }}
                  aria-label={`Delete tag ${tag.name}`}
                  className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-950/40 hover:text-red-300 disabled:opacity-40"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        <form
          className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/8 pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <input
            type="text"
            value={newTagDraft.name}
            disabled={pending}
            onChange={(event) =>
              setNewTagDraft((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="New tag name"
            className="min-w-[8rem] flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90"
          />
          <input
            type="color"
            value={newTagDraft.colorHex}
            disabled={pending}
            onChange={(event) =>
              setNewTagDraft((current) => ({ ...current, colorHex: event.target.value }))
            }
            className="h-9 w-11 cursor-pointer rounded border border-white/10 bg-transparent"
            aria-label="New tag color"
          />
          <button
            type="submit"
            disabled={pending || !newTagDraft.name.trim()}
            className="rounded-lg bg-white/12 px-4 py-2 text-sm text-white/90 hover:bg-white/18 disabled:opacity-40"
          >
            Add tag
          </button>
        </form>

        {actionError ? <p className="mt-3 text-sm text-rose-300">{actionError}</p> : null}
    </FocusConstellationNodeOriginModal>
  );
}
