// keel_web/src/modules/coak/components/tabs/tags/CoakTagsTab.tsx

import { useEffect } from "react";

import { IconPlusButton } from "../../../../../components/buttons/IconPlusButton";
import { useCoakRecordWorkspace } from "../../../context/CoakRecordWorkspaceContext";
import { useCoakTagCatalog } from "../../../hooks/useCoakTagCatalog";
import { CoakTagsListView } from "../../tags/CoakTagsListView";

function CoakTagsSearchBar({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="search"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search tags…"
      className="w-full max-w-sm rounded-lg border border-stone-800 bg-stone-950/60 px-3 py-2 text-sm text-stone-200 placeholder:text-stone-600 focus:border-stone-600 focus:outline-none disabled:opacity-50"
      aria-label="Search tags"
    />
  );
}

export function CoakTagsTab() {
  const { recordId } = useCoakRecordWorkspace();
  const {
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
  } = useCoakTagCatalog(recordId);

  useEffect(() => {
    if (!draftTag) {
      return;
    }
    draftInputRef.current?.focus();
  }, [draftTag, draftInputRef]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-stone-900/95">
      <div className="shrink-0 space-y-4 border-b border-stone-800/80 px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-stone-100">Tags</h2>
            <p className="mt-1 text-sm text-stone-500">
              Colored labels you can assign to nodes in this record.
            </p>
            <CoakTagsSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              disabled={pending}
            />
          </div>
          <IconPlusButton
            onClick={startDraftTag}
            ariaLabel="New coak tag"
            disabled={pending || draftTag !== null}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {tagsQuery.isLoading ? (
          <p className="text-sm text-stone-500">Loading tags…</p>
        ) : null}
        {tagsQuery.isError ? (
          <p className="text-sm text-red-400">Failed to load tags.</p>
        ) : null}
        {errorMessage ? <p className="mb-4 text-sm text-red-400">{errorMessage}</p> : null}

        {tagsQuery.data ? (
          <CoakTagsListView
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
            onDescriptionChange={(tagId, description) =>
              updateMutation.mutate({ tagId, description })
            }
            onColorChange={(tagId, colorHex) => updateMutation.mutate({ tagId, colorHex })}
            onDelete={(tagId) => deleteMutation.mutate(tagId)}
            rowDisabled={pending}
            deleteDisabled={pending}
            emptyMessage={emptyMessage}
            paginationResetKey={`${searchQuery}:${filteredTags.length}`}
          />
        ) : null}
      </div>
    </div>
  );
}
