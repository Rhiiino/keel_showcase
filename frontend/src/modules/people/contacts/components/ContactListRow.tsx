// keel_web/src/modules/contacts/components/ContactListRow.tsx

// One contact row in the contacts list table.

import { Link } from "react-router-dom";

import { formatContactName, type Contact } from "../api";
import { formatContactBirthDate } from "../../shared/lib/birthDate";
import { ContactAvatar } from "./ContactAvatar";
import { ContactFamilyGroupPills } from "./ContactFamilyGroupPills";
import { ContactTagPill } from "./tags/ContactTagPill";

export const CONTACT_LIST_TABLE_WIDTH_CLASS = "w-full min-w-[56rem]";

export const CONTACT_LIST_GRID_CLASS =
  "grid w-full grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_7rem_2.5rem] items-center";

type ContactListRowProps = {
  contact: Contact;
};

export function ContactListRow({ contact }: ContactListRowProps) {
  return (
    <Link
      to={`/people/contacts/${contact.id}`}
      className={[
        "relative grid w-full border-b border-stone-800/80 transition last:border-b-0 hover:bg-stone-900/40",
        CONTACT_LIST_GRID_CLASS,
      ].join(" ")}
    >
      <div className="flex items-center px-4 py-3.5">
        <ContactAvatar contact={contact} className="h-10 w-10 ring-1 ring-white/[0.08]" />
      </div>

      <div className="min-w-0 px-4 py-3.5">
        <p className="truncate text-sm font-medium text-stone-100">{formatContactName(contact)}</p>
        {contact.is_self ? (
          <p className="mt-0.5 text-xs text-sky-400">This is you</p>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-wrap gap-1.5 px-4 py-3.5">
        {contact.tags.length > 0 ? (
          contact.tags.map((tag) => <ContactTagPill key={tag.id} tag={tag} compact />)
        ) : (
          <span className="text-sm text-stone-600">—</span>
        )}
      </div>

      <div className="min-w-0 px-4 py-3.5">
        <ContactFamilyGroupPills groups={contact.family_groups} />
      </div>

      <div className="px-4 py-3.5 text-right text-sm text-stone-400">
        {formatContactBirthDate(contact)}
      </div>

      <div className="flex items-center justify-center px-2 py-3.5 text-stone-500">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 0 1 .02-1.06L10.94 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-.02Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </Link>
  );
}
