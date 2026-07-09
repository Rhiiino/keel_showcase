// keel_web/src/modules/finance/pages/FinanceObligationTagsPage.tsx

import { useEffect } from "react";

import { IconPlusButton } from "../../../components/buttons/IconPlusButton";
import { ListSearch } from "../../../components/ListSearch";
import { ListPageLayout } from "../../../views/list/ListPageLayout";
import { FinanceObligationTagsListView } from "../components/tags/FinanceObligationTagsListView";
import { useFinanceObligationTagCatalog } from "../hooks/useFinanceObligationTagCatalog";

export function FinanceObligationTagsPage() {
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
  } = useFinanceObligationTagCatalog();

  useEffect(() => {
    if (!draftTag) {
      return;
    }
    draftInputRef.current?.focus();
  }, [draftTag, draftInputRef]);

  return (
    <ListPageLayout
      title="Obligation tags"
      recordCount={tagsQuery.data?.length}
      subtitle="Colored labels you can assign to subscriptions and recurring bills."
      actions={
        <IconPlusButton
          onClick={startDraftTag}
          ariaLabel="New obligation tag"
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
        <FinanceObligationTagsListView
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
