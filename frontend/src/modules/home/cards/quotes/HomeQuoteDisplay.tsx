// keel_web/src/modules/home/cards/quotes/HomeQuoteDisplay.tsx

// Vertical quote carousel — one quote visible, centered; mouse wheel to advance.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { Quote } from "../../api";
import { resolveHomeQuoteIntervalSeconds } from "../../lib/quoteInterval";
import { HOME_CONTENT_WIDTH_CLASS } from "../layout/constants";
import {
  MIN_QUOTE_VIEWPORT_HEIGHT_PX,
  resolveQuoteViewportHeight,
} from "./lib/quoteViewport";

const ACCENT_BORDER_CLASSES = [
  "border-l-amber-400/80",
  "border-l-sky-400/80",
  "border-l-violet-400/80",
  "border-l-emerald-400/80",
  "border-l-rose-400/80",
] as const;

export function quoteAccentBorderClass(accentIndex = 0): string {
  return ACCENT_BORDER_CLASSES[accentIndex % ACCENT_BORDER_CLASSES.length];
}

const WHEEL_COOLDOWN_MS = 380;
const SLIDE_DURATION_MS = 420;

type HomeQuoteDisplayProps = {
  quotes: Quote[];
  intervalSeconds: number | null | undefined;
  accentIndex?: number;
  onEdit?: () => void;
  editDisabled?: boolean;
};

function quoteAtOffset(quotes: Quote[], activeIndex: number, offset: number): Quote {
  const count = quotes.length;
  if (count === 0) {
    return quotes[0];
  }
  const index = (activeIndex + offset + count * 4) % count;
  return quotes[index] ?? quotes[0];
}

function QuotePanelBody({ quote }: { quote: Quote }) {
  return (
    <>
      <p className="text-base leading-relaxed text-stone-200 sm:text-lg">{quote.text}</p>
      <footer className="mt-3 text-sm text-stone-500">
        &mdash; <span className="italic text-stone-400">{quote.author}</span>
      </footer>
    </>
  );
}

function QuotePanel({
  quote,
  viewportHeight,
}: {
  quote: Quote;
  viewportHeight: number;
}) {
  return (
    <div
      className="flex w-full shrink-0 flex-col justify-center px-5"
      style={{ height: viewportHeight }}
    >
      <QuotePanelBody quote={quote} />
    </div>
  );
}

const hoverOverlayClass = [
  "pointer-events-none absolute inset-0 z-10 opacity-0",
  "transition-opacity duration-200",
  "group-hover/quote:opacity-100 group-focus-within/quote:opacity-100",
].join(" ");

function EditQuoteButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Edit quote display time"
      disabled={disabled}
      onClick={onClick}
      className={[
        "absolute right-3 bottom-3 z-10 rounded-full border border-stone-700/80",
        "bg-stone-950/75 px-2.5 py-1.5 text-xs font-medium text-stone-200 shadow-lg backdrop-blur-sm",
        "pointer-events-none group-hover/quote:pointer-events-auto group-focus-within/quote:pointer-events-auto",
        "transition hover:bg-stone-900/90 disabled:cursor-not-allowed disabled:opacity-40",
      ].join(" ")}
      data-home-card-no-drag
    >
      Edit
    </button>
  );
}

