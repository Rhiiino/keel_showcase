// keel_web/src/modules/projects/components/workspace/nodes/WorkspaceNoteMarkdown.tsx

// GitHub-flavored Markdown preview for workspace note bodies, including note refs.

import { useMemo, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  applyWorkspaceNoteRefMarkdown,
  hexFromWorkspaceNoteTextColorHref,
  isWorkspaceNoteRefHref,
  isWorkspaceNoteTextColorHref,
  noteIdFromRefHref,
  parseWorkspaceNoteMarkdownBlocks,
  preprocessWorkspaceNoteTextColors,
  WORKSPACE_NOTE_REF_HREF_PREFIX,
} from "../../../lib/workspace/note";
import { resolveWorkspaceNoteItalicColor } from "../../../lib/workspace";
import {
  useWorkspaceNoteItalicColor,
  useWorkspaceTextFontSizes,
} from "../context/WorkspaceCanvasContext";
import { WorkspaceNoteRefPill } from "./WorkspaceNoteRefPill";

const MARKDOWN_CLASSNAME = [
  "space-y-2",
  "[&_a:not([data-note-ref])]:text-sky-300 [&_a:not([data-note-ref])]:underline [&_a:not([data-note-ref])]:decoration-sky-300/40 [&_a:not([data-note-ref])]:underline-offset-2",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-stone-500/70 [&_blockquote]:pl-3 [&_blockquote]:text-stone-300",
  "[&_code]:rounded [&_code]:bg-stone-950/70 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-stone-100",
  "[&_h1]:text-[1.45em] [&_h1]:font-semibold [&_h1]:leading-tight [&_h1]:text-stone-50",
  "[&_h2]:text-[1.25em] [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:text-stone-50",
  "[&_h3]:text-[1.1em] [&_h3]:font-semibold [&_h3]:leading-tight [&_h3]:text-stone-100",
  "[&_hr]:border-stone-600/70 [&_li]:pl-1 [&_li]:marker:text-stone-400",
  "[&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:leading-relaxed",
  "[&_pre]:overflow-hidden [&_pre]:rounded-md [&_pre]:bg-stone-950/80 [&_pre]:p-2 [&_pre]:font-mono [&_pre]:text-[0.9em] [&_pre]:leading-relaxed",
  "[&_table]:w-full [&_table]:border-collapse [&_table]:rounded [&_table]:border [&_table]:border-stone-700/70 [&_table]:text-left [&_table]:text-[0.9em]",
  "[&_td]:border-t [&_td]:border-stone-700/70 [&_td]:px-2 [&_td]:py-1 [&_td]:align-top",
  "[&_th]:border-b [&_th]:border-stone-700/70 [&_th]:px-2 [&_th]:py-1 [&_th]:font-medium [&_th]:text-stone-100",
  "[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
  "[&_ul.contains-task-list]:list-none [&_ul.contains-task-list]:space-y-1.5 [&_ul.contains-task-list]:pl-1",
  "[&_li.task-list-item]:flex [&_li.task-list-item]:list-none [&_li.task-list-item]:items-start [&_li.task-list-item]:gap-1.5 [&_li.task-list-item]:pl-0",
].join(" ");

const TASK_CHECKBOX_CLASSNAME = [
  "nodrag nopan pointer-events-auto relative mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border border-stone-500 bg-stone-900 accent-sky-400 transition",
  "hover:border-sky-400 hover:bg-sky-950/70 hover:shadow-[0_0_0_2px_rgba(56,189,248,0.35)]",
  "checked:border-sky-400 checked:bg-sky-500/20 checked:hover:bg-sky-500/30",
].join(" ");

function workspaceNoteUrlTransform(url: string): string {
  if (url.startsWith(WORKSPACE_NOTE_REF_HREF_PREFIX)) {
    return url;
  }
  return defaultUrlTransform(url);
}

function extractNoteRefAlias(children: ReactNode): string | undefined {
  if (typeof children === "string") {
    return children !== "note-ref" ? children : undefined;
  }
  if (Array.isArray(children)) {
    const text = children
      .map((child) => (typeof child === "string" ? child : ""))
      .join("");
    return text && text !== "note-ref" ? text : undefined;
  }
  return undefined;
}

function stopInteractivePointerEvent(event: MouseEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
}

type WorkspaceNoteTaskCheckboxProps = {
  checked: boolean;
  lineIndex: number;
  onToggleTaskLine: (lineIndex: number) => void;
};

