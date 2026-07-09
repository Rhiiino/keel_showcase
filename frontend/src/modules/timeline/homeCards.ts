// keel_web/src/modules/timeline/homeCards.ts

// Timeline dashboard card contributions for the module manifest.

import { HOME_CARD_IDS, type HomeCardDefinition } from "../../app/modules/homeCardTypes";
import { HomeTodayTimelineCard } from "./homeCards/HomeTodayTimelineCard";

export const timelineHomeCards: HomeCardDefinition[] = [
  {
    id: HOME_CARD_IDS.todayTimeline,
    label: "Today's Timeline",
    category: "timeline",
    Component: HomeTodayTimelineCard,
  },
];
