// keel_web/src/modules/settings/components/TimezoneSettingsSection.tsx

// General settings — preferred IANA timezone for dates and all-day logic.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  applyUserTimezonePreference,
  detectBrowserTimezone,
  formatTimeZoneOptionLabel,
  listSupportedTimeZones,
  useUserTimezone,
} from "../../../app/timezone";
import {
  fetchSettings,
  patchSettings,
  settingsKeys,
} from "../api";

export function TimezoneSettingsSection() {
  const queryClient = useQueryClient();
  useQuery({
    queryKey: settingsKeys.root(),
    queryFn: fetchSettings,
  });

  const timeZone = useUserTimezone();
  const timeZoneOptions = useMemo(() => listSupportedTimeZones(), []);

  const saveMutation = useMutation({
    mutationFn: (nextTimeZone: string) => patchSettings({ timezone: nextTimeZone }),
    onSuccess: (updated, nextTimeZone) => {
      queryClient.setQueryData(settingsKeys.root(), {
        ...updated,
        data: {
          ...updated.data,
          timezone: updated.data.timezone ?? nextTimeZone,
        },
      });
    },
  });

  const handleChange = (nextTimeZone: string) => {
    applyUserTimezonePreference(queryClient, nextTimeZone);
    saveMutation.mutate(nextTimeZone);
  };

  return (
    <section className="space-y-4 rounded-xl border border-stone-800/80 bg-stone-950/40 p-5">
      <div>
        <h3 className="text-sm font-semibold text-stone-100">Timezone</h3>
        <p className="mt-1 text-xs text-stone-500">
          Used for timeline dates, all-day events, plan item schedules, and other
          time-related fields across the app.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="user-timezone" className="text-sm font-medium text-stone-200">
          Preferred timezone
        </label>
        <select
          id="user-timezone"
          value={timeZone}
          disabled={saveMutation.isPending}
          onChange={(event) => handleChange(event.target.value)}
          className="w-full max-w-xl rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {timeZoneOptions.map((option) => (
            <option key={option} value={option}>
              {formatTimeZoneOptionLabel(option)}
            </option>
          ))}
        </select>
        <p className="text-xs text-stone-500">
          Browser default: {formatTimeZoneOptionLabel(detectBrowserTimezone())}
        </p>
      </div>
    </section>
  );
}
