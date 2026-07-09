// keel_web/src/modules/home/cards/slideshow/HomeSlideshowCard.tsx

// Curated media slideshow card for the home dashboard.

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchMediaMetadata, mediaQueryKeys } from "../../../media/api";
import {
  fetchSettings,
  patchSettings,
  settingsKeys,
  type UserSettingsPublic,
} from "../../../settings/api";
import { HOME_CONTENT_WIDTH_CLASS } from "../layout/constants";
import { useHomeCardSlot } from "../layout/HomeCardCanvasContext";
import { HomeSlideshowDisplay } from "./HomeSlideshowDisplay";
import { HomeSlideshowEditor } from "./HomeSlideshowEditor";
import {
  buildHomeSlideshowPatch,
  buildHomeSlideshowPausePatch,
  parseHomeSlideshowSettings,
} from "./lib/homeSlideshowSettings";

const SLIDESHOW_VIEWPORT_HEIGHT_PX = 320;
const PAUSED_SLIDE_SAVE_DEBOUNCE_MS = 300;

const hoverOverlayClass = [
  "pointer-events-none absolute inset-0 z-10 opacity-0",
  "transition-opacity duration-200",
  "group-hover/slideshow:opacity-100 group-focus-within/slideshow:opacity-100",
].join(" ");

