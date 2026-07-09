// keel_web/src/modules/coak/hooks/tabs/directory/useCoakDirectorySearchSync.ts

import type { Dispatch, SetStateAction } from "react";

import { findCoakDirectorySearchMatches } from "../../../lib/tabs/directory/coakDirectorySearch";
import type { CoakTreeNode } from "../../../lib/tabs/directory/coakTree";
import { useCoakNodeSearchSync } from "./useCoakNodeSearchSync";

type UseCoakDirectorySearchSyncOptions = {
  tree: CoakTreeNode[];
  directorySearchQuery: string;
  setDirectorySearchMatchIds: Dispatch<SetStateAction<string[]>>;
  openItemEditors: (nodeIds: string[], options?: { orbit?: boolean }) => void;
  closeItemEditor: () => void;
  cancelConstellationOrbit: () => void;
};

export function useCoakDirectorySearchSync({
  tree,
  directorySearchQuery,
  setDirectorySearchMatchIds,
  openItemEditors,
  closeItemEditor,
  cancelConstellationOrbit,
}: UseCoakDirectorySearchSyncOptions) {
  useCoakNodeSearchSync({
    tree,
    searchQuery: directorySearchQuery,
    findMatches: findCoakDirectorySearchMatches,
    setSearchMatchIds: setDirectorySearchMatchIds,
    openItemEditors,
    closeItemEditor,
    cancelConstellationOrbit,
  });
}