export function HomeQuoteDisplay({
  quotes,
  intervalSeconds,
  accentIndex = 0,
  onEdit,
  editDisabled = false,
}: HomeQuoteDisplayProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const wheelLockedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);
  const viewportHeightRef = useRef(MIN_QUOTE_VIEWPORT_HEIGHT_PX);
  const quotesLengthRef = useRef(quotes.length);

  const [activeIndex, setActiveIndex] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(MIN_QUOTE_VIEWPORT_HEIGHT_PX);
  // Track rests at -viewportHeight so the middle (current) panel is visible.
  const [trackOffset, setTrackOffset] = useState(-MIN_QUOTE_VIEWPORT_HEIGHT_PX);
  const [transitionEnabled, setTransitionEnabled] = useState(false);

  const quotesIdentity = quotes.map((quote) => quote.id).join("\0");
  const resolvedSeconds = resolveHomeQuoteIntervalSeconds(intervalSeconds);
  const accentBorder = quoteAccentBorderClass(accentIndex);

  quotesLengthRef.current = quotes.length;
  viewportHeightRef.current = viewportHeight;

  const measureViewport = useCallback(() => {
    const root = measureRef.current;
    if (!root) {
      return;
    }
    const panels = root.querySelectorAll<HTMLElement>("[data-quote-measure-panel]");
    const heights = Array.from(panels).map((panel) => panel.offsetHeight);
    const nextHeight = resolveQuoteViewportHeight(heights);
    setViewportHeight((current) => {
      if (current === nextHeight) {
        return current;
      }
      return nextHeight;
    });
  }, []);

  const clearSlideTimeout = useCallback(() => {
    if (slideTimeoutRef.current !== null) {
      window.clearTimeout(slideTimeoutRef.current);
      slideTimeoutRef.current = null;
    }
  }, []);

  const clearRaf = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Keep the resting offset aligned when the viewport height is measured/updated.
  useLayoutEffect(() => {
    if (isAnimatingRef.current) {
      return;
    }
    setTrackOffset(-viewportHeight);
  }, [viewportHeight]);

  useLayoutEffect(() => {
    clearSlideTimeout();
    clearRaf();
    isAnimatingRef.current = false;
    setTransitionEnabled(false);
    setActiveIndex(0);
    setTrackOffset(-viewportHeightRef.current);
    measureViewport();
  }, [quotesIdentity, measureViewport, clearSlideTimeout, clearRaf]);

  useEffect(() => {
    const node = measureRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return undefined;
    }
    const observer = new ResizeObserver(() => measureViewport());
    observer.observe(node);
    return () => observer.disconnect();
  }, [measureViewport]);

  const completeSlideRef = useRef<(delta: 1 | -1) => void>(() => {});

  const completeSlide = useCallback(
    (delta: 1 | -1) => {
      const count = quotesLengthRef.current;
      const height = viewportHeightRef.current;
      if (count <= 1 || isAnimatingRef.current || height <= 0) {
        return;
      }

      isAnimatingRef.current = true;
      clearSlideTimeout();
      clearRaf();

      // Ensure we start from rest with transitions off, then animate on the next frames.
      setTransitionEnabled(false);
      setTrackOffset(-height);

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = window.requestAnimationFrame(() => {
          rafRef.current = null;
          setTransitionEnabled(true);
          // delta 1 (next): slide track up so the lower panel enters.
          // delta -1 (prev): slide track down so the upper panel enters.
          setTrackOffset(delta === 1 ? -2 * height : 0);

          slideTimeoutRef.current = window.setTimeout(() => {
            slideTimeoutRef.current = null;
            setTransitionEnabled(false);
            setActiveIndex((current) => (current + delta + count) % count);
            setTrackOffset(-height);
            isAnimatingRef.current = false;
          }, SLIDE_DURATION_MS);
        });
      });
    },
    [clearSlideTimeout, clearRaf],
  );

  completeSlideRef.current = completeSlide;

  useEffect(() => {
    clearTimer();
    if (quotes.length <= 1) {
      return clearTimer;
    }

    timerRef.current = window.setInterval(() => {
      completeSlideRef.current(1);
    }, resolvedSeconds * 1000);

    return clearTimer;
  }, [clearTimer, quotes.length, quotesIdentity, resolvedSeconds]);

  useEffect(
    () => () => {
      clearTimer();
      clearSlideTimeout();
      clearRaf();
    },
    [clearTimer, clearSlideTimeout, clearRaf],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return undefined;
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (wheelLockedRef.current || quotesLengthRef.current <= 1 || isAnimatingRef.current) {
        return;
      }
      if (Math.abs(event.deltaY) < 4) {
        return;
      }

      wheelLockedRef.current = true;
      window.setTimeout(() => {
        wheelLockedRef.current = false;
      }, WHEEL_COOLDOWN_MS);

      completeSlideRef.current(event.deltaY > 0 ? 1 : -1);
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [quotesIdentity]);

  const current = quoteAtOffset(quotes, activeIndex, 0);
  const previous = quoteAtOffset(quotes, activeIndex, -1);
  const next = quoteAtOffset(quotes, activeIndex, 1);

  return (
    <div className={`mt-8 ${HOME_CONTENT_WIDTH_CLASS}`}>
      <div
        ref={measureRef}
        className={`pointer-events-none fixed -left-[9999px] top-0 w-full ${HOME_CONTENT_WIDTH_CLASS} opacity-0`}
        aria-hidden
      >
        {quotes.map((quote) => (
          <div key={quote.id} data-quote-measure-panel className="px-5">
            <QuotePanelBody quote={quote} />
          </div>
        ))}
      </div>

      <div
        className={[
          "group/quote relative overflow-hidden rounded-xl border border-stone-800/90",
          "border-l-4 bg-gradient-to-br from-stone-900/70 via-stone-950/50 to-stone-900/30",
          "shadow-lg shadow-black/20",
          accentBorder,
        ].join(" ")}
      >
        <div
          ref={viewportRef}
          className="relative overflow-hidden select-none"
          style={{ height: viewportHeight }}
        >
          {quotes.length > 1 ? (
            <div
              ref={trackRef}
              className="flex flex-col will-change-transform"
              style={{
                transform: `translate3d(0, ${trackOffset}px, 0)`,
                transition: transitionEnabled
                  ? `transform ${SLIDE_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
                  : "none",
              }}
            >
              <QuotePanel quote={previous} viewportHeight={viewportHeight} />
              <QuotePanel quote={current} viewportHeight={viewportHeight} />
              <QuotePanel quote={next} viewportHeight={viewportHeight} />
            </div>
          ) : (
            <QuotePanel quote={current} viewportHeight={viewportHeight} />
          )}

          {onEdit ? (
            <div className={hoverOverlayClass}>
              <EditQuoteButton disabled={editDisabled} onClick={onEdit} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
