// keel_web/src/modules/settings/components/NavWaveGlowSettingsSection.tsx

// General settings — toggle for the nav menu accent wave glow animation.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  applyNavWaveGlowEnabledPreference,
} from "../../../app/nav/navWaveGlow";
import { useNavWaveGlowEnabled } from "../../../app/nav/useNavWaveGlowEnabled";
import { ToggleSwitch } from "../../../components/ToggleSwitch";
import {
  fetchSettings,
  patchSettings,
  settingsKeys,
} from "../api";

export function NavWaveGlowSettingsSection() {
  const queryClient = useQueryClient();
  useQuery({
    queryKey: settingsKeys.root(),
    queryFn: fetchSettings,
  });

  const waveGlowEnabled = useNavWaveGlowEnabled();

  const saveMutation = useMutation({
    mutationFn: (nextEnabled: boolean) =>
      patchSettings({ nav_wave_glow_enabled: nextEnabled }),
    onSuccess: (updated, nextEnabled) => {
      queryClient.setQueryData(settingsKeys.root(), {
        ...updated,
        data: {
          ...updated.data,
          nav_wave_glow_enabled:
            updated.data.nav_wave_glow_enabled ?? nextEnabled,
        },
      });
    },
  });

  const handleChange = (nextEnabled: boolean) => {
    applyNavWaveGlowEnabledPreference(queryClient, nextEnabled);
    saveMutation.mutate(nextEnabled);
  };

  return (
    <section className="space-y-4 rounded-xl border border-stone-800/80 bg-stone-950/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-100">Nav menu wave glow</h3>
          <p className="mt-1 text-xs text-stone-500">
            A repeating bottom-to-top pulse on nav icons and labels using your theme
            accent color.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-stone-400">Enabled</span>
          <ToggleSwitch
            checked={waveGlowEnabled}
            disabled={saveMutation.isPending}
            ariaLabel="Nav menu wave glow"
            onChange={handleChange}
          />
        </div>
      </div>
    </section>
  );
}
