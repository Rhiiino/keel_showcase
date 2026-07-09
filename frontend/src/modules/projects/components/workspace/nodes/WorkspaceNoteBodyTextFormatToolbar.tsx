// keel_web/src/modules/projects/components/workspace/nodes/WorkspaceNoteBodyTextFormatToolbar.tsx

// Bold, italic, strikethrough, and text-color controls for note body selections.

import type { ReactNode } from "react";

import type { WorkspaceNoteSelectionFormats } from "../../../lib/workspace/note";
import { WORKSPACE_NOTE_COLORS, normalizeNoteColor } from "../../../lib/workspace/node";

type WorkspaceNoteBodyTextFormatToolbarProps = {
  formats: WorkspaceNoteSelectionFormats;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleStrikethrough: () => void;
  onSelectColor: (hex: string) => void;
};

function FormatButton({
  label,
  title,
  active,
  onClick,
  children,
}: {
  label: string;
  title: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={title}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={onClick}
      className={[
        "inline-flex h-7 w-7 items-center justify-center rounded-md transition",
        active
          ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/50"
          : "text-stone-400 hover:bg-stone-800 hover:text-stone-200",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function WorkspaceNoteBodyTextFormatToolbar({
  formats,
  onToggleBold,
  onToggleItalic,
  onToggleStrikethrough,
  onSelectColor,
}: WorkspaceNoteBodyTextFormatToolbarProps) {
  const activeColor = formats.colorHex ? normalizeNoteColor(formats.colorHex) : null;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-1">
        {WORKSPACE_NOTE_COLORS.map((color) => {
          const active = activeColor === normalizeNoteColor(color.border);
          return (
            <button
              key={color.id}
              type="button"
              aria-label={`Text color: ${color.label}`}
              aria-pressed={active}
              title={color.label}
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onClick={() => onSelectColor(color.border)}
              className={[
                "h-5 w-5 rounded-full ring-1 transition",
                active
                  ? "ring-2 ring-sky-400 ring-offset-1 ring-offset-stone-950"
                  : "ring-stone-600/80 hover:ring-stone-400",
              ].join(" ")}
              style={{ backgroundColor: color.border }}
            />
          );
        })}
      </div>
      <span className="mx-0.5 h-4 w-px bg-stone-700" aria-hidden />
      <FormatButton
        label="Bold"
        title="Bold"
        active={formats.bold}
        onClick={onToggleBold}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M8 5h5.5a3.5 3.5 0 0 1 2.45 6A3.5 3.5 0 0 1 16 17H8V5zm3 5h2a1.5 1.5 0 1 0 0-3h-2v3zm0 7h2.5a2 2 0 1 0 0-4H11v4z" />
        </svg>
      </FormatButton>
      <FormatButton
        label="Italic"
        title="Italic"
        active={formats.italic}
        onClick={onToggleItalic}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M11 5h7v2h-2.8l-3.2 10H15v2H8v-2h2.8l3.2-10H11V5z" />
        </svg>
      </FormatButton>
      <FormatButton
        label="Strikethrough"
        title="Strikethrough"
        active={formats.strikethrough}
        onClick={onToggleStrikethrough}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M5 12h14" strokeLinecap="round" />
          <path d="M8 7c0-1.5 1.2-2.5 4-2.5s4 1 4 2.5" strokeLinecap="round" />
          <path d="M8 17c0 1.5 1.2 2.5 4 2.5s4-1 4-2.5" strokeLinecap="round" />
        </svg>
      </FormatButton>
    </div>
  );
}
