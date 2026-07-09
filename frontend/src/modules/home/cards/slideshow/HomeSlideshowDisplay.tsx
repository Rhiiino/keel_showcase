// keel_web/src/modules/home/cards/slideshow/HomeSlideshowDisplay.tsx

// Home slideshow — one image visible; auto-rotate, wheel, and prev/next controls.

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { buildMediaContentUrl } from "../../../media/api";
import { MediaLightbox } from "../../../../components/MediaLightbox";
import { resolveHomeSlideshowIntervalSeconds } from "../../lib/slideshowInterval";
import { resolveInitialSlideshowIndex } from "./lib/homeSlideshowSettings";
import { HOME_CARD_IDS } from "../../../../app/modules/homeCardTypes";
import {
  useHomeCardCanvasInteraction,
  useHomeCardSlot,
} from "../layout/HomeCardCanvasContext";

const WHEEL_COOLDOWN_MS = 380;
const SLIDE_DURATION_MS = 280;
const VIEWPORT_HEIGHT_PX = 320;

export type HomeSlideshowSlide = {
  mediaId: string;
  updatedAt?: string | null;
  title?: string;
};

type HomeSlideshowDisplayProps = {
  slides: HomeSlideshowSlide[];
  intervalSeconds: number | null | undefined;
  paused: boolean;
  pausedMediaId?: string | null;
  onPausedChange: (paused: boolean, activeMediaId: string) => void;
  onPausedSlideChange?: (activeMediaId: string) => void;
  pauseDisabled?: boolean;
  onEdit?: () => void;
  editDisabled?: boolean;
};

function slideAtOffset(
  slides: HomeSlideshowSlide[],
  activeIndex: number,
  offset: number,
): HomeSlideshowSlide {
  const count = slides.length;
  if (count === 0) {
    return slides[0];
  }
  const index = (activeIndex + offset + count * 4) % count;
  return slides[index] ?? slides[0];
}

function SlideImage({ slide }: { slide: HomeSlideshowSlide }) {
  const src = buildMediaContentUrl(slide.mediaId, slide.updatedAt);
  const alt = slide.title?.trim() || "Slideshow image";

  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-contain"
      draggable={false}
    />
  );
}

function OverlayButton({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={[
        "absolute z-10 rounded-full border border-stone-700/80",
        "bg-stone-950/75 text-stone-200 shadow-lg backdrop-blur-sm",
        "pointer-events-none group-hover/slideshow:pointer-events-auto group-focus-within/slideshow:pointer-events-auto",
        "transition hover:bg-stone-900/90 disabled:cursor-not-allowed disabled:opacity-40",
        className,
      ].join(" ")}
      data-home-card-no-drag
    >
      {children}
    </button>
  );
}

function NavButton({
  label,
  onClick,
  disabled,
  className,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className: string;
}) {
  return (
    <OverlayButton label={label} onClick={onClick} disabled={disabled} className={className}>
      <span aria-hidden className="block px-2.5 py-2 text-lg leading-none">
        {label === "Previous slide" ? "‹" : "›"}
      </span>
    </OverlayButton>
  );
}

function PausePlayButton({
  paused,
  disabled,
  onClick,
}: {
  paused: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <OverlayButton
      label={paused ? "Play slideshow" : "Pause slideshow"}
      onClick={onClick}
      disabled={disabled}
      className="right-3 top-3"
    >
      <span aria-hidden className="block px-2 py-1.5 text-sm leading-none">
        {paused ? "▶" : "⏸"}
      </span>
    </OverlayButton>
  );
}

function EditSlideshowButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <OverlayButton
      label="Edit slideshow"
      onClick={onClick}
      disabled={disabled}
      className="left-3 top-3"
    >
      <span className="block px-2.5 py-1.5 text-xs font-medium leading-none">
        Edit
      </span>
    </OverlayButton>
  );
}

const hoverOverlayClass = [
  "pointer-events-none absolute inset-0 z-10 opacity-0",
  "transition-opacity duration-200",
  "group-hover/slideshow:opacity-100 group-focus-within/slideshow:opacity-100",
].join(" ");

