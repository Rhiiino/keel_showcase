// keel_web/src/modules/coak/hooks/tabs/settings/useCoakSettingsSearch.ts

import { useCallback, useEffect, useMemo, useState, type RefObject } from "react";

import {
  findCoakSettingsSearchMatches,
  scrollCoakSettingsSearchTargetIntoView,
} from "../../../lib/tabs/settings/coakSettingsSearch";

export function useCoakSettingsSearch(scrollContainerRef: RefObject<HTMLElement | null>) {
  const [query, setQuery] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);

  const trimmedQuery = query.trim();
  const matchIds = useMemo(
    () => findCoakSettingsSearchMatches(trimmedQuery),
    [trimmedQuery],
  );

  useEffect(() => {
    setMatchIndex(0);
  }, [trimmedQuery, matchIds.length]);

  const scrollToMatch = useCallback(
    (index: number) => {
      const matchId = matchIds[index];
      const container = scrollContainerRef.current;
      if (!matchId || !container) {
        return;
      }

      const target = container.querySelector<HTMLElement>(`#${CSS.escape(matchId)}`);
      if (!target) {
        return;
      }

      scrollCoakSettingsSearchTargetIntoView(container, target);
    },
    [matchIds, scrollContainerRef],
  );

  useEffect(() => {
    if (matchIds.length === 0) {
      return;
    }

    scrollToMatch(matchIndex);
  }, [matchIds, matchIndex, scrollToMatch]);

  const cycleMatch = useCallback(
    (direction: -1 | 1) => {
      if (matchIds.length <= 1) {
        return;
      }

      setMatchIndex((current) => (current + direction + matchIds.length) % matchIds.length);
    },
    [matchIds.length],
  );

  const activeMatchId = matchIds[matchIndex] ?? null;

  return {
    query,
    setQuery,
    matchIds,
    matchIndex,
    activeMatchId,
    cycleMatch,
  };
}
