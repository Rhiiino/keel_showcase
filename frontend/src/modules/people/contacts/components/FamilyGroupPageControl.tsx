// stack_sandbox/frontend_web/src/modules/contacts/components/FamilyGroupPageControl.tsx

// Prev/next navigation between family group detail pages.

import { Link } from "react-router-dom";

import type { FamilyGroup } from "../api";

type FamilyGroupPageControlProps = {
  groups: FamilyGroup[];
  currentFamilyKey: string;
  className?: string;
};

function sortGroups(groups: FamilyGroup[]): FamilyGroup[] {
  return [...groups].sort(
    (left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id),
  );
}

function navButtonClass(enabled: boolean): string {
  return [
    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition",
    enabled
      ? "bg-white/[0.06] text-stone-200 ring-1 ring-white/[0.1] hover:bg-white/[0.1] hover:text-stone-50"
      : "cursor-not-allowed bg-white/[0.03] text-stone-600 ring-1 ring-white/[0.05]",
  ].join(" ");
}

export function FamilyGroupPageControl({
  groups,
  currentFamilyKey,
  className = "",
}: FamilyGroupPageControlProps) {
  const orderedGroups = sortGroups(groups);
  const currentIndex = orderedGroups.findIndex((group) => group.id === currentFamilyKey);
  const total = orderedGroups.length;

  if (total <= 1 || currentIndex < 0) {
    return null;
  }

  const currentPage = currentIndex + 1;
  const previousGroup = orderedGroups[currentIndex - 1] ?? null;
  const nextGroup = orderedGroups[currentIndex + 1] ?? null;

  return (
    <nav
      className={["flex items-center gap-3", className].join(" ")}
      aria-label="Family group page navigation"
    >
      {previousGroup ? (
        <Link
          to={`/people/contacts/family-groups/${encodeURIComponent(previousGroup.id)}`}
          className={navButtonClass(true)}
          aria-label={`Previous family group: ${previousGroup.name}`}
        >
          ←
        </Link>
      ) : (
        <span className={navButtonClass(false)} aria-hidden="true">
          ←
        </span>
      )}

      <span className="min-w-14 text-center text-sm font-medium tabular-nums text-stone-400">
        {currentPage} / {total}
      </span>

      {nextGroup ? (
        <Link
          to={`/people/contacts/family-groups/${encodeURIComponent(nextGroup.id)}`}
          className={navButtonClass(true)}
          aria-label={`Next family group: ${nextGroup.name}`}
        >
          →
        </Link>
      ) : (
        <span className={navButtonClass(false)} aria-hidden="true">
          →
        </span>
      )}
    </nav>
  );
}