export function HomeSlideshowDisplay({
  slides,
  intervalSeconds,
  paused,
  pausedMediaId = null,
  onPausedChange,
  onPausedSlideChange,
  pauseDisabled = false,
  onEdit,
  editDisabled = false,
}: HomeSlideshowDisplayProps) {
  const slot = useHomeCardSlot();
  const { interactingCardId } = useHomeCardCanvasInteraction();
  const navigationBlocked = interactingCardId === HOME_CARD_IDS.slideshow;

  const viewportRef = useRef<HTMLDivElement>(null);
  const wheelLockedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevSlideKeyRef = useRef("");
  const onPausedSlideChangeRef = useRef(onPausedSlideChange);
  const syncedPausedMediaIdRef = useRef(pausedMediaId ?? null);
  onPausedSlideChangeRef.current = onPausedSlideChange;

  const slideKey = slides.map((slide) => slide.mediaId).join("|");
  const slideMediaIds = useMemo(
    () => slides.map((slide) => slide.mediaId),
    [slideKey],
  );

  const [activeIndex, setActiveIndex] = useState(() =>
    resolveInitialSlideshowIndex(slideMediaIds, paused, pausedMediaId),
  );
  const [dragOffset, setDragOffset] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lightboxSlide, setLightboxSlide] = useState<HomeSlideshowSlide | null>(
    null,
  );

  const resolvedSeconds = resolveHomeSlideshowIntervalSeconds(intervalSeconds);

  useEffect(() => {
    setDragOffset(0);
    const slideListChanged = prevSlideKeyRef.current !== slideKey;
    prevSlideKeyRef.current = slideKey;

    if (slideListChanged) {
      setActiveIndex(
        resolveInitialSlideshowIndex(slideMediaIds, paused, pausedMediaId),
      );
    }
  }, [slideKey, paused, pausedMediaId, slideMediaIds]);

  useEffect(() => {
    syncedPausedMediaIdRef.current = pausedMediaId ?? null;
  }, [pausedMediaId]);

  useEffect(() => {
    if (!paused) {
      return;
    }
    const mediaId = slides[activeIndex]?.mediaId;
    if (!mediaId || mediaId === syncedPausedMediaIdRef.current) {
      return;
    }
    syncedPausedMediaIdRef.current = mediaId;
    onPausedSlideChangeRef.current?.(mediaId);
  }, [activeIndex, paused, slides]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return undefined;
    }
    const updateWidth = () => setViewportWidth(viewport.clientWidth);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const completeSlideRef = useRef<(delta: 1 | -1) => void>(() => {});

  const completeSlide = useCallback(
    (delta: 1 | -1) => {
      if (slides.length <= 1 || isAnimating) {
        return;
      }

      setIsAnimating(true);
      const width = viewportRef.current?.clientWidth ?? viewportWidth;
      const target = -delta * width;
      setDragOffset(target);

      window.setTimeout(() => {
        setActiveIndex(
          (current) => (current + delta + slides.length) % slides.length,
        );
        setDragOffset(0);
        setIsAnimating(false);
      }, SLIDE_DURATION_MS);
    },
    [isAnimating, slides, viewportWidth],
  );

  completeSlideRef.current = completeSlide;

  const startTimer = useCallback(() => {
    clearTimer();
    if (slides.length <= 1 || paused || navigationBlocked) {
      return;
    }
    timerRef.current = window.setInterval(() => {
      completeSlideRef.current(1);
    }, resolvedSeconds * 1000);
  }, [clearTimer, navigationBlocked, paused, slides.length, resolvedSeconds]);

  useEffect(() => {
    if (navigationBlocked) {
      clearTimer();
      return undefined;
    }
    if (!isAnimating && !paused) {
      startTimer();
    } else if (paused) {
      clearTimer();
    }
    return clearTimer;
  }, [startTimer, clearTimer, isAnimating, activeIndex, paused, navigationBlocked]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return undefined;
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (
        wheelLockedRef.current
        || slides.length <= 1
        || isAnimating
        || navigationBlocked
      ) {
        return;
      }
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
      if (Math.abs(delta) < 4) {
        return;
      }

      wheelLockedRef.current = true;
      window.setTimeout(() => {
        wheelLockedRef.current = false;
      }, WHEEL_COOLDOWN_MS);

      clearTimer();
      completeSlide(delta > 0 ? 1 : -1);
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [clearTimer, completeSlide, isAnimating, navigationBlocked, slides.length]);

  const current = slideAtOffset(slides, activeIndex, 0);
  const previous = slideAtOffset(slides, activeIndex, -1);
  const next = slideAtOffset(slides, activeIndex, 1);
  const transitionClass = isAnimating
    ? "transition-transform duration-[280ms] ease-out"
    : "";

  const openLightbox = (slide: HomeSlideshowSlide) => {
    setLightboxSlide(slide);
  };

  return (
    <>
      <div
        className={[
          "group/slideshow relative overflow-hidden rounded-xl border border-stone-800/90",
          "bg-gradient-to-br from-stone-900/70 via-stone-950/50 to-stone-900/30",
          "shadow-lg shadow-black/20",
          slot?.fillSlot ? "flex min-h-0 flex-1 flex-col" : "",
        ].join(" ")}
      >
        <div
          ref={viewportRef}
          className={[
            "relative overflow-hidden select-none bg-stone-950/60",
            slot?.fillSlot ? "min-h-0 flex-1" : "",
          ].join(" ")}
          style={slot?.fillSlot ? undefined : { height: VIEWPORT_HEIGHT_PX }}
        >
          {slides.length > 1 ? (
            <div className={`relative h-full ${transitionClass}`}>
              <div
                className="absolute inset-y-0 left-0 w-full"
                style={{
                  transform: `translateX(${dragOffset - viewportWidth}px)`,
                }}
              >
                <button
                  type="button"
                  className="h-full w-full cursor-zoom-in"
                  onClick={() => openLightbox(previous)}
                >
                  <SlideImage slide={previous} />
                </button>
              </div>
              <div
                className="absolute inset-y-0 left-0 w-full"
                style={{ transform: `translateX(${dragOffset}px)` }}
              >
                <button
                  type="button"
                  className="h-full w-full cursor-zoom-in"
                  onClick={() => openLightbox(current)}
                >
                  <SlideImage slide={current} />
                </button>
              </div>
              <div
                className="absolute inset-y-0 left-0 w-full"
                style={{
                  transform: `translateX(${dragOffset + viewportWidth}px)`,
                }}
              >
                <button
                  type="button"
                  className="h-full w-full cursor-zoom-in"
                  onClick={() => openLightbox(next)}
                >
                  <SlideImage slide={next} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="h-full w-full cursor-zoom-in"
              onClick={() => openLightbox(current)}
            >
              <SlideImage slide={current} />
            </button>
          )}

          {onEdit || slides.length > 1 ? (
            <div className={hoverOverlayClass}>
              <p className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-stone-950/70 px-2.5 py-1 text-xs font-semibold text-stone-200 backdrop-blur-sm">
                Slideshow
              </p>
              {onEdit ? (
                <EditSlideshowButton
                  disabled={editDisabled}
                  onClick={onEdit}
                />
              ) : null}
              {slides.length > 1 ? (
                <>
                  <NavButton
                    label="Previous slide"
                    className="left-3 top-1/2 -translate-y-1/2"
                    disabled={isAnimating}
                    onClick={() => {
                      clearTimer();
                      completeSlide(-1);
                    }}
                  />
                  <NavButton
                    label="Next slide"
                    className="right-3 top-1/2 -translate-y-1/2"
                    disabled={isAnimating}
                    onClick={() => {
                      clearTimer();
                      completeSlide(1);
                    }}
                  />
                  <PausePlayButton
                    paused={paused}
                    disabled={pauseDisabled || isAnimating}
                    onClick={() => onPausedChange(!paused, current.mediaId)}
                  />
                  <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-stone-950/70 px-2.5 py-1 text-xs text-stone-400 backdrop-blur-sm">
                    {activeIndex + 1} / {slides.length}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {lightboxSlide ? (
        <MediaLightbox
          kind="image"
          src={buildMediaContentUrl(
            lightboxSlide.mediaId,
            lightboxSlide.updatedAt,
          )}
          title={lightboxSlide.title?.trim() || "Slideshow image"}
          onClose={() => setLightboxSlide(null)}
        />
      ) : null}
    </>
  );
}
