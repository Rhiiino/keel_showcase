// keel_web/src/modules/projects/lib/workspace/note/workspaceNoteTextColorSyntax.ts

// Inline text color markers for workspace note markdown bodies.

export const WORKSPACE_NOTE_TEXT_COLOR_HREF_PREFIX = "ws-color:";

/** Matches `{#rrggbb}text{/}` color spans in note bodies. */
export const WORKSPACE_NOTE_TEXT_COLOR_PATTERN =
  /\{#([0-9a-f]{6})\}([\s\S]*?)\{\/\}/gi;

export function normalizeWorkspaceNoteTextColorHex(hex: string): string {
  return hex.replace(/^#/, "").trim().toLowerCase();
}

export function formatWorkspaceNoteTextColorToken(hex: string, text: string): string {
  const normalized = normalizeWorkspaceNoteTextColorHex(hex);
  return `{#${normalized}}${text}{/}`;
}

export function isWorkspaceNoteTextColorHref(href: string | undefined): href is string {
  return typeof href === "string" && href.startsWith(WORKSPACE_NOTE_TEXT_COLOR_HREF_PREFIX);
}

export function hexFromWorkspaceNoteTextColorHref(href: string): string {
  const raw = href.slice(WORKSPACE_NOTE_TEXT_COLOR_HREF_PREFIX.length);
  return raw.startsWith("#") ? raw : `#${raw}`;
}

export function preprocessWorkspaceNoteTextColors(markdown: string): string {
  return markdown.replace(
    WORKSPACE_NOTE_TEXT_COLOR_PATTERN,
    (_match, hex: string, inner: string) => {
      const normalized = normalizeWorkspaceNoteTextColorHex(hex);
      return `[${inner}](${WORKSPACE_NOTE_TEXT_COLOR_HREF_PREFIX}#${normalized})`;
    },
  );
}
