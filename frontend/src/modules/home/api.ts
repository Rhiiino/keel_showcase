// stack_sandbox/frontend_web/src/modules/home/api.ts

// API layer for home screen content (GET /home/quotes).

import { apiFetch } from "../../lib/api";

const credentials = "include" as const;

export type Quote = {
  id: number;
  text: string;
  author: string;
};

export const homeKeys = {
  all: ["home"] as const,
  quotes: () => [...homeKeys.all, "quotes"] as const,
};

export function fetchQuotes(): Promise<Quote[]> {
  return apiFetch<Quote[]>("/home/quotes", { credentials });
}