export function HomeSlideshowCard() {
  const slot = useHomeCardSlot();
  const sectionClass = slot?.fillSlot
    ? "flex h-full min-h-0 w-full flex-col"
    : `mt-8 ${HOME_CONTENT_WIDTH_CLASS}`;

  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const latestPausedMediaIdRef = useRef<string | null>(null);
  const pauseSlideSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const settingsQuery = useQuery({
    queryKey: settingsKeys.root(),
    queryFn: fetchSettings,
  });

  const prefs = parseHomeSlideshowSettings(
    settingsQuery.data?.data.home_slideshow,
  );

  useEffect(() => {
    latestPausedMediaIdRef.current = prefs.pausedMediaId;
  }, [prefs.pausedMediaId]);

  useEffect(
    () => () => {
      if (pauseSlideSaveTimerRef.current !== null) {
        window.clearTimeout(pauseSlideSaveTimerRef.current);
      }
    },
    [],
  );

  const metadataQueries = useQueries({
    queries: prefs.mediaIds.map((mediaId) => ({
      queryKey: mediaQueryKeys.detail(mediaId),
      queryFn: () => fetchMediaMetadata(mediaId),
      staleTime: 60_000,
      retry: false,
    })),
  });

  const slides = useMemo(
    () =>
      prefs.mediaIds.flatMap((mediaId, index) => {
        const metadata = metadataQueries[index]?.data;
        if (metadataQueries[index]?.isError) {
          return [];
        }
        return [
          {
            mediaId,
            updatedAt: metadata?.updated_at ?? null,
            title: metadata?.original_filename,
          },
        ];
      }),
    [metadataQueries, prefs.mediaIds],
  );

  const saveMutation = useMutation({
    mutationFn: (payload: {
      mediaIds: string[];
      intervalSeconds: number;
      paused: boolean;
      pausedMediaId: string | null;
    }) =>
      patchSettings({
        home_slideshow: buildHomeSlideshowPatch(
          payload.mediaIds,
          payload.intervalSeconds,
          payload.paused,
          payload.pausedMediaId,
        ),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(settingsKeys.root(), updated);
      setIsEditing(false);
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (payload: { paused: boolean; pausedMediaId: string | null }) =>
      patchSettings({
        home_slideshow: buildHomeSlideshowPausePatch(
          payload.paused,
          payload.pausedMediaId,
        ),
      }),
    onSuccess: (updated, variables) => {
      if (
        variables.pausedMediaId != null
        && variables.pausedMediaId !== latestPausedMediaIdRef.current
      ) {
        return;
      }
      queryClient.setQueryData(settingsKeys.root(), updated);
    },
  });

  const optimisticallySetPausedMediaId = useCallback(
    (activeMediaId: string) => {
      queryClient.setQueryData(
        settingsKeys.root(),
        (current: UserSettingsPublic | undefined) => {
          if (!current?.data) {
            return current;
          }
          return {
            ...current,
            data: {
              ...current.data,
              home_slideshow: {
                ...current.data.home_slideshow,
                paused: true,
                paused_media_id: activeMediaId,
              },
            },
          };
        },
      );
    },
    [queryClient],
  );

  const flushPendingPausedSlideSave = useCallback(() => {
    if (pauseSlideSaveTimerRef.current !== null) {
      window.clearTimeout(pauseSlideSaveTimerRef.current);
      pauseSlideSaveTimerRef.current = null;
    }
  }, []);

  const schedulePausedSlideSave = useCallback(
    (activeMediaId: string) => {
      latestPausedMediaIdRef.current = activeMediaId;
      optimisticallySetPausedMediaId(activeMediaId);
      flushPendingPausedSlideSave();
      pauseSlideSaveTimerRef.current = window.setTimeout(() => {
        pauseSlideSaveTimerRef.current = null;
        const mediaId = latestPausedMediaIdRef.current;
        if (!mediaId) {
          return;
        }
        pauseMutation.mutate({ paused: true, pausedMediaId: mediaId });
      }, PAUSED_SLIDE_SAVE_DEBOUNCE_MS);
    },
    [flushPendingPausedSlideSave, optimisticallySetPausedMediaId, pauseMutation],
  );

  const handlePausedChange = useCallback(
    (nextPaused: boolean, activeMediaId: string) => {
      flushPendingPausedSlideSave();
      if (nextPaused) {
        latestPausedMediaIdRef.current = activeMediaId;
        optimisticallySetPausedMediaId(activeMediaId);
      } else {
        latestPausedMediaIdRef.current = null;
      }
      pauseMutation.mutate({
        paused: nextPaused,
        pausedMediaId: nextPaused ? activeMediaId : null,
      });
    },
    [flushPendingPausedSlideSave, optimisticallySetPausedMediaId, pauseMutation],
  );

  const handlePausedSlideChange = useCallback(
    (activeMediaId: string) => {
      if (!prefs.paused || activeMediaId === latestPausedMediaIdRef.current) {
        return;
      }
      schedulePausedSlideSave(activeMediaId);
    },
    [prefs.paused, schedulePausedSlideSave],
  );

  const isBusy =
    saveMutation.isPending ||
    pauseMutation.isPending ||
    settingsQuery.isLoading ||
    settingsQuery.isFetching;

  const openEditor = () => setIsEditing(true);

  if (isEditing) {
    return (
      <section className={sectionClass}>
        <HomeSlideshowEditor
          mediaIds={prefs.mediaIds}
          intervalSeconds={prefs.intervalSeconds}
          disabled={isBusy}
          isSaving={saveMutation.isPending}
          onCancel={() => setIsEditing(false)}
          onSave={(mediaIds, intervalSeconds) =>
            saveMutation.mutate({
              mediaIds,
              intervalSeconds,
              paused: prefs.paused,
              pausedMediaId:
                prefs.paused && prefs.pausedMediaId
                && mediaIds.includes(prefs.pausedMediaId)
                  ? prefs.pausedMediaId
                  : null,
            })
          }
        />
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className={sectionClass}>
        <div
          className={[
            "group/slideshow relative overflow-hidden rounded-xl border border-dashed",
            "border-stone-800 bg-stone-950/30 shadow-lg shadow-black/10",
            slot?.fillSlot ? "min-h-0 flex-1" : "",
          ].join(" ")}
          style={{ height: slot?.fillSlot ? undefined : SLIDESHOW_VIEWPORT_HEIGHT_PX }}
        >
          <div className="flex h-full items-center justify-center px-6">
            <p className="text-center text-sm text-stone-400">
              Add curated images from Media to display here one at a time.
            </p>
          </div>
          <div className={hoverOverlayClass}>
            <p className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-stone-950/70 px-2.5 py-1 text-xs font-semibold text-stone-200 backdrop-blur-sm">
              Slideshow
            </p>
            <button
              type="button"
              aria-label="Edit slideshow"
              disabled={isBusy}
              onClick={openEditor}
              data-home-card-no-drag
              className={[
                "pointer-events-none absolute left-3 top-3 z-10 rounded-full border border-stone-700/80",
                "bg-stone-950/75 px-2.5 py-1.5 text-xs font-medium text-stone-200 shadow-lg backdrop-blur-sm",
                "group-hover/slideshow:pointer-events-auto group-focus-within/slideshow:pointer-events-auto",
                "transition hover:bg-stone-900/90 disabled:cursor-not-allowed disabled:opacity-40",
              ].join(" ")}
            >
              Edit
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={sectionClass}>
      <div className={slot?.fillSlot ? "flex min-h-0 flex-1 flex-col" : undefined}>
        <HomeSlideshowDisplay
        slides={slides}
        intervalSeconds={prefs.intervalSeconds}
        paused={prefs.paused}
        pausedMediaId={prefs.pausedMediaId}
        pauseDisabled={pauseMutation.isPending}
        onPausedChange={handlePausedChange}
        onPausedSlideChange={handlePausedSlideChange}
        onEdit={openEditor}
        editDisabled={isBusy}
        />
      </div>
    </section>
  );
}
