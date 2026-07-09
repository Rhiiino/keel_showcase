// stack_sandbox/frontend_web/src/modules/contacts/components/ContactRelationshipsSection.tsx

// Collapsible relationships list and add form on contact detail.

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import type { Contact, ContactRelationship } from "../api";
import { ContactRelationshipForm } from "./ContactRelationshipForm";
import { ContactRelationshipRow } from "./ContactRelationshipRow";

type ContactRelationshipsSectionProps = {
  contact: Contact;
  relationships: ContactRelationship[] | undefined;
  otherContacts: Contact[];
  loading?: boolean;
  creating?: boolean;
  removingId?: number | null;
  onCreate: (payload: {
    from_contact_id: number;
    to_contact_id: number;
    relationship_type: string;
  }) => void;
  onRemove: (relationshipId: number) => void;
};

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={[
        "h-4 w-4 shrink-0 text-stone-500 transition-transform duration-300 ease-out",
        expanded ? "rotate-180" : "",
      ].join(" ")}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function ContactRelationshipsSection({
  contact,
  relationships,
  otherContacts,
  loading = false,
  creating = false,
  removingId = null,
  onCreate,
  onRemove,
}: ContactRelationshipsSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const count = relationships?.length ?? 0;

  return (
    <section className="mt-10">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="group flex w-full items-center gap-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-medium uppercase tracking-wide text-stone-500 transition group-hover:text-stone-400">
              Relationships
            </h2>
            {!loading && (
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium tabular-nums text-stone-400 ring-1 ring-white/[0.08]">
                {count}
              </span>
            )}
          </div>
        </div>
        <span
          className={[
            "inline-flex h-8 w-8 items-center justify-center rounded-full transition",
            "ring-1 ring-white/[0.08] bg-white/[0.03]",
            "group-hover:bg-white/[0.06] group-hover:ring-white/[0.14]",
          ].join(" ")}
        >
          <ChevronIcon expanded={expanded} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="relationships-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              {loading && (
                <p className="text-sm text-stone-500">Loading relationships…</p>
              )}

              {!loading && count === 0 && (
                <p className="rounded-xl border border-dashed border-white/[0.08] px-4 py-6 text-center text-sm text-stone-500">
                  No relationships yet — add one below.
                </p>
              )}

              {!loading && count > 0 && (
                <ul className="space-y-2.5">
                  {relationships?.map((relationship) => (
                    <ContactRelationshipRow
                      key={relationship.id}
                      relationship={relationship}
                      perspectiveContactId={contact.id}
                      onRemove={() => onRemove(relationship.id)}
                      removing={removingId === relationship.id}
                    />
                  ))}
                </ul>
              )}

              <div className="mt-5">
                <ContactRelationshipForm
                  contact={contact}
                  otherContacts={otherContacts}
                  pending={creating}
                  onSubmit={onCreate}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
