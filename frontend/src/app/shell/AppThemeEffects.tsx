// keel_web/src/app/shell/AppThemeEffects.tsx

// Dynamic visual effects driven by the active global app theme.

import { RainyNightRainOverlay } from "../../lib/visual/RainyNightRainOverlay";
import { useThemeSettings } from "../../modules/settings/components/context";

export function AppThemeEffects() {
  const { themeId } = useThemeSettings();

  if (themeId !== "rainy_night") {
    return null;
  }

  return (
    <RainyNightRainOverlay className="pointer-events-none fixed inset-0 z-[1]" />
  );
}
