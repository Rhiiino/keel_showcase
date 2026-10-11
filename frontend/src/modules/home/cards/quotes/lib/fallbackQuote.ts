// keel_web/src/modules/home/cards/quotes/lib/fallbackQuote.ts

// Offline-safe quote bank when GET /home/quotes is empty or unavailable.

import type { Quote } from "../../../api";

/** Multi-quote fallback so the rotator still advances when the API bank is missing. */
export const FALLBACK_QUOTES: Quote[] = [
  {
    id: -1,
    text: "I have no special talent. I'm only passionately curious.",
    author: "Albert Einstein",
  },
  {
    id: -2,
    text: "The only true wisdom is in knowing you know nothing.",
    author: "Socrates",
  },
  {
    id: -3,
    text: "Success is the sum of small efforts repeated day in and day out.",
    author: "Robert Collier",
  },
  {
    id: -4,
    text: "Discipline is choosing between what you want now and what you want most.",
    author: "Abraham Lincoln",
  },
  {
    id: -5,
    text: "Action is the foundational key to all success.",
    author: "Pablo Picasso",
  },
  {
    id: -6,
    text: "You do not rise to the level of your goals. You fall to the level of your systems.",
    author: "James Clear",
  },
  {
    id: -7,
    text: "The future depends on what you do today.",
    author: "Mahatma Gandhi",
  },
  {
    id: -8,
    text: "Done is better than perfect.",
    author: "Sheryl Sandberg",
  },
  {
    id: -9,
    text: "Simplicity is the ultimate sophistication.",
    author: "Leonardo da Vinci",
  },
  {
    id: -10,
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Will Durant",
  },
  {
    id: -11,
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
  },
  {
    id: -12,
    text: "You miss one hundred percent of the shots you do not take.",
    author: "Wayne Gretzky",
  },
  {
    id: -13,
    text: "Stay hungry, stay foolish.",
    author: "Steve Jobs",
  },
  {
    id: -14,
    text: "It always seems impossible until it is done.",
    author: "Nelson Mandela",
  },
  {
    id: -15,
    text: "Fall seven times and stand up eight.",
    author: "Japanese Proverb",
  },
];

/** @deprecated Prefer FALLBACK_QUOTES — kept for any single-quote call sites. */
export const FALLBACK_QUOTE: Quote = FALLBACK_QUOTES[0];
