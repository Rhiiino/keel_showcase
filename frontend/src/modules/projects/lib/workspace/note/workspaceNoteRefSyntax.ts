// keel_web/src/modules/projects/lib/workspace/note/workspaceNoteRefSyntax.ts

// Wiki-link syntax and helpers for inline workspace note cross-references.

import type { Node } from "@xyflow/react";

import type { WorkspaceNoteData } from "../projectWorkspace";

/** Matches `[[note-<uuid>]]` or `[[note-<uuid>|alias]]`. */
export const WORKSPACE_NOTE_REF_PATTERN =
  /\[\[(note-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\|([^\]]+))?\]\]/gi;

export const WORKSPACE_NOTE_REF_HREF_PREFIX = "note:";

export type WorkspaceNoteRefMentionSession = {
  start: number;
  end: number;
  query: string;
};

export function formatWorkspaceNoteRefToken(noteId: string, alias?: string): string {
  const trimmedAlias = alias?.trim();
  if (trimmedAlias) {
    return `[[${noteId}|${trimmedAlias}]]`;
  }
  return `[[${noteId}]]`;
}

export function preprocessWorkspaceNoteRefs(markdown: string): string {
  return markdown.replace(
    WORKSPACE_NOTE_REF_PATTERN,
    (_match, noteId: string, alias?: string) => {
      const label = alias?.trim() || "note-ref";
      return `[${label}](${WORKSPACE_NOTE_REF_HREF_PREFIX}${noteId})`;
    },
  );
}

export function isWorkspaceNoteRefHref(href: string | undefined): href is string {
  return typeof href === "string" && href.startsWith(WORKSPACE_NOTE_REF_HREF_PREFIX);
}

export function noteIdFromRefHref(href: string): string {
  return href.slice(WORKSPACE_NOTE_REF_HREF_PREFIX.length);
}

export function detectWorkspaceNoteRefMention(
  text: string,
  cursor: number,
): WorkspaceNoteRefMentionSession | null {
  const before = text.slice(0, cursor);
  const atIndex = before.lastIndexOf("@");
  if (atIndex === -1) {
    return null;
  }

  const prefix = before.slice(0, atIndex);
  if (prefix.length > 0 && !/[\s([{]$/.test(prefix)) {
    return null;
  }

  const query = before.slice(atIndex + 1);
  if (query.length === 0 || /\s/.test(query) || query.length > 48) {
    return null;
  }

  return { start: atIndex, end: cursor, query };
}

export function insertWorkspaceNoteRefToken(
  text: string,
  session: WorkspaceNoteRefMentionSession,
  noteId: string,
): { nextText: string; cursor: number } {
  const token = `${formatWorkspaceNoteRefToken(noteId)} `;
  const nextText = text.slice(0, session.start) + token + text.slice(session.end);
  return { nextText, cursor: session.start + token.length };
}

export function resolveWorkspaceNoteNode(
  nodes: Node[],
  noteId: string,
): Node<WorkspaceNoteData> | null {
  const node = nodes.find((item) => item.id === noteId && item.type === "note");
  if (!node) {
    return null;
  }
  return node as Node<WorkspaceNoteData>;
}

export function resolveWorkspaceNoteRefLabel(
  node: Node<WorkspaceNoteData> | null,
  alias?: string,
): string {
  if (alias?.trim()) {
    return alias.trim();
  }
  if (!node) {
    return "Missing note";
  }
  const title = node.data.title;
  return typeof title === "string" && title.trim() ? title.trim() : "Note";
}

export type WorkspaceNoteRefCandidate = {
  id: string;
  title: string;
  borderColor: string;
};

export function listWorkspaceNoteRefCandidates(
  nodes: Node[],
  options: { excludeNoteId?: string; query?: string } = {},
): WorkspaceNoteRefCandidate[] {
  const normalizedQuery = options.query?.trim().toLowerCase() ?? "";

  return nodes.flatMap((node) => {
    if (node.type !== "note" || node.id === options.excludeNoteId) {
      return [];
    }

    const data = node.data as Partial<WorkspaceNoteData>;
    const title =
      typeof data.title === "string" && data.title.trim() ? data.title.trim() : "Note";

    if (
      normalizedQuery &&
      !title.toLowerCase().includes(normalizedQuery) &&
      !node.id.toLowerCase().includes(normalizedQuery)
    ) {
      return [];
    }

    return [
      {
        id: node.id,
        title,
        borderColor: typeof data.color === "string" ? data.color : "",
      },
    ];
  });
}
