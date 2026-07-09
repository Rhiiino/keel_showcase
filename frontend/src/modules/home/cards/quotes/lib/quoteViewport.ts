// keel_web/src/modules/home/cards/quotes/lib/quoteViewport.ts

// Shared viewport sizing for the home quote carousel.

export const MIN_QUOTE_VIEWPORT_HEIGHT_PX = 140;

export function resolveQuoteViewportHeight(measuredHeights: number[]): number {
  const tallest = measuredHeights.reduce((max, height) => Math.max(max, height), 0);
  return Math.max(MIN_QUOTE_VIEWPORT_HEIGHT_PX, tallest);
}
