// keel_web/src/modules/settings/components/HomeCardsSettingsTab.tsx

// Settings tab for toggling home dashboard card visibility.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ToggleSwitch } from "../../../components/ToggleSwitch";
import {
  buildHomeCardVisibilityPatch,
  isHomeCardVisible,
} from "../../home/cards/lib/homeCardVisibility";
import { getHomeCardRegistry } from "../../home/cards/registry";
import type { HomeCardId } from "../../../app/modules/homeCardTypes";
import {
  fetchSettings,
  patchSettings,
  settingsKeys,
} from "../api";

export function HomeCardsSettingsTab() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: settingsKeys.root(),
    queryFn: fetchSettings,
  });

  const visibility = settingsQuery.data?.data.home_card_visibility;

  const saveMutation = useMutation({
    mutationFn: patchSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(settingsKeys.root(), updated);
    },
  });

  const handleToggle = (cardId: HomeCardId, visible: boolean) => {
    saveMutation.mutate({
      home_card_visibility: buildHomeCardVisibilityPatch(cardId, visible),
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      <header>
        <h2 className="text-lg font-semibold text-stone-50">Home Cards</h2>
        <p className="mt-1 text-sm text-stone-500">
          Choose which cards appear on your home page. Hidden cards keep their settings and
          layout.
        </p>
      </header>

      <section className="overflow-hidden rounded-xl border border-stone-800/80 bg-stone-950/40">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-stone-800/80 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Card
          </div>
          <div className="text-right text-xs font-medium uppercase tracking-wide text-stone-500">
            Show
          </div>
        </div>

        {getHomeCardRegistry().map((card) => {
          const visible = isHomeCardVisible(card.id, visibility);

          return (
            <div
              key={card.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center border-b border-stone-800/80 px-4 py-3.5 last:border-b-0"
            >
              <p className="text-sm font-medium text-stone-100">{card.label}</p>
              <ToggleSwitch
                checked={visible}
                disabled={saveMutation.isPending}
                ariaLabel={`Show ${card.label} card`}
                onChange={(nextVisible) => handleToggle(card.id, nextVisible)}
              />
            </div>
          );
        })}
      </section>
    </div>
  );
}
