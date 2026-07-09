// keel_web/src/modules/settings/components/ThemesSettingsTab.tsx

// Theme picker for the global app appearance.

import { RainyNightRainOverlay } from "../../../lib/visual/RainyNightRainOverlay";
import { useThemeSettings } from "./context";
import type { AppThemeDefinition } from "../lib/theme";

function ThemePreviewSwatch({ theme }: { theme: AppThemeDefinition }) {
  return (
    <div
      data-app-theme={theme.id}
      className="relative h-20 w-full overflow-hidden rounded-app-lg border border-stone-700/80"
      style={{ backgroundColor: theme.pageBgColor }}
    >
      <div className="theme-preview-gradient pointer-events-none absolute inset-0 opacity-90" />
      {theme.dynamic ? (
        <RainyNightRainOverlay className="pointer-events-none absolute inset-0" />
      ) : null}
      <div className="absolute bottom-2 left-2 right-2 flex gap-1.5">
        <span className="theme-preview-surface h-2 flex-1" />
        <span className="theme-preview-accent h-2 w-8" />
      </div>
    </div>
  );
}

export function ThemesSettingsTab() {
  const { themeId, themes, setThemeId } = useThemeSettings();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      <header>
        <h2 className="text-lg font-semibold text-stone-50">Themes</h2>
        <p className="mt-1 text-sm text-stone-500">
          Choose a visual theme for the app shell, surfaces, chrome, and accent colors.
        </p>
      </header>

      <section className="space-y-4 rounded-app-xl border border-stone-800/80 bg-stone-950/40 p-5">
        <div>
          <h3 className="text-sm font-semibold text-stone-100">App theme</h3>
          <p className="mt-1 text-xs text-stone-500">
            Your choice is saved on this device and applied across signed-in pages.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {themes.map((theme) => {
            const selected = theme.id === themeId;

            return (
              <label
                key={theme.id}
                className={[
                  "flex cursor-pointer flex-col gap-3 rounded-app-xl border p-4 transition",
                  selected
                    ? "border-app-accent/55 bg-stone-900/60 ring-1 ring-app-accent/35"
                    : "border-stone-800 bg-stone-950/50 hover:border-stone-700 hover:bg-stone-900/40",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="app-theme"
                  value={theme.id}
                  checked={selected}
                  onChange={() => setThemeId(theme.id)}
                  className="sr-only"
                />
                <ThemePreviewSwatch theme={theme} />
                <div>
                  <p className="text-sm font-semibold text-stone-100">{theme.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-stone-500">
                    {theme.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}
