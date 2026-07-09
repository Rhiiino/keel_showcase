// keel_web/src/modules/home/cards/quotes/lib/fallbackQuote.ts

// Offline-safe default when the quote bank cannot be loaded.

import type { Quote } from "../../../api";

export const FALLBACK_QUOTE: Quote = {
  id: 0,
  text: "I have no special talent. I'm only passionately curious.",
  author: "Albert Einstein",
};
