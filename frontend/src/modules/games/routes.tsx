// keel_web/src/modules/games/routes.tsx

import { Route } from "react-router-dom";

import { GamePlayPage } from "./pages/GamePlayPage";
import { GamesLobbyPage } from "./pages/GamesLobbyPage";

export const gamesShellRoutes = (
  <>
    <Route path="games" element={<GamesLobbyPage />} />
    <Route path="games/:gameKey" element={<GamePlayPage />} />
  </>
);
