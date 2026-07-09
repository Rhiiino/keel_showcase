// keel_web/src/app/modules/homeCardTypes.ts

// Shared home dashboard card registry types (used by manifests and home layout).

import type { ComponentType } from "react";

export const HOME_CARD_IDS = {
  greeting: "greeting",
  quote: "quote",
  slideshow: "slideshow",
  journalStatus: "journal-status",
  todayTimeline: "today-timeline",
  aliveTimer: "alive-timer",
} as const;

export type HomeCardId = (typeof HOME_CARD_IDS)[keyof typeof HOME_CARD_IDS];

export type HomeCardCategory =
  | "greeting"
  | "quotes"
  | "slideshow"
  | "journal"
  | "timeline"
  | "alive";

export type HomeCardDefinition = {
  id: HomeCardId;
  label: string;
  category: HomeCardCategory;
  Component: ComponentType;
};
