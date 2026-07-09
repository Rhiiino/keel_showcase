// stack_sandbox/frontend_web/src/modules/contacts/lib/display.ts

// Contact display helpers — age and family group labels.

import type { Contact, ContactFamilyGroup } from "../api";

export type ContactAgeDisplay = {
  value: number;
  label: string;
};

function parseDateOnly(value: string): Date | null {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function ageAtDate(birthDate: Date, referenceDate: Date): number {
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDelta = referenceDate.getMonth() - birthDate.getMonth();
  if (
    monthDelta < 0
    || (monthDelta === 0 && referenceDate.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age;
}

export function formatContactAge(
  contact: Pick<Contact, "birth_date" | "birth_date_year_known" | "death_date">,
): ContactAgeDisplay | null {
  if (!contact.birth_date || !contact.birth_date_year_known) {
    return null;
  }

  const birthDate = parseDateOnly(contact.birth_date);
  if (!birthDate) {
    return null;
  }

  if (contact.death_date) {
    const deathDate = parseDateOnly(contact.death_date);
    if (!deathDate) {
      return null;
    }
    const age = ageAtDate(birthDate, deathDate);
    return {
      value: age,
      label: `Age at death: ${age}`,
    };
  }

  const age = ageAtDate(birthDate, new Date());
  return {
    value: age,
    label: `${age} years old`,
  };
}

export function formatFamilyGroupSummary(groups: ContactFamilyGroup[]): string {
  if (groups.length === 0) {
    return "No family group";
  }
  return groups.map((group) => group.name).join(", ");
}
