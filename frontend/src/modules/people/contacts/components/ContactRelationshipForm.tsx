// stack_sandbox/frontend_web/src/modules/contacts/components/ContactRelationshipForm.tsx

// Inline form to add a contact relationship.

import { useState } from "react";

import type { Contact } from "../api";
import { formatContactName } from "../api";

const fieldClass =
  "mt-1.5 w-full appearance-none rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-sky-400/35 focus:bg-white/[0.05] focus:ring-2 focus:ring-sky-400/15";

type ContactRelationshipFormProps = {
  contact: Contact;
  otherContacts: Contact[];
  pending?: boolean;
  onSubmit: (payload: {
    from_contact_id: number;
    to_contact_id: number;
    relationship_type: string;
  }) => void;
};

export function ContactRelationshipForm({
  contact,
  otherContacts,
  pending = false,
  onSubmit,
}: ContactRelationshipFormProps) {
  const [otherContactId, setOtherContactId] = useState("");
  const [relationshipType, setRelationshipType] = useState("parent");
  const [direction, setDirection] = useState<"from" | "to">("from");

  return (
    <form
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900/50 via-stone-950/30 to-stone-950/60 p-5 ring-1 ring-white/[0.06]"
      onSubmit={(event) => {
        event.preventDefault();
        const otherId = Number(otherContactId);
        if (!Number.isFinite(otherId)) {
          return;
        }
        const fromId = direction === "from" ? contact.id : otherId;
        const toId = direction === "from" ? otherId : contact.id;
        onSubmit({
          from_contact_id: fromId,
          to_contact_id: toId,
          relationship_type: relationshipType,
        });
        setOtherContactId("");
      }}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-500/[0.07] blur-2xl" />

      <p className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500">
        Add relationship
      </p>

      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <label className="block text-xs font-medium text-stone-400">
          Person
          <select
            value={otherContactId}
            onChange={(event) => setOtherContactId(event.target.value)}
            className={fieldClass}
            required
          >
            <option value="">Choose someone…</option>
            {otherContacts.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {formatContactName(entry)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-medium text-stone-400">
          Connection
          <select
            value={relationshipType}
            onChange={(event) => setRelationshipType(event.target.value)}
            className={fieldClass}
          >
            <option value="spouse">Spouse</option>
            <option value="parent">Parent → child</option>
            <option value="sibling">Sibling</option>
            <option value="friend">Friend</option>
          </select>
        </label>

        {relationshipType === "parent" && (
          <label className="block text-xs font-medium text-stone-400 sm:col-span-2">
            Parent direction
            <select
              value={direction}
              onChange={(event) => setDirection(event.target.value as "from" | "to")}
              className={fieldClass}
            >
              <option value="from">{formatContactName(contact)} is the parent</option>
              <option value="to">{formatContactName(contact)} is the child</option>
            </select>
          </label>
        )}
      </div>

      <div className="mt-5 flex items-center justify-end gap-3 border-t border-white/[0.06] pt-4">
        <button
          type="submit"
          disabled={pending || !otherContactId}
          className={[
            "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition",
            "bg-gradient-to-r from-sky-500/90 to-cyan-400/80 text-stone-950",
            "hover:from-sky-400 hover:to-cyan-300 disabled:cursor-not-allowed disabled:opacity-45",
          ].join(" ")}
        >
          {pending ? "Adding…" : "Add link"}
        </button>
      </div>
    </form>
  );
}
