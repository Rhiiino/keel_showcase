// stack_sandbox/frontend_web/src/modules/contacts/components/ContactFamilyGroupPills.tsx

// Family group pills for contact list and detail views.

import { Link } from "react-router-dom";

import type { ContactFamilyGroup } from "../api";

type ContactFamilyGroupPillsProps = {
  groups: ContactFamilyGroup[];
  emptyLabel?: string;
  linkToGroup?: boolean;
  size?: "sm" | "lg";
  className?: string;
};

export function ContactFamilyGroupPills({
  groups,
  emptyLabel = "No family group",
  linkToGroup = false,
  size = "sm",
  className = "",
}: ContactFamilyGroupPillsProps) {
  const isLarge = size === "lg";

  if (groups.length === 0) {
    return (
      <span className={[isLarge ? "text-sm" : "text-xs", "text-stone-500", className].join(" ")}>
        {emptyLabel}
      </span>
    );
  }

  return (
    <div className={["flex flex-wrap", isLarge ? "gap-2" : "gap-1.5", className].join(" ")}>
      {groups.map((group) => {
        const pill = (
          <span
            key={group.id}
            className={[
              "inline-flex items-center rounded-full font-medium",
              isLarge ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-0.5 text-[11px]",
              "bg-violet-400/12 text-violet-200 ring-1 ring-violet-400/25",
              linkToGroup ? "transition hover:bg-violet-400/20 hover:text-violet-100" : "",
            ].join(" ")}
          >
            {group.name}
          </span>
        );

        if (!linkToGroup) {
          return pill;
        }

        return (
          <Link
            key={group.id}
            to={`/people/contacts/family-groups/${encodeURIComponent(group.id)}`}
          >
            {pill}
          </Link>
        );
      })}
    </div>
  );
}
