// keel_web/src/modules/contacts/pages/FamilyGroupDetailPage.tsx

// Family group detail with tree visualization.

import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { useRecordNotFoundRedirect } from "../../../../hooks/useRecordNotFoundRedirect";
import {
  contactsQueryKeys,
  fetchFamilyGroup,
  fetchFamilyGroups,
  fetchFamilyTree,
} from "../api";
import { FamilyGroupPageControl } from "../components/FamilyGroupPageControl";
import { FamilyTreeView } from "../components/FamilyTreeView";

export function FamilyGroupDetailPage() {
  const { familyKey } = useParams();
  const resolvedFamilyKey = familyKey?.trim() ?? "";
  const invalidFamilyKey = resolvedFamilyKey.length === 0;

  const groupsQuery = useQuery({
    queryKey: contactsQueryKeys.familyGroups(),
    queryFn: () => fetchFamilyGroups(),
  });

  const groupQuery = useQuery({
    queryKey: contactsQueryKeys.familyGroup(resolvedFamilyKey),
    queryFn: () => fetchFamilyGroup(resolvedFamilyKey),
    enabled: !invalidFamilyKey,
  });

  const treeQuery = useQuery({
    queryKey: contactsQueryKeys.familyTree(resolvedFamilyKey),
    queryFn: () => fetchFamilyTree(resolvedFamilyKey),
    enabled: !invalidFamilyKey && Boolean(groupQuery.data),
  });

  const redirecting = useRecordNotFoundRedirect({
    invalidId: invalidFamilyKey,
    isLoading: groupQuery.isLoading,
    error: groupQuery.error,
    isFetched: groupQuery.isFetched,
    hasData: Boolean(groupQuery.data),
    listPath: "/people/contacts/family-groups",
    notice: "That family group could not be found.",
  });

  if (redirecting || groupQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <p className="mt-8 text-sm text-stone-500">Loading group…</p>
      </div>
    );
  }

  if (!groupQuery.data) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/people/contacts/family-groups"
          className="text-sm text-stone-500 transition hover:text-stone-300"
        >
          ← Back to groups
        </Link>

        {groupsQuery.data && (
          <FamilyGroupPageControl
            groups={groupsQuery.data}
            currentFamilyKey={resolvedFamilyKey}
          />
        )}
      </div>

      <header className="mt-4">
        <h1 className="text-2xl font-semibold text-stone-50">{groupQuery.data.name}</h1>
      </header>

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-stone-500">
          Tree
        </h2>
        {treeQuery.isLoading && (
          <p className="mt-3 text-sm text-stone-500">Loading tree…</p>
        )}
        {treeQuery.isError && (
          <p className="mt-3 text-sm text-red-400">Failed to load tree.</p>
        )}
        {treeQuery.data && (
          <div className="mt-4">
            <FamilyTreeView
              tree={treeQuery.data}
              contactBackLink={{
                to: `/people/contacts/family-groups/${encodeURIComponent(resolvedFamilyKey)}`,
                label: "Back to group",
              }}
            />
          </div>
        )}
      </section>
    </div>
  );
}
