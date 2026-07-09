// keel_web/src/modules/games/pages/GamePlayPage.tsx

import { Navigate, useParams } from "react-router-dom";

import { getGameDefinition } from "../gameRegistry";

export function GamePlayPage() {
  const { gameKey } = useParams<{ gameKey: string }>();
  const game = gameKey ? getGameDefinition(gameKey) : undefined;

  if (!game) {
    return <Navigate to="/games" replace />;
  }

  const GameComponent = game.component;
  return <GameComponent gameKey={game.key} />;
}
