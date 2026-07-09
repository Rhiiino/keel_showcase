// keel_web/src/modules/contacts/pages/FamilyTreePage.tsx

// Multi-group family tree view.

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";

import {
  contactsQueryKeys,
  fetchContact,
  fetchFamilyGroups,
  fetchMergedFamilyTrees,
  formatContactName,
} from "../api";
import {
  FamilyTreeModeSelect,
  FamilyTreeView,
  type FamilyTreeInteractionMode,
} from "../components/FamilyTreeView";
import {
  filterFamilyTreeToLineage,
  resolveLineageFamilyKeys,
} from "../lib/familyTreeLineage";

const SELECTED_FAMILY_GROUPS_STORAGE_KEY = "keel.contacts.familyTree.selectedFamilyKeys";

function readStoredSelectedFamilyKeys(): string[] {
  try {
    const rawValue = window.localStorage.getItem(SELECTED_FAMILY_GROUPS_STORAGE_KEY);
    const parsedValue: unknown = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsedValue)
      ? parsedValue.filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];
  } catch {
    return [];
  }
}

function parseLineageContactId(rawValue: string | null): number | null {
  if (!rawValue) {
    return null;
  }
  const parsedId = Number(rawValue);
  return Number.isFinite(parsedId) ? parsedId : null;
}

