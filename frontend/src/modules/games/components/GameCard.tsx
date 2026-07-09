// keel_web/src/modules/games/components/GameCard.tsx

import { Link } from "react-router-dom";

import {
  FOCUS_LIST_CARD_GLASS_CLASS,
  FOCUS_LIST_CARD_GLASS_HOVER_CLASS,
  focusListCardTintStyle,
} from "../../focus/lib/appearance";
import { gamePlayPath } from "../api";
import type { GameDefinition } from "../gameRegistry";

const TOWER_OF_HANOI_TINT = "#38BDF8";

type GameCardProps = {
  game: GameDefinition;
};

export function GameCard({ game }: GameCardProps) {
  const tintStyle = focusListCardTintStyle(TOWER_OF_HANOI_TINT);

  return (
    <Link
      to={gamePlayPath(game.key)}
      className="group relative block w-full select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
    >
      <article
        className={[
          "relative overflow-hidden",
          FOCUS_LIST_CARD_GLASS_CLASS,
          FOCUS_LIST_CARD_GLASS_HOVER_CLASS,
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          {tintStyle ? (
            <div aria-hidden className="absolute inset-0 rounded-2xl" style={tintStyle} />
          ) : null}
        </div>

        <div className="relative z-10 flex flex-col p-4">
          <div
            className={[
              "relative flex w-full aspect-[3/2] shrink-0 items-center justify-center overflow-hidden rounded-xl",
              "border border-white/10 bg-black/25",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
            ].join(" ")}
          >
            <TowerPreview />
          </div>

          <h2 className="mt-4 text-base font-semibold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] group-hover:text-white">
            {game.title}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-white/45">{game.description}</p>
        </div>
      </article>
    </Link>
  );
}

function TowerPreview() {
  return (
    <svg viewBox="0 0 140 96" className="h-full w-full p-3" aria-hidden>
      <defs>
        <linearGradient id="toh-shaft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="45%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="toh-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="55%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <filter id="toh-disk-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#000" floodOpacity="0.45" />
        </filter>
      </defs>

      <ellipse cx="70" cy="86" rx="52" ry="6" fill="#0ea5e9" opacity="0.12" />

      {[30, 70, 110].map((x) => (
        <g key={x}>
          <rect x={x - 2.5} y="18" width="5" height="58" rx="2.5" fill="url(#toh-shaft)" />
          <ellipse cx={x} cy="17" rx="4" ry="2.2" fill="#cbd5e1" />
        </g>
      ))}

      {[30, 70, 110].map((x) => (
        <rect
          key={`base-${x}`}
          x={x - 22}
          y="74"
          width="44"
          height="7"
          rx="2"
          fill="url(#toh-base)"
        />
      ))}

      <g filter="url(#toh-disk-shadow)">
        <rect x="12" y="64" width="36" height="9" rx="3" fill="#38bdf8" />
        <rect x="16" y="53" width="28" height="9" rx="3" fill="#a3e635" />
        <rect x="20" y="42" width="20" height="9" rx="3" fill="#e879f9" />
      </g>

      <rect x="14" y="65.5" width="32" height="1.2" rx="0.6" fill="#fff" opacity="0.28" />
      <rect x="18" y="54.5" width="24" height="1.2" rx="0.6" fill="#fff" opacity="0.28" />
      <rect x="22" y="43.5" width="16" height="1.2" rx="0.6" fill="#fff" opacity="0.28" />
    </svg>
  );
}
