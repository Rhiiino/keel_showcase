// keel_web/src/modules/coak/lib/tabs/directory/coakDirectoryPreview.ts

import type { CoakItemKind } from "../../../api";
import { getCoakItemKindDefinition } from "../../coakItemKindRegistry";

const DEFAULT_PREVIEW_WORD_COUNT = 8;

export function truncateCoakDirectoryPreview(
  text: string,
  maxWords: number = DEFAULT_PREVIEW_WORD_COUNT,
): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  const words = normalized.split(" ");
  if (words.length <= maxWords) {
    return normalized;
  }

  return `${words.slice(0, maxWords).join(" ")}…`;
}

export function coakDirectoryRowPreview(options: {
  kind: CoakItemKind;
  noteBody?: string;
  flashFront?: string;
  childCount?: number;
}): string {
  return getCoakItemKindDefinition(options.kind).directoryPreview({
    noteBody: options.noteBody,
    flashFront: options.flashFront,
    childCount: options.childCount,
  });
}