export function FamilyTreePage() {
  const [searchParams] = useSearchParams();
  const lineageContactId = parseLineageContactId(searchParams.get("contactId"));
  const [selectedFamilyKeys, setSelectedFamilyKeys] = useState<string[]>(
    readStoredSelectedFamilyKeys,
  );
  const [interactionMode, setInteractionMode] = useState<FamilyTreeInteractionMode>("view");

  useEffect(() => {
    window.localStorage.setItem(
      SELECTED_FAMILY_GROUPS_STORAGE_KEY,
      JSON.stringify(selectedFamilyKeys),
    );
  }, [selectedFamilyKeys]);

  const groupsQuery = useQuery({
    queryKey: contactsQueryKeys.familyGroups(),
    queryFn: () => fetchFamilyGroups(),
  });

  const lineageContactQuery = useQuery({
    queryKey: contactsQueryKeys.detail(lineageContactId ?? 0),
    queryFn: () => fetchContact(lineageContactId!),
    enabled: lineageContactId !== null,
  });

  const lineageFamilyKeysQuery = useQuery({
    queryKey: contactsQueryKeys.lineageFamilyKeys(lineageContactId ?? 0),
    queryFn: () => resolveLineageFamilyKeys(lineageContactId!, groupsQuery.data!),
    enabled: lineageContactId !== null && groupsQuery.isSuccess,
  });

  useEffect(() => {
    if (!lineageFamilyKeysQuery.data) {
      return;
    }
    setSelectedFamilyKeys(lineageFamilyKeysQuery.data);
  }, [lineageFamilyKeysQuery.data]);

  const validSelectedFamilyKeys = useMemo(() => {
    if (!groupsQuery.data) {
      return [];
    }
    const validIds = new Set(groupsQuery.data.map((group) => group.id));
    return selectedFamilyKeys.filter((familyKey) => validIds.has(familyKey));
  }, [groupsQuery.data, selectedFamilyKeys]);

  useEffect(() => {
    if (!groupsQuery.data || lineageContactId !== null) {
      return;
    }
    const validIds = new Set(groupsQuery.data.map((group) => group.id));
    const filteredKeys = selectedFamilyKeys.filter((familyKey) => validIds.has(familyKey));
    if (filteredKeys.length !== selectedFamilyKeys.length) {
      setSelectedFamilyKeys(filteredKeys);
    }
  }, [groupsQuery.data, lineageContactId, selectedFamilyKeys]);

  const mergedTreesQuery = useQuery({
    queryKey: contactsQueryKeys.mergedFamilyTree(validSelectedFamilyKeys),
    queryFn: () => fetchMergedFamilyTrees(validSelectedFamilyKeys),
    enabled: groupsQuery.isSuccess && validSelectedFamilyKeys.length > 0,
  });

  const displayTrees = useMemo(() => {
    if (!mergedTreesQuery.data) {
      return [];
    }
    if (lineageContactId === null) {
      return mergedTreesQuery.data;
    }
    return mergedTreesQuery.data
      .map((tree) => filterFamilyTreeToLineage(tree, lineageContactId))
      .filter((tree) => tree.nodes.some((node) => node.contact.id === lineageContactId));
  }, [lineageContactId, mergedTreesQuery.data]);

  function toggleGroup(familyKey: string) {
    setSelectedFamilyKeys((current) =>
      current.includes(familyKey)
        ? current.filter((id) => id !== familyKey)
        : [...current, familyKey],
    );
  }

  const contactBackLink = lineageContactId
    ? {
        to: `/people/contacts/${lineageContactId}`,
        label: "Back to contact",
      }
    : {
        to: "/people/contacts/family-tree",
        label: "Back to tree",
      };

  return (
    <div className="mx-auto w-full">
      <header>
        <h1 className="text-2xl font-semibold text-stone-50">Tree</h1>
        {lineageContactId && lineageContactQuery.data ? (
          <p className="mt-1 text-sm text-stone-500">
            Showing lineage for{" "}
            <Link
              to={`/people/contacts/${lineageContactId}`}
              className="text-stone-300 transition hover:text-stone-100"
            >
              {formatContactName(lineageContactQuery.data)}
            </Link>
            . Descendants are hidden.
          </p>
        ) : (
          <p className="mt-1 text-sm text-stone-500">
            Select one or more immediate families to visualize spouse and parent-child relationships.
          </p>
        )}
      </header>

      <section className="mt-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-stone-500">
          Family groups
        </h2>

        {groupsQuery.isLoading && (
          <p className="mt-3 text-sm text-stone-500">Loading family groups…</p>
        )}
        {groupsQuery.isError && (
          <p className="mt-3 text-sm text-red-400">Failed to load family groups.</p>
        )}

        {groupsQuery.data && groupsQuery.data.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {groupsQuery.data.map((group) => {
              const isSelected = selectedFamilyKeys.includes(group.id);
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    isSelected
                      ? "bg-app-accent text-app-accent-on ring-1 ring-app-accent/40"
                      : "bg-white/[0.06] text-stone-200 ring-1 ring-white/[0.10] hover:bg-white/[0.1]",
                  ].join(" ")}
                  aria-pressed={isSelected}
                >
                  {group.name}
                </button>
              );
            })}
          </div>
        )}

        {validSelectedFamilyKeys.length > 0 && (
          <div className="mt-4">
            <FamilyTreeModeSelect
              value={interactionMode}
              onChange={setInteractionMode}
            />
          </div>
        )}
      </section>

      <section className="mt-8 space-y-8">
        {lineageContactId && lineageFamilyKeysQuery.isLoading && (
          <p className="text-sm text-stone-500">Resolving lineage families…</p>
        )}
        {lineageContactId
          && lineageFamilyKeysQuery.isSuccess
          && lineageFamilyKeysQuery.data.length === 0 && (
          <p className="text-sm text-stone-500">
            No family groups found for this contact&apos;s lineage.
          </p>
        )}
        {groupsQuery.isSuccess && validSelectedFamilyKeys.length === 0 && !lineageContactId && (
          <p className="text-sm text-stone-500">Select at least one family group.</p>
        )}
        {mergedTreesQuery.isLoading && (
          <p className="text-sm text-stone-500">Loading tree…</p>
        )}
        {mergedTreesQuery.isError && (
          <p className="text-sm text-red-400">Failed to load family trees.</p>
        )}
        {lineageContactId
          && mergedTreesQuery.isSuccess
          && displayTrees.length === 0
          && validSelectedFamilyKeys.length > 0 && (
          <p className="text-sm text-stone-500">
            This contact is not in the selected family trees.
          </p>
        )}
        {displayTrees.map((tree) => (
          <FamilyTreeView
            key={tree.group_id}
            tree={tree}
            interactionMode={interactionMode}
            showModeSelector={false}
            lineageFocusContactId={lineageContactId}
            contactBackLink={contactBackLink}
          />
        ))}
      </section>
    </div>
  );
}
