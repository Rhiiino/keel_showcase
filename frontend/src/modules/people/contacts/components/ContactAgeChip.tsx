// stack_sandbox/frontend_web/src/modules/contacts/components/ContactAgeChip.tsx

// Styled age chip for contact detail.

import { formatContactAge } from "../lib/display";
import type { Contact } from "../api";

type ContactAgeChipProps = {
  contact: Pick<Contact, "birth_date" | "birth_date_year_known" | "death_date">;
};

export function ContactAgeChip({ contact }: ContactAgeChipProps) {
  const age = formatContactAge(contact);
  if (!age) {
    return null;
  }

  const isDeceased = Boolean(contact.death_date);

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1",
        isDeceased
          ? "bg-stone-500/10 text-stone-300 ring-stone-500/25"
          : "bg-sky-400/12 text-sky-200 ring-sky-400/25",
      ].join(" ")}
    >
      {age.label}
    </span>
  );
}
