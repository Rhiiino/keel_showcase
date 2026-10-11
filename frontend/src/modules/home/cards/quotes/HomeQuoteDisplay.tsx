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
const SLIDE_DURATION_MS = 280;

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
      className="flex w-full flex-col justify-center px-5"
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
  const wheelLockedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(MIN_QUOTE_VIEWPORT_HEIGHT_PX);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const resolvedSeconds = resolveHomeQuoteIntervalSeconds(intervalSeconds);
  const accentBorder = quoteAccentBorderClass(accentIndex);

  const measureViewport = useCallback(() => {
    const root = measureRef.current;
    if (!root) {
      return;
    }
    const panels = root.querySelectorAll<HTMLElement>("[data-quote-measure-panel]");
    const heights = Array.from(panels).map((panel) => panel.offsetHeight);
    setViewportHeight(resolveQuoteViewportHeight(heights));
  }, []);

  useLayoutEffect(() => {
    setActiveIndex(0);
    setDragOffset(0);
    measureViewport();
  }, [quotes, measureViewport]);

  useEffect(() => {
    const node = measureRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return undefined;
    }
    const observer = new ResizeObserver(() => measureViewport());
    observer.observe(node);
    return () => observer.disconnect();
  }, [measureViewport]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const completeSlideRef = useRef<(delta: 1 | -1) => void>(() => {});

  const completeSlide = useCallback(
    (delta: 1 | -1) => {
      if (quotes.length <= 1 || isAnimating) {
        return;
      }

      setIsAnimating(true);
      const target = -delta * viewportHeight;
      setDragOffset(target);

      window.setTimeout(() => {
        setActiveIndex((current) => (current + delta + quotes.length) % quotes.length);
        setDragOffset(0);
        setIsAnimating(false);
      }, SLIDE_DURATION_MS);
    },
    [isAnimating, quotes.length, viewportHeight],
  );

  completeSlideRef.current = completeSlide;

  const startTimer = useCallback(() => {
    clearTimer();
    if (quotes.length <= 1) {
      return;
    }
    timerRef.current = window.setInterval(() => {
      completeSlideRef.current(1);
    }, resolvedSeconds * 1000);
  }, [clearTimer, quotes.length, resolvedSeconds]);

  useEffect(() => {
    if (!isAnimating) {
      startTimer();
    }
    return clearTimer;
  }, [startTimer, clearTimer, isAnimating, activeIndex, viewportHeight]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return undefined;
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (wheelLockedRef.current || quotes.length <= 1 || isAnimating) {
        return;
      }
      if (Math.abs(event.deltaY) < 4) {
        return;
      }

      wheelLockedRef.current = true;
      window.setTimeout(() => {
        wheelLockedRef.current = false;
      }, WHEEL_COOLDOWN_MS);

      clearTimer();
      completeSlide(event.deltaY > 0 ? 1 : -1);
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [clearTimer, completeSlide, isAnimating, quotes.length]);

  const current = quoteAtOffset(quotes, activeIndex, 0);
  const previous = quoteAtOffset(quotes, activeIndex, -1);
  const next = quoteAtOffset(quotes, activeIndex, 1);
  const transitionClass = isAnimating
    ? "transition-transform duration-[280ms] ease-out"
    : "";

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
            <div className={`relative h-full ${transitionClass}`}>
              <div
                className="absolute inset-x-0 top-0"
                style={{ transform: `translateY(${dragOffset - viewportHeight}px)` }}
              >
                <QuotePanel quote={previous} viewportHeight={viewportHeight} />
              </div>
              <div
                className="absolute inset-x-0 top-0"
                style={{ transform: `translateY(${dragOffset}px)` }}
              >
                <QuotePanel quote={current} viewportHeight={viewportHeight} />
              </div>
              <div
                className="absolute inset-x-0 top-0"
                style={{ transform: `translateY(${dragOffset + viewportHeight}px)` }}
              >
                <QuotePanel quote={next} viewportHeight={viewportHeight} />
              </div>
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
