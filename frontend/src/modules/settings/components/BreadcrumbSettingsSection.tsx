// keel_web/src/modules/settings/components/BreadcrumbSettingsSection.tsx

// General settings — max breadcrumb trail length.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  applyNavBreadcrumbMaxEntriesPreference,
  MAX_NAV_BREADCRUMB_MAX_ENTRIES,
  MIN_NAV_BREADCRUMB_MAX_ENTRIES,
  NAV_BREADCRUMB_MAX_ENTRY_OPTIONS,
} from "../../../app/navigation/breadcrumbMaxEntries";
import { useNavigationBreadcrumbMaxEntries } from "../../../app/navigation/useNavigationBreadcrumbMaxEntries";
import {
  fetchSettings,
  patchSettings,
  settingsKeys,
} from "../api";

export function BreadcrumbSettingsSection() {
  const queryClient = useQueryClient();
  useQuery({
    queryKey: settingsKeys.root(),
    queryFn: fetchSettings,
  });

  const maxEntries = useNavigationBreadcrumbMaxEntries();

  const saveMutation = useMutation({
    mutationFn: (nextMaxEntries: number) =>
      patchSettings({ nav_breadcrumb_max_entries: nextMaxEntries }),
    onSuccess: (updated, nextMaxEntries) => {
      queryClient.setQueryData(settingsKeys.root(), {
        ...updated,
        data: {
          ...updated.data,
          nav_breadcrumb_max_entries:
            updated.data.nav_breadcrumb_max_entries ?? nextMaxEntries,
        },
      });
    },
  });

  const handleChange = (nextMaxEntries: number) => {
    applyNavBreadcrumbMaxEntriesPreference(queryClient, nextMaxEntries);
    saveMutation.mutate(nextMaxEntries);
  };

  return (
    <section className="space-y-4 rounded-xl border border-stone-800/80 bg-stone-950/40 p-5">
      <div>
        <h3 className="text-sm font-semibold text-stone-100">Breadcrumb trail</h3>
        <p className="mt-1 text-xs text-stone-500">
          How many recent locations appear in the header breadcrumb when you navigate
          between pages.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="nav-breadcrumb-max-entries"
          className="text-sm font-medium text-stone-200"
        >
          Maximum breadcrumbs
        </label>
        <select
          id="nav-breadcrumb-max-entries"
          value={maxEntries}
          disabled={saveMutation.isPending}
          onChange={(event) => {
            const nextMaxEntries = Number.parseInt(event.target.value, 10);
            if (
              Number.isNaN(nextMaxEntries) ||
              nextMaxEntries < MIN_NAV_BREADCRUMB_MAX_ENTRIES ||
              nextMaxEntries > MAX_NAV_BREADCRUMB_MAX_ENTRIES
            ) {
              return;
            }
            handleChange(nextMaxEntries);
          }}
          className="w-full max-w-xs rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {NAV_BREADCRUMB_MAX_ENTRY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
