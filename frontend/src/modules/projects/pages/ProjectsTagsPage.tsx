// keel_web/src/modules/projects/pages/ProjectsTagsPage.tsx

import { useEffect } from "react";

import { IconPlusButton } from "../../../components/buttons/IconPlusButton";
import { ListPageLayout } from "../../../views/list/ListPageLayout";
import { ListSearch } from "../../../components/ListSearch";
import { ProjectTagsListView } from "../components/tags/ProjectTagsListView";
import { useProjectTagCatalog } from "../hooks/useProjectTagCatalog";

export function ProjectsTagsPage() {
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
  } = useProjectTagCatalog();

  useEffect(() => {
    if (!draftTag) {
      return;
    }
    draftInputRef.current?.focus();
  }, [draftTag, draftInputRef]);

  return (
    <ListPageLayout
      title="Tags"
      recordCount={tagsQuery.data?.length}
      subtitle="Colored labels you can assign to projects."
      actions={
        <IconPlusButton
          onClick={startDraftTag}
          ariaLabel="New project tag"
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
        <ProjectTagsListView
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
