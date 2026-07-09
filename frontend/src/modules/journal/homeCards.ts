// keel_web/src/modules/journal/homeCards.ts

// Journal dashboard card contributions for the module manifest.

import { HOME_CARD_IDS, type HomeCardDefinition } from "../../app/modules/homeCardTypes";
import { HomeJournalStatusCard } from "./homeCards/HomeJournalStatusCard";

export const journalHomeCards: HomeCardDefinition[] = [
  {
    id: HOME_CARD_IDS.journalStatus,
    label: "Journal Status",
    category: "journal",
    Component: HomeJournalStatusCard,
  },
];
