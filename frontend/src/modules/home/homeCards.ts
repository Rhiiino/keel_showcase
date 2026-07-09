// keel_web/src/modules/home/homeCards.ts

// Home-owned dashboard card contributions for the module manifest.

import { HOME_CARD_IDS, type HomeCardDefinition } from "../../app/modules/homeCardTypes";
import { HomeAliveTimerCard } from "./cards/alive/HomeAliveTimerCard";
import { HomeGreetingCard } from "./cards/greeting/HomeGreetingCard";
import { HomeQuoteCard } from "./cards/quotes/HomeQuoteCard";
import { HomeSlideshowCard } from "./cards/slideshow/HomeSlideshowCard";

export const homeModuleHomeCards: HomeCardDefinition[] = [
  {
    id: HOME_CARD_IDS.greeting,
    label: "Greeting",
    category: "greeting",
    Component: HomeGreetingCard,
  },
  {
    id: HOME_CARD_IDS.quote,
    label: "Quote",
    category: "quotes",
    Component: HomeQuoteCard,
  },
  {
    id: HOME_CARD_IDS.slideshow,
    label: "Slideshow",
    category: "slideshow",
    Component: HomeSlideshowCard,
  },
  {
    id: HOME_CARD_IDS.aliveTimer,
    label: "Alive Timer",
    category: "alive",
    Component: HomeAliveTimerCard,
  },
];
