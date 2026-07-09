// keel_web/src/modules/projects/lib/workspace/note/workspaceNoteMarkdownEdit.ts

// Text-editing helpers for workspace note markdown bodies.

import {
  formatWorkspaceNoteTextColorToken,
  WORKSPACE_NOTE_TEXT_COLOR_PATTERN,
} from "./workspaceNoteTextColorSyntax";

export const WORKSPACE_MARKDOWN_HORIZONTAL_RULE = "---";
export const WORKSPACE_MARKDOWN_TASK_ITEM = "- [ ] ";

const MARKDOWN_TASK_LIST_LINE_PATTERN = /^(\s*[-*+]\s+)\[([ xX])\](.*)$/;

export function parseMarkdownTaskListLine(line: string): {
  prefix: string;
  checked: boolean;
  suffix: string;
} | null {
  const match = MARKDOWN_TASK_LIST_LINE_PATTERN.exec(line);
  if (!match) {
    return null;
  }

  return {
    prefix: match[1],
    checked: match[2].toLowerCase() === "x",
    suffix: match[3],
  };
}

export type WorkspaceNoteTextRange = {
  start: number;
  end: number;
};

type MarkdownWrapper = {
  prefix: string;
  suffix: string;
};

const MARKDOWN_BOLD_WRAPPER: MarkdownWrapper = { prefix: "**", suffix: "**" };
const MARKDOWN_ITALIC_WRAPPER: MarkdownWrapper = { prefix: "*", suffix: "*" };
const MARKDOWN_STRIKE_WRAPPER: MarkdownWrapper = { prefix: "~~", suffix: "~~" };

export type WorkspaceNoteSelectionFormats = {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  colorHex: string | null;
};



// ----- Selection helpers

export function hasNonEmptyTextRange(range: WorkspaceNoteTextRange): boolean {
  return range.end > range.start;
}

export function replaceTextRange(
  text: string,
  range: WorkspaceNoteTextRange,
  replacement: string,
): { nextText: string; nextStart: number; nextEnd: number } {
  const safeStart = Math.max(0, Math.min(range.start, text.length));
  const safeEnd = Math.max(safeStart, Math.min(range.end, text.length));
  const nextText = text.slice(0, safeStart) + replacement + text.slice(safeEnd);
  return {
    nextText,
    nextStart: safeStart,
    nextEnd: safeStart + replacement.length,
  };
}



// ----- Markdown formatting

export function isMarkdownWrapperActive(
  text: string,
  range: WorkspaceNoteTextRange,
  wrapper: MarkdownWrapper,
): boolean {
  const { start, end } = range;
  const selected = text.slice(start, end);
  const before = text.slice(Math.max(0, start - wrapper.prefix.length), start);
  const after = text.slice(end, end + wrapper.suffix.length);

  if (before === wrapper.prefix && after === wrapper.suffix) {
    return true;
  }

  return (
    selected.startsWith(wrapper.prefix) &&
    selected.endsWith(wrapper.suffix) &&
    selected.length >= wrapper.prefix.length + wrapper.suffix.length
  );
}

export function detectSelectionMarkdownFormats(
  text: string,
  range: WorkspaceNoteTextRange,
): WorkspaceNoteSelectionFormats {
  const bold = isMarkdownWrapperActive(text, range, MARKDOWN_BOLD_WRAPPER);
  const strikethrough = isMarkdownWrapperActive(text, range, MARKDOWN_STRIKE_WRAPPER);
  const italic =
    !bold && isMarkdownWrapperActive(text, range, MARKDOWN_ITALIC_WRAPPER);

  const colorHex = detectSelectionColorHex(text, range);

  return { bold, italic, strikethrough, colorHex };
}

function detectSelectionColorHex(
  text: string,
  range: WorkspaceNoteTextRange,
): string | null {
  const selected = text.slice(range.start, range.end);
  const embedded = new RegExp(WORKSPACE_NOTE_TEXT_COLOR_PATTERN.source, "i").exec(selected);
  if (embedded) {
    return `#${embedded[1]}`;
  }

  const pattern = new RegExp(WORKSPACE_NOTE_TEXT_COLOR_PATTERN.source, "gi");
  for (const match of text.matchAll(pattern)) {
    const matchStart = match.index ?? 0;
    const matchEnd = matchStart + match[0].length;
    const contentStart = matchStart + `{#${match[1]}}`.length;
    const contentEnd = matchEnd - "{/}".length;
    if (range.start >= contentStart && range.end <= contentEnd) {
      return `#${match[1]}`;
    }
  }

  return null;
}

