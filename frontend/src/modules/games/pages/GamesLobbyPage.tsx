// keel_web/src/modules/games/pages/GamesLobbyPage.tsx

import { useMemo, useState } from "react";

import { CARD_GALLERY_GRID_CLASS } from "../../../views/cards/cardGridClasses";
import { CardGalleryPageLayout } from "../../../views/cards/CardGalleryPageLayout";
import { GameCard } from "../components/GameCard";
import { GAME_REGISTRY, gameMatchesSearch } from "../gameRegistry";

export function GamesLobbyPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const games = GAME_REGISTRY;

  const visibleGames = useMemo(
    () => games.filter((game) => gameMatchesSearch(game, searchQuery)),
    [games, searchQuery],
  );

  return (
    <CardGalleryPageLayout
      title="Games"
      recordCount={games.length}
      subtitle="Play solo puzzles and track your personal bests."
      searchId="games-search"
      searchLabel="Search games"
      searchPlaceholder="Search games…"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      totalCount={games.length}
      filteredCount={visibleGames.length}
      emptyMessage="No games yet."
      noMatchMessage="No games match your search."
    >
      <div className={CARD_GALLERY_GRID_CLASS}>
        {visibleGames.map((game) => (
          <GameCard key={game.key} game={game} />
        ))}
      </div>
    </CardGalleryPageLayout>
  );
}
