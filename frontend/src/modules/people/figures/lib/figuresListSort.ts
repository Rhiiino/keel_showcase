// keel_web/src/modules/people/figures/lib/figuresListSort.ts

import type { Figure } from "../api";
import { formatFigureName } from "../api";
import { formatContactBirthDate } from "../../shared/lib/birthDate";

export type FigureSortColumn = "name" | "born";

export const FIGURE_DEFAULT_SORT = {
  column: "name" as FigureSortColumn,
  direction: "asc" as const,
};

export function getFigureSortValue(
  figure: Figure,
  column: FigureSortColumn,
): string | number | null {
  if (column === "name") {
    return formatFigureName(figure).toLowerCase();
  }
  if (column === "born") {
    return figure.birth_date ?? "";
  }
  return null;
}

export function formatFigureBirthDate(figure: Pick<Figure, "birth_date" | "birth_date_year_known">) {
  return formatContactBirthDate(figure);
}