function toggleMarkdownWrapper(
  text: string,
  range: WorkspaceNoteTextRange,
  wrapper: MarkdownWrapper,
): { nextText: string; nextStart: number; nextEnd: number } {
  const { start, end } = range;
  const selected = text.slice(start, end);
  const before = text.slice(Math.max(0, start - wrapper.prefix.length), start);
  const after = text.slice(end, end + wrapper.suffix.length);

  if (before === wrapper.prefix && after === wrapper.suffix) {
    const nextText =
      text.slice(0, start - wrapper.prefix.length) +
      selected +
      text.slice(end + wrapper.suffix.length);
    const nextStart = start - wrapper.prefix.length;
    return { nextText, nextStart, nextEnd: nextStart + selected.length };
  }

  if (
    selected.startsWith(wrapper.prefix) &&
    selected.endsWith(wrapper.suffix) &&
    selected.length >= wrapper.prefix.length + wrapper.suffix.length
  ) {
    const inner = selected.slice(
      wrapper.prefix.length,
      selected.length - wrapper.suffix.length,
    );
    return replaceTextRange(text, range, inner);
  }

  return replaceTextRange(text, range, wrapper.prefix + selected + wrapper.suffix);
}

export function toggleMarkdownBold(
  text: string,
  range: WorkspaceNoteTextRange,
): { nextText: string; nextStart: number; nextEnd: number } {
  return toggleMarkdownWrapper(text, range, MARKDOWN_BOLD_WRAPPER);
}

export function toggleMarkdownItalic(
  text: string,
  range: WorkspaceNoteTextRange,
): { nextText: string; nextStart: number; nextEnd: number } {
  return toggleMarkdownWrapper(text, range, MARKDOWN_ITALIC_WRAPPER);
}

export function toggleMarkdownStrikethrough(
  text: string,
  range: WorkspaceNoteTextRange,
): { nextText: string; nextStart: number; nextEnd: number } {
  return toggleMarkdownWrapper(text, range, MARKDOWN_STRIKE_WRAPPER);
}

export function applyMarkdownTextColor(
  text: string,
  range: WorkspaceNoteTextRange,
  hex: string,
): { nextText: string; nextStart: number; nextEnd: number } {
  const selected = text.slice(range.start, range.end);
  const colorPattern = new RegExp(WORKSPACE_NOTE_TEXT_COLOR_PATTERN.source, "i");
  const match = colorPattern.exec(selected);

  const inner = match ? match[2] : selected;
  const wrapped = formatWorkspaceNoteTextColorToken(hex, inner);
  return replaceTextRange(text, range, wrapped);
}



// ----- Markdown insertions

export function toggleMarkdownTaskItemAtLine(
  text: string,
  lineIndex: number,
): { nextText: string } | null {
  const lines = text.split("\n");
  if (lineIndex < 0 || lineIndex >= lines.length) {
    return null;
  }

  const parsed = parseMarkdownTaskListLine(lines[lineIndex]);
  if (!parsed) {
    return null;
  }

  lines[lineIndex] = `${parsed.prefix}[${parsed.checked ? " " : "x"}]${parsed.suffix}`;
  return { nextText: lines.join("\n") };
}

export function insertMarkdownCheckboxAtLine(
  text: string,
  cursor: number,
): { nextText: string; nextCursor: number } {
  const safeCursor = Math.max(0, Math.min(cursor, text.length));
  const lineStart = safeCursor <= 0 ? 0 : text.lastIndexOf("\n", safeCursor - 1) + 1;
  const lineEndRaw = text.indexOf("\n", safeCursor);
  const lineEnd = lineEndRaw === -1 ? text.length : lineEndRaw;
  const line = text.slice(lineStart, lineEnd);

  if (line.trim() === "") {
    const nextText =
      text.slice(0, lineStart) + WORKSPACE_MARKDOWN_TASK_ITEM + text.slice(lineEnd);
    return {
      nextText,
      nextCursor: lineStart + WORKSPACE_MARKDOWN_TASK_ITEM.length,
    };
  }

  const insert = `\n${WORKSPACE_MARKDOWN_TASK_ITEM}`;
  const nextText = text.slice(0, lineEnd) + insert + text.slice(lineEnd);
  return {
    nextText,
    nextCursor: lineEnd + insert.length,
  };
}

export function insertMarkdownSeparatorAtLine(
  text: string,
  cursor: number,
): { nextText: string; nextCursor: number } {
  const safeCursor = Math.max(0, Math.min(cursor, text.length));
  const lineStart = safeCursor <= 0 ? 0 : text.lastIndexOf("\n", safeCursor - 1) + 1;
  const lineEndRaw = text.indexOf("\n", safeCursor);
  const lineEnd = lineEndRaw === -1 ? text.length : lineEndRaw;
  const line = text.slice(lineStart, lineEnd);

  if (line.trim() === "") {
    const nextText =
      text.slice(0, lineStart) +
      WORKSPACE_MARKDOWN_HORIZONTAL_RULE +
      text.slice(lineEnd);
    return {
      nextText,
      nextCursor: lineStart + WORKSPACE_MARKDOWN_HORIZONTAL_RULE.length,
    };
  }

  const insert = `\n${WORKSPACE_MARKDOWN_HORIZONTAL_RULE}\n`;
  const nextText = text.slice(0, lineEnd) + insert + text.slice(lineEnd);
  return {
    nextText,
    nextCursor: lineEnd + insert.length,
  };
}
