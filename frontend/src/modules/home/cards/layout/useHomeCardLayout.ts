// keel_web/src/modules/home/cards/layout/useHomeCardLayout.ts

// Loads and persists free-form home card positions via GET/PATCH /settings.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchSettings,
  patchSettings,
  settingsKeys,
  type HomeCardLayoutEntry as SettingsHomeCardLayoutEntry,
} from "../../../settings/api";
import type { HomeCardId } from "../registry";
import { isHomeCardVisible } from "../lib/homeCardVisibility";
import {
  isHomeCardResizable,
  type HomeCardRect,
} from "./homeCardResize";
import {
  layoutSignature,
  resolveHomeCardLayout,
  type HomeCardLayoutEntry,
  type StoredHomeCardLayoutEntry,
} from "./homeCardLayout";

function toStoredLayout(
  layout: readonly HomeCardLayoutEntry[],
): SettingsHomeCardLayoutEntry[] {
  return layout.map((entry) => {
    const stored: SettingsHomeCardLayoutEntry = {
      id: entry.id,
      x: entry.x,
      y: entry.y,
    };
    if (isHomeCardResizable(entry.id) && entry.width != null && entry.height != null) {
      stored.width = entry.width;
      stored.height = entry.height;
    }
    return stored;
  });
}

function parseStoredLayout(
  stored: SettingsHomeCardLayoutEntry[] | null | undefined,
): StoredHomeCardLayoutEntry[] | undefined {
  if (!stored) {
    return undefined;
  }
  return stored.flatMap((entry) => {
    if (!entry.id) {
      return [];
    }
    return [
      {
        id: entry.id as HomeCardId,
        x: entry.x,
        y: entry.y,
        width: entry.width,
        height: entry.height,
      },
    ];
  });
}

export function useHomeCardLayout() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: settingsKeys.root(),
    queryFn: fetchSettings,
  });

  const [layout, setLayout] = useState<HomeCardLayoutEntry[]>(() =>
    resolveHomeCardLayout(undefined),
  );
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const lastPersistedSignature = useRef<string>(
    layoutSignature(resolveHomeCardLayout(undefined)),
  );

  useEffect(() => {
    const stored = parseStoredLayout(settingsQuery.data?.data.home_card_layout);
    const resolved = resolveHomeCardLayout(stored);
    setLayout(resolved);
    layoutRef.current = resolved;
    lastPersistedSignature.current = layoutSignature(resolved);
  }, [settingsQuery.data?.data.home_card_layout]);

  const moveCard = useCallback((id: HomeCardId, x: number, y: number) => {
    setLayout((current) => {
      const next = current.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              x: Math.max(0, Math.round(x)),
              y: Math.max(0, Math.round(y)),
            }
          : entry,
      );
      layoutRef.current = next;
      return next;
    });
  }, []);

  const resizeCard = useCallback((id: HomeCardId, rect: HomeCardRect) => {
    if (!isHomeCardResizable(id)) {
      return;
    }

    setLayout((current) => {
      const next = current.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              x: Math.max(0, Math.round(rect.x)),
              y: Math.max(0, Math.round(rect.y)),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            }
          : entry,
      );
      layoutRef.current = next;
      return next;
    });
  }, []);

  const persistLayout = useCallback(() => {
    const payload = layoutRef.current;
    const signature = layoutSignature(payload);
    if (signature === lastPersistedSignature.current) {
      return;
    }
    lastPersistedSignature.current = signature;
    void patchSettings({
      home_card_layout: toStoredLayout(payload),
    })
      .then((updated) => {
        queryClient.setQueryData(settingsKeys.root(), updated);
      })
      .catch(() => {
        lastPersistedSignature.current = layoutSignature(
          resolveHomeCardLayout(
            parseStoredLayout(settingsQuery.data?.data.home_card_layout),
          ),
        );
      });
  }, [queryClient, settingsQuery.data?.data.home_card_layout]);

  const visibility = settingsQuery.data?.data.home_card_visibility;
  const visibleLayout = useMemo(
    () => layout.filter((entry) => isHomeCardVisible(entry.id, visibility)),
    [layout, visibility],
  );

  return {
    layout: visibleLayout,
    moveCard,
    resizeCard,
    persistLayout,
  };
}
