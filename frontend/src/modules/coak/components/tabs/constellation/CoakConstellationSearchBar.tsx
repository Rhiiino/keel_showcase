// keel_web/src/modules/coak/components/tabs/constellation/CoakConstellationSearchBar.tsx

import { useMemo } from "react";

import { useCoakRecordWorkspace } from "../../../context/CoakRecordWorkspaceContext";
import { CoakNodeSearchInput } from "../../search/CoakNodeSearchInput";
import {
  filterVisibleCoakPinnedNodeIds,
  resolveCoakConstellationSearchBarLeft,
} from "./modals/coakPinnedItemEditorLayout";
import { CoakConstellationSearchNavigator } from "./CoakConstellationSearchNavigator";

type CoakConstellationSearchBarProps = {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function CoakConstellationSearchBar({
  value,
  disabled = false,
  onChange,
}: CoakConstellationSearchBarProps) {
  const {
    pinnedNodeIds,
    items,
    constellationSearchMatchIds,
    constellationSearchMatchIndex,
    cycleConstellationSearchMatch,
  } = useCoakRecordWorkspace();

  const hasPinnedPanel = useMemo(
    () => filterVisibleCoakPinnedNodeIds(pinnedNodeIds, items).length > 0,
    [items, pinnedNodeIds],
  );

  const showNavigator = value.trim().length > 0 && constellationSearchMatchIds.length > 0;

  return (
    <div
      className="pointer-events-none absolute top-3 z-[15] flex max-w-[calc(100%-1.5rem)] items-center gap-2"
      style={{ left: resolveCoakConstellationSearchBarLeft(hasPinnedPanel) }}
      onClick={(event) => event.stopPropagation()}
    >
      <CoakNodeSearchInput
        value={value}
        disabled={disabled}
        focusSlot="constellation"
        onChange={onChange}
        className="pointer-events-auto w-56 max-w-full shrink-0"
        placeholder="Search nodes…"
        ariaLabel="Search constellation nodes"
      />
      {showNavigator ? (
        <CoakConstellationSearchNavigator
          currentIndex={constellationSearchMatchIndex}
          matchCount={constellationSearchMatchIds.length}
          disabled={disabled}
          onPrevious={() => cycleConstellationSearchMatch(-1)}
          onNext={() => cycleConstellationSearchMatch(1)}
        />
      ) : null}
    </div>
  );
}
