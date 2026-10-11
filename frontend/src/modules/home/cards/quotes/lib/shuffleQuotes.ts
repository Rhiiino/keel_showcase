// keel_web/src/modules/home/cards/quotes/lib/shuffleQuotes.ts

// Fisher–Yates shuffle for randomizing the home quote rotator order.

export function shuffleQuotes<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const left = next[i]!;
    next[i] = next[j]!;
    next[j] = left;
  }
  return next;
}
