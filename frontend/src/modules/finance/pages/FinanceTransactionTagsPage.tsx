// keel_web/src/modules/finance/pages/FinanceTransactionTagsPage.tsx

import { useEffect } from "react";

import { IconPlusButton } from "../../../components/buttons/IconPlusButton";
import { ListSearch } from "../../../components/ListSearch";
import { ListPageLayout } from "../../../views/list/ListPageLayout";
import { FinanceTransactionTagsListView } from "../components/tags/FinanceTransactionTagsListView";
import { useFinanceTransactionTagCatalog } from "../hooks/useFinanceTransactionTagCatalog";

export function FinanceTransactionTagsPage() {
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
  } = useFinanceTransactionTagCatalog();

  useEffect(() => {
    if (!draftTag) {
      return;
    }
    draftInputRef.current?.focus();
  }, [draftTag, draftInputRef]);

  return (
    <ListPageLayout
      title="Transaction tags"
      recordCount={tagsQuery.data?.length}
      subtitle="Colored labels you can assign to transactions."
      actions={
        <IconPlusButton
          onClick={startDraftTag}
          ariaLabel="New transaction tag"
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
        <FinanceTransactionTagsListView
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
