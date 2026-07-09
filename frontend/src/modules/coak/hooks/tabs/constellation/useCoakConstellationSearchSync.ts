// keel_web/src/modules/coak/hooks/tabs/constellation/useCoakConstellationSearchSync.ts

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";

import { scheduleCoakSearchInputFocusRestore } from "../../../lib/search/coakSearchFocus";
import { findCoakNodeTitleSearchMatches } from "../../../lib/tabs/directory/coakDirectorySearch";
import type { CoakTreeNode } from "../../../lib/tabs/directory/coakTree";

type UseCoakConstellationSearchSyncOptions = {
  tree: CoakTreeNode[];
  constellationSearchQuery: string;
  setConstellationSearchMatchIds: Dispatch<SetStateAction<string[]>>;
  setConstellationSearchMatchIndex: Dispatch<SetStateAction<number>>;
  openItemEditor: (
    nodeId: string,
    options?: { orbit?: boolean; replace?: boolean; focusTitle?: boolean },
  ) => void;
  closeItemEditor: () => void;
};

export function useCoakConstellationSearchSync({
  tree,
  constellationSearchQuery,
  setConstellationSearchMatchIds,
  setConstellationSearchMatchIndex,
  openItemEditor,
  closeItemEditor,
}: UseCoakConstellationSearchSyncOptions) {
  const hadSearchQueryRef = useRef(false);

  useEffect(() => {
    const trimmedQuery = constellationSearchQuery.trim();

    if (!trimmedQuery) {
      setConstellationSearchMatchIds((current) => (current.length === 0 ? current : []));
      setConstellationSearchMatchIndex((current) => (current === 0 ? current : 0));
      if (hadSearchQueryRef.current) {
        closeItemEditor();
        scheduleCoakSearchInputFocusRestore();
      }
      hadSearchQueryRef.current = false;
      return;
    }

    hadSearchQueryRef.current = true;

    const matchIds = findCoakNodeTitleSearchMatches(tree, trimmedQuery);
    setConstellationSearchMatchIds((current) =>
      current.length === matchIds.length &&
      current.every((nodeId, index) => nodeId === matchIds[index])
        ? current
        : matchIds,
    );

    if (matchIds.length === 0) {
      setConstellationSearchMatchIndex((current) => (current === 0 ? current : 0));
      closeItemEditor();
      return;
    }

    setConstellationSearchMatchIndex((current) => (current === 0 ? current : 0));
    openItemEditor(matchIds[0], { orbit: true, replace: true });
  }, [
    closeItemEditor,
    constellationSearchQuery,
    openItemEditor,
    setConstellationSearchMatchIds,
    setConstellationSearchMatchIndex,
    tree,
  ]);
}
