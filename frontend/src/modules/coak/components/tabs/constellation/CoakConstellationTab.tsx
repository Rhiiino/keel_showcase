// keel_web/src/modules/coak/components/tabs/constellation/CoakConstellationTab.tsx

import { useCallback } from "react";

import { useCoakRecordWorkspace } from "../../../context/CoakRecordWorkspaceContext";
import { RainyNightRainOverlay } from "../../../../../lib/visual/RainyNightRainOverlay";
import { useThemeSettings } from "../../../../settings/components/context";
import { useCoakConstellationGraphReady } from "../../../hooks/tabs/constellation/useCoakConstellationGraphReady";
import {
  isCoakRainyNightConstellationBackground,
  isCoakStormConstellationBackground,
  readCoakConstellationBackgroundPreset,
} from "../../../lib/tabs/settings/coakBackgroundSettings";
import { coakSpaceBackgroundStyle } from "../../../lib/workspace/coakCanvasTone";
import { CoakGraphNodeContextMenu } from "./graph/CoakGraphNodeContextMenu";
import { CoakGraphCanvasContextMenu } from "./graph/CoakGraphCanvasContextMenu";
import { CoakScene } from "./graph/CoakScene";
import { CoakConstellationGraphReadyProvider } from "./CoakConstellationGraphReadyContext";
import { CoakConstellationItemEditorOverlay } from "./modals/CoakConstellationItemEditorOverlay";
import { CoakPinnedNodeEditorsOverlay } from "./modals/CoakPinnedNodeEditorsOverlay";
import { CoakConstellationLoadingOverlay } from "./CoakConstellationLoadingOverlay";
import { CoakConstellationSearchBar } from "./CoakConstellationSearchBar";
import { CoakStormLightningOverlay } from "./CoakStormLightningOverlay";

export function CoakConstellationTab() {
  const {
    configurationSettings,
    constellationSearchQuery,
    isLoading,
    recordId,
    setConstellationSearchQuery,
  } = useCoakRecordWorkspace();
  const { themeId } = useThemeSettings();
  const { showLoadingOverlay, overlayFading, mountGraph, revealGraph, markGraphPainted } =
    useCoakConstellationGraphReady(recordId, isLoading);
  const handleGraphPainted = useCallback(() => {
    markGraphPainted();
  }, [markGraphPainted]);

  const backgroundPreset = readCoakConstellationBackgroundPreset(configurationSettings);
  const showCoakRainOverlay =
    isCoakRainyNightConstellationBackground(backgroundPreset) && themeId !== "rainy_night";

  return (
    <CoakConstellationGraphReadyProvider markGraphPainted={handleGraphPainted}>
      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        style={coakSpaceBackgroundStyle(backgroundPreset)}
      >
        {isCoakStormConstellationBackground(backgroundPreset) ? (
          <CoakStormLightningOverlay />
        ) : null}
        {showCoakRainOverlay ? <RainyNightRainOverlay /> : null}
        {mountGraph ? (
          <div
            className={revealGraph ? undefined : "invisible pointer-events-none"}
            aria-hidden={!revealGraph}
          >
            <CoakScene />
          </div>
        ) : null}
        {showLoadingOverlay ? (
          <CoakConstellationLoadingOverlay
            key={recordId ?? "none"}
            fading={overlayFading}
          />
        ) : null}
        <CoakPinnedNodeEditorsOverlay />
        <CoakConstellationSearchBar
          value={constellationSearchQuery}
          disabled={isLoading}
          onChange={setConstellationSearchQuery}
        />
        <CoakConstellationItemEditorOverlay />
        <CoakGraphNodeContextMenu />
        <CoakGraphCanvasContextMenu />
      </div>
    </CoakConstellationGraphReadyProvider>
  );
}
