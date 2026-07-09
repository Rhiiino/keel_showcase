// keel_web/src/modules/coak/lib/coakRecordSearch.ts

import type { CoakRecord } from "../api";

export function coakRecordMatchesSearch(record: CoakRecord, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return record.name.toLowerCase().includes(normalizedQuery);
}

export function nextDefaultCoakRecordName(records: CoakRecord[]): string {
  const base = "New record";
  if (!records.some((record) => record.name === base)) {
    return base;
  }

  let suffix = 2;
  while (records.some((record) => record.name === `${base} ${suffix}`)) {
    suffix += 1;
  }

  return `${base} ${suffix}`;
}
