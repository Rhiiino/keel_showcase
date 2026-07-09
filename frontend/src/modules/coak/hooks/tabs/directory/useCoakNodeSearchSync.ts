// keel_web/src/modules/coak/hooks/tabs/directory/useCoakNodeSearchSync.ts

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";

import { scheduleCoakSearchInputFocusRestore } from "../../../lib/search/coakSearchFocus";
import type { CoakTreeNode } from "../../../lib/tabs/directory/coakTree";

type UseCoakNodeSearchSyncOptions = {
  tree: CoakTreeNode[];
  searchQuery: string;
  findMatches: (tree: CoakTreeNode[], query: string) => string[];
  setSearchMatchIds: Dispatch<SetStateAction<string[]>>;
  openItemEditors: (nodeIds: string[], options?: { orbit?: boolean }) => void;
  closeItemEditor: () => void;
  cancelConstellationOrbit: () => void;
};

export function useCoakNodeSearchSync({
  tree,
  searchQuery,
  findMatches,
  setSearchMatchIds,
  openItemEditors,
  closeItemEditor,
  cancelConstellationOrbit,
}: UseCoakNodeSearchSyncOptions) {
  const previousMatchCountRef = useRef(0);
  const previousPrimaryNodeIdRef = useRef<string | null>(null);
  const hadSearchQueryRef = useRef(false);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      previousMatchCountRef.current = 0;
      previousPrimaryNodeIdRef.current = null;
      setSearchMatchIds((current) => (current.length === 0 ? current : []));
      if (hadSearchQueryRef.current) {
        closeItemEditor();
        scheduleCoakSearchInputFocusRestore();
      }
      hadSearchQueryRef.current = false;
      return;
    }

    hadSearchQueryRef.current = true;

    const matchIds = findMatches(tree, trimmedQuery);
    setSearchMatchIds((current) =>
      current.length === matchIds.length &&
      current.every((nodeId, index) => nodeId === matchIds[index])
        ? current
        : matchIds,
    );

    if (matchIds.length === 0) {
      previousMatchCountRef.current = 0;
      previousPrimaryNodeIdRef.current = null;
      closeItemEditor();
      return;
    }

    const primaryNodeId = matchIds[0];
    const shouldOrbit =
      matchIds.length === 1 &&
      (previousMatchCountRef.current !== 1 || previousPrimaryNodeIdRef.current !== primaryNodeId);

    if (matchIds.length > 1) {
      cancelConstellationOrbit();
    }

    openItemEditors(matchIds, { orbit: shouldOrbit });

    previousMatchCountRef.current = matchIds.length;
    previousPrimaryNodeIdRef.current = primaryNodeId;
  }, [
    cancelConstellationOrbit,
    closeItemEditor,
    findMatches,
    openItemEditors,
    searchQuery,
    setSearchMatchIds,
    tree,
  ]);
}
