// stack_sandbox/frontend_web/src/modules/contacts/components/ContactRelationshipRow.tsx

// One styled relationship row on the contact detail page.

import { Link } from "react-router-dom";

import type { ContactRelationship } from "../api";
import {
  parseRelationshipDisplay,
  relationshipTypeMeta,
} from "../lib/relationshipDisplay";

type ContactRelationshipRowProps = {
  relationship: ContactRelationship;
  perspectiveContactId: number;
  onRemove: () => void;
  removing?: boolean;
};

function RelationshipTypeIcon({ type }: { type: string }) {
  const className = "h-4 w-4 shrink-0 opacity-80";

  if (type === "spouse") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  }

  if (type === "parent") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M8 7h8M6 11h12M8 15h8" />
      </svg>
    );
  }

  if (type === "sibling") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zM8 13c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zM16 13c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45v1.5h6v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
    </svg>
  );
}

export function ContactRelationshipRow({
  relationship,
  perspectiveContactId,
  onRemove,
  removing = false,
}: ContactRelationshipRowProps) {
  const display = parseRelationshipDisplay(relationship, perspectiveContactId);
  const meta = relationshipTypeMeta(display.type);

  return (
    <li
      className={[
        "group relative overflow-hidden rounded-xl border-l-[3px] pl-0",
        "ring-1 ring-white/[0.06] transition hover:ring-white/12",
        meta.accent,
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center gap-3 bg-gradient-to-r px-4 py-3",
          meta.glow,
        ].join(" ")}
      >
        <span
          className={[
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1",
            meta.badge,
          ].join(" ")}
        >
          <RelationshipTypeIcon type={display.type} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-stone-500">
              {display.roleLabel}
            </span>
            <span
              className={[
                "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1",
                meta.badge,
              ].join(" ")}
            >
              {display.typeLabel}
            </span>
          </div>
          <Link
            to={`/people/contacts/${display.otherContactId}`}
            className="mt-0.5 block truncate text-sm font-medium text-stone-100 transition hover:text-sky-300"
          >
            {display.otherName}
          </Link>
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          aria-label={`Remove relationship with ${display.otherName}`}
          className={[
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            "text-stone-500 opacity-0 transition group-hover:opacity-100",
            "hover:bg-red-500/10 hover:text-red-300",
            "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400/40",
            removing ? "cursor-not-allowed opacity-50" : "",
          ].join(" ")}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>
    </li>
  );
}
