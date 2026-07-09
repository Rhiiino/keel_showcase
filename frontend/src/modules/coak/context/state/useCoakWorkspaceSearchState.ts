// keel_web/src/modules/coak/context/state/useCoakWorkspaceSearchState.ts

import { useCallback, useState } from "react";

import { useCoakConstellationSearchSync } from "../../hooks/tabs/constellation/useCoakConstellationSearchSync";
import { useCoakDirectorySearchSync } from "../../hooks/tabs/directory/useCoakDirectorySearchSync";
import type { CoakTreeNode } from "../../lib/tabs/directory/coakTree";
import type { CoakItemEditorState } from "./useCoakItemEditorState";

type UseCoakWorkspaceSearchStateParams = {
  tree: CoakTreeNode[];
  openItemEditor: CoakItemEditorState["openItemEditor"];
  openItemEditors: CoakItemEditorState["openItemEditors"];
  closeItemEditor: CoakItemEditorState["closeItemEditor"];
  cancelConstellationOrbit: CoakItemEditorState["cancelConstellationOrbit"];
};

export function useCoakWorkspaceSearchState({
  tree,
  openItemEditor,
  openItemEditors,
  closeItemEditor,
  cancelConstellationOrbit,
}: UseCoakWorkspaceSearchStateParams) {
  const [directorySearchQuery, setDirectorySearchQueryState] = useState("");
  const [directorySearchMatchIds, setDirectorySearchMatchIds] = useState<string[]>([]);
  const [constellationSearchQuery, setConstellationSearchQueryState] = useState("");
  const [constellationSearchMatchIds, setConstellationSearchMatchIds] = useState<string[]>([]);
  const [constellationSearchMatchIndex, setConstellationSearchMatchIndex] = useState(0);

  const setDirectorySearchQuery = useCallback((query: string) => {
    setDirectorySearchQueryState(query);
    if (query.trim()) {
      setConstellationSearchQueryState("");
      setConstellationSearchMatchIds([]);
      setConstellationSearchMatchIndex(0);
    }
  }, []);

  const setConstellationSearchQuery = useCallback((query: string) => {
    setConstellationSearchQueryState(query);
    if (query.trim()) {
      setDirectorySearchQueryState("");
      setDirectorySearchMatchIds([]);
    }
  }, []);

  const cycleConstellationSearchMatch = useCallback(
    (direction: -1 | 1) => {
      const matchCount = constellationSearchMatchIds.length;
      if (matchCount === 0) {
        return;
      }

      const nextIndex =
        (constellationSearchMatchIndex + direction + matchCount) % matchCount;
      const nodeId = constellationSearchMatchIds[nextIndex];
      if (nodeId == null) {
        return;
      }

      setConstellationSearchMatchIndex(nextIndex);
      openItemEditor(nodeId, { orbit: true, replace: true });
    },
    [constellationSearchMatchIds, constellationSearchMatchIndex, openItemEditor],
  );

  useCoakDirectorySearchSync({
    tree,
    directorySearchQuery,
    setDirectorySearchMatchIds,
    openItemEditors,
    closeItemEditor,
    cancelConstellationOrbit,
  });

  useCoakConstellationSearchSync({
    tree,
    constellationSearchQuery,
    setConstellationSearchMatchIds,
    setConstellationSearchMatchIndex,
    openItemEditor,
    closeItemEditor,
  });

  const isDirectorySearchActive = directorySearchQuery.trim().length > 0;
  const isConstellationSearchActive = constellationSearchQuery.trim().length > 0;
  const isNodeSearchActive = isDirectorySearchActive || isConstellationSearchActive;

  return {
    directorySearchQuery,
    directorySearchMatchIds,
    constellationSearchQuery,
    constellationSearchMatchIds,
    constellationSearchMatchIndex,
    isDirectorySearchActive,
    isConstellationSearchActive,
    isNodeSearchActive,
    setDirectorySearchQuery,
    setConstellationSearchQuery,
    cycleConstellationSearchMatch,
  };
}

export type CoakWorkspaceSearchState = ReturnType<typeof useCoakWorkspaceSearchState>;
