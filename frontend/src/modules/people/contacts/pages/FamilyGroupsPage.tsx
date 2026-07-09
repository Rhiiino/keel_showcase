// keel_web/src/modules/contacts/pages/FamilyGroupsPage.tsx

// Family groups list.

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { ListPageTitle } from "../../../../views/list/primitives/ListPageTitle";
import { RouteNoticeBanner } from "../../../../components/RouteNoticeBanner";
import { contactsQueryKeys, fetchFamilyGroups } from "../api";

export function FamilyGroupsPage() {
  const groupsQuery = useQuery({
    queryKey: contactsQueryKeys.familyGroups(),
    queryFn: () => fetchFamilyGroups(),
  });

  return (
    <div className="mx-auto w-full">
      <header>
        <ListPageTitle
          title="Groups"
          recordCount={groupsQuery.data?.length}
        />
        <p className="mt-1 text-sm text-stone-500">
          Computed immediate families — each father, mother, and their shared children.
        </p>
      </header>

      <RouteNoticeBanner />

      {groupsQuery.isLoading && (
        <p className="mt-12 text-sm text-stone-500">Loading family groups…</p>
      )}
      {groupsQuery.isError && (
        <p className="mt-12 text-sm text-red-400">Failed to load family groups.</p>
      )}

      <ul className="mt-8 space-y-3">
        {(groupsQuery.data ?? []).map((group) => (
          <li key={group.id}>
            <Link
              to={`/people/contacts/family-groups/${encodeURIComponent(group.id)}`}
              className="block rounded-xl border border-stone-800/80 bg-stone-950/40 px-4 py-3 transition hover:border-stone-600"
            >
              <p className="font-medium text-stone-100">{group.name}</p>
              <p className="mt-2 text-xs text-stone-500">
                {group.member_count} member{group.member_count === 1 ? "" : "s"}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {groupsQuery.data?.length === 0 && !groupsQuery.isLoading && (
        <p className="mt-12 text-center text-sm text-stone-500">No family groups yet.</p>
      )}
    </div>
  );
}
