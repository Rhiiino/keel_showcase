// keel_web/src/modules/projects/lib/workspace/note/workspaceNoteMarkdownBlocks.ts

// Split note bodies into markdown runs and GFM task-list groups for reliable preview toggling.

import { parseMarkdownTaskListLine } from "./workspaceNoteMarkdownEdit";

export type WorkspaceNoteMarkdownTaskItem = {
  lineIndex: number;
  checked: boolean;
  label: string;
};

export type WorkspaceNoteMarkdownBlock =
  | { kind: "markdown"; value: string }
  | { kind: "task-list"; items: WorkspaceNoteMarkdownTaskItem[] };

export function parseWorkspaceNoteMarkdownBlocks(text: string): WorkspaceNoteMarkdownBlock[] {
  const lines = text.split("\n");
  const blocks: WorkspaceNoteMarkdownBlock[] = [];
  let markdownLines: string[] = [];
  let taskItems: WorkspaceNoteMarkdownTaskItem[] = [];

  const flushMarkdown = () => {
    if (markdownLines.length === 0) {
      return;
    }
    blocks.push({ kind: "markdown", value: markdownLines.join("\n") });
    markdownLines = [];
  };

  const flushTasks = () => {
    if (taskItems.length === 0) {
      return;
    }
    blocks.push({ kind: "task-list", items: taskItems });
    taskItems = [];
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const parsed = parseMarkdownTaskListLine(lines[lineIndex]);
    if (parsed) {
      flushMarkdown();
      taskItems.push({
        lineIndex,
        checked: parsed.checked,
        label: parsed.suffix.trimStart(),
      });
      continue;
    }

    flushTasks();
    markdownLines.push(lines[lineIndex]);
  }

  flushMarkdown();
  flushTasks();
  return blocks;
}
