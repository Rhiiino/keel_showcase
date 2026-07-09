// keel_web/src/modules/home/cards/layout/HomeCardCanvasContext.tsx

// Shared canvas interaction and resizable slot sizing for home dashboard cards.

import { createContext, useContext } from "react";

import type { HomeCardId } from "../registry";

export type HomeCardCanvasInteractionContextValue = {
  interactingCardId: HomeCardId | null;
};

export type HomeCardSlotContextValue = {
  fillSlot: true;
  width: number;
  height: number;
} | null;

export const HomeCardCanvasInteractionContext =
  createContext<HomeCardCanvasInteractionContextValue>({
    interactingCardId: null,
  });

export const HomeCardSlotContext = createContext<HomeCardSlotContextValue>(null);

export function useHomeCardCanvasInteraction() {
  return useContext(HomeCardCanvasInteractionContext);
}

export function useHomeCardSlot() {
  return useContext(HomeCardSlotContext);
}
