// keel_web/src/modules/people/shared/lib/birthDate.ts

// Birth date helpers — month/day-only dates and API serialization.

export const BIRTH_DATE_UNKNOWN_YEAR = 9999;

export type BirthDateParts = {
  month: string;
  day: string;
  year: string;
};

export type BirthDatePayload = {
  birth_date: string | null;
  birth_date_year_known: boolean;
};

export const EMPTY_BIRTH_DATE_PARTS: BirthDateParts = {
  month: "",
  day: "",
  year: "",
};

export const MONTH_OPTIONS = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
] as const;

const DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => {
  const value = String(index + 1).padStart(2, "0");
  return { value, label: String(index + 1) };
});

export function getBirthDateDayOptions(month: string): { value: string; label: string }[] {
  if (!month) {
    return DAY_OPTIONS;
  }
  const monthNumber = Number(month);
  if (!Number.isFinite(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return DAY_OPTIONS;
  }
  const year = 2024;
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  return DAY_OPTIONS.slice(0, daysInMonth);
}

export function partsFromContact(contact: {
  birth_date: string | null;
  birth_date_year_known: boolean;
}): BirthDateParts {
  if (!contact.birth_date) {
    return { ...EMPTY_BIRTH_DATE_PARTS };
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(contact.birth_date);
  if (!match) {
    return { ...EMPTY_BIRTH_DATE_PARTS };
  }

  const [, year, month, day] = match;
  return {
    month,
    day,
    year: contact.birth_date_year_known ? year : "",
  };
}

export function partsToPayload(parts: BirthDateParts): BirthDatePayload {
  const month = parts.month.trim();
  const day = parts.day.trim();
  const year = parts.year.trim();

  if (!month && !day && !year) {
    return { birth_date: null, birth_date_year_known: true };
  }

  if (!month || !day) {
    return { birth_date: null, birth_date_year_known: true };
  }

  if (year) {
    return {
      birth_date: `${year.padStart(4, "0")}-${month}-${day}`,
      birth_date_year_known: true,
    };
  }

  return {
    birth_date: `${BIRTH_DATE_UNKNOWN_YEAR}-${month}-${day}`,
    birth_date_year_known: false,
  };
}

export function birthDatePayloadsEqual(a: BirthDatePayload, b: BirthDatePayload): boolean {
  return (
    a.birth_date === b.birth_date
    && a.birth_date_year_known === b.birth_date_year_known
  );
}

export function formatBirthDate(
  birthDate: string | null,
  yearKnown = true,
): string {
  if (!birthDate) {
    return "—";
  }

  const parsed = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return birthDate;
  }

  if (yearKnown) {
    return parsed.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatContactBirthDate(contact: {
  birth_date: string | null;
  birth_date_year_known: boolean;
}): string {
  return formatBirthDate(contact.birth_date, contact.birth_date_year_known);
}

export function formatBirthDateParts(parts: BirthDateParts): string {
  const payload = partsToPayload(parts);
  return formatBirthDate(payload.birth_date, payload.birth_date_year_known);
}

export function clampBirthDateParts(parts: BirthDateParts): BirthDateParts {
  const dayOptions = getBirthDateDayOptions(parts.month);
  if (!parts.day) {
    return parts;
  }
  const maxDay = dayOptions.at(-1)?.value;
  if (maxDay && parts.day > maxDay) {
    return { ...parts, day: maxDay };
  }
  return parts;
}


export function partsFromDateOnly(date: string | null): BirthDateParts {
  return partsFromContact({ birth_date: date, birth_date_year_known: true });
}


export function partsToDateOnly(parts: BirthDateParts): string | null {
  const month = parts.month.trim();
  const day = parts.day.trim();
  const year = parts.year.trim();

  if (!month && !day && !year) {
    return null;
  }

  if (!month || !day || !year) {
    return null;
  }

  return `${year.padStart(4, "0")}-${month}-${day}`;
}
