// keel_web/src/modules/games/gameRegistry.ts

import type { ComponentType } from "react";

import { TowerOfHanoiGame } from "./games/tower-of-hanoi/TowerOfHanoiGame";

export type GamePlayProps = {
  gameKey: string;
};

export type GameDefinition = {
  key: string;
  title: string;
  description: string;
  component: ComponentType<GamePlayProps>;
};

export const GAME_REGISTRY: GameDefinition[] = [
  {
    key: "tower-of-hanoi",
    title: "Tower of Hanoi",
    description:
      "Move every disk to the rightmost peg. Never stack a larger disk on a smaller one.",
    component: TowerOfHanoiGame,
  },
];

export function getGameDefinition(gameKey: string): GameDefinition | undefined {
  return GAME_REGISTRY.find((game) => game.key === gameKey);
}

export function gameMatchesSearch(game: GameDefinition, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return (
    game.title.toLowerCase().includes(normalized) ||
    game.description.toLowerCase().includes(normalized)
  );
}