function WorkspaceNoteTaskCheckbox({
  checked,
  lineIndex,
  onToggleTaskLine,
}: WorkspaceNoteTaskCheckboxProps) {
  return (
    <input
      type="checkbox"
      data-workspace-note-task-checkbox="true"
      data-workspace-note-task-line={lineIndex}
      checked={checked}
      aria-label="Toggle task"
      className={TASK_CHECKBOX_CLASSNAME}
      onMouseDown={stopInteractivePointerEvent}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onChange={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggleTaskLine(lineIndex);
      }}
    />
  );
}

type WorkspaceNoteMarkdownProps = {
  text: string;
  onToggleTaskLine?: (lineIndex: number) => void;
};

export function WorkspaceNoteMarkdown({ text, onToggleTaskLine }: WorkspaceNoteMarkdownProps) {
  const noteItalicColor = useWorkspaceNoteItalicColor();
  const { italicPx } = useWorkspaceTextFontSizes();
  const italicColor = resolveWorkspaceNoteItalicColor(noteItalicColor);
  const italicStyle = useMemo<CSSProperties>(
    () => ({
      color: italicColor,
      fontSize: italicPx,
    }),
    [italicColor, italicPx],
  );

  const markdownComponents = useMemo(
    () => ({
      em: ({ children }: { children?: ReactNode }) => (
        <em style={italicStyle}>{children}</em>
      ),
      i: ({ children }: { children?: ReactNode }) => (
        <i style={italicStyle}>{children}</i>
      ),
      a: ({ href, children }: { href?: string; children?: ReactNode }) => {
        if (isWorkspaceNoteTextColorHref(href)) {
          return (
            <span style={{ color: hexFromWorkspaceNoteTextColorHref(href) }}>
              {children}
            </span>
          );
        }

        if (isWorkspaceNoteRefHref(href)) {
          return (
            <WorkspaceNoteRefPill
              noteId={noteIdFromRefHref(href)}
              alias={extractNoteRefAlias(children)}
            />
          );
        }

        return (
          <a href={href} target="_blank" rel="noreferrer noopener">
            {children}
          </a>
        );
      },
    }),
    [italicStyle],
  );

  const preprocessMarkdown = useMemo(
    () => (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return "";
      }
      const withColors = preprocessWorkspaceNoteTextColors(trimmed);
      return applyWorkspaceNoteRefMarkdown(withColors);
    },
    [],
  );

  const blocks = useMemo(() => {
    if (!onToggleTaskLine || !text.trim()) {
      return null;
    }
    return parseWorkspaceNoteMarkdownBlocks(text);
  }, [onToggleTaskLine, text]);

  if (!text.trim()) {
    return <p className="text-stone-500">Write a note…</p>;
  }

  if (blocks && onToggleTaskLine) {
    return (
      <div className={MARKDOWN_CLASSNAME}>
        {blocks.map((block, blockIndex) => {
          if (block.kind === "markdown") {
            const markdown = preprocessMarkdown(block.value);
            if (!markdown) {
              return null;
            }

            return (
              <ReactMarkdown
                key={`markdown-${blockIndex}`}
                remarkPlugins={[remarkGfm]}
                urlTransform={workspaceNoteUrlTransform}
                components={markdownComponents}
              >
                {markdown}
              </ReactMarkdown>
            );
          }

          return (
            <ul
              key={`tasks-${block.items[0]?.lineIndex ?? blockIndex}`}
              className="contains-task-list space-y-1.5 pl-1"
            >
              {block.items.map((item) => {
                const labelMarkdown = preprocessMarkdown(item.label);

                return (
                  <li
                    key={item.lineIndex}
                    className="task-list-item flex list-none items-start gap-1.5 pl-0"
                  >
                    <WorkspaceNoteTaskCheckbox
                      checked={item.checked}
                      lineIndex={item.lineIndex}
                      onToggleTaskLine={onToggleTaskLine}
                    />
                    {labelMarkdown ? (
                      <div className="min-w-0 flex-1 leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          urlTransform={workspaceNoteUrlTransform}
                          components={markdownComponents}
                        >
                          {labelMarkdown}
                        </ReactMarkdown>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          );
        })}
      </div>
    );
  }

  const markdown = preprocessMarkdown(text);

  return (
    <div className={MARKDOWN_CLASSNAME}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={workspaceNoteUrlTransform}
        components={markdownComponents}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
