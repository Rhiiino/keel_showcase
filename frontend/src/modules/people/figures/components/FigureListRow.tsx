// keel_web/src/modules/people/figures/components/FigureListRow.tsx

import { Link } from "react-router-dom";

import { formatFigureName, type Figure } from "../api";
import { formatFigureBirthDate } from "../lib/figuresListSort";
import { FigureAvatar } from "./FigureAvatar";

export const FIGURE_LIST_TABLE_WIDTH_CLASS = "w-full min-w-[40rem]";

export const FIGURE_LIST_GRID_CLASS =
  "grid w-full grid-cols-[4.5rem_minmax(0,1fr)_7rem_2.5rem] items-center";

type FigureListRowProps = {
  figure: Figure;
};

export function FigureListRow({ figure }: FigureListRowProps) {
  return (
    <Link
      to={`/people/figures/${figure.id}`}
      className={[
        "relative grid w-full border-b border-stone-800/80 transition last:border-b-0 hover:bg-stone-900/40",
        FIGURE_LIST_GRID_CLASS,
      ].join(" ")}
    >
      <div className="flex items-center px-4 py-3.5">
        <FigureAvatar figure={figure} className="h-10 w-10 ring-1 ring-white/[0.08]" />
      </div>

      <div className="min-w-0 px-4 py-3.5">
        <p className="truncate text-sm font-medium text-stone-100">{formatFigureName(figure)}</p>
      </div>

      <div className="px-4 py-3.5 text-right text-sm text-stone-400">
        {formatFigureBirthDate(figure)}
      </div>

      <div className="flex items-center justify-center px-2 py-3.5 text-stone-500">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 0 1 .02-1.06L10.94 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-.02Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </Link>
  );
}
