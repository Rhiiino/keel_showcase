// src/modules/focus/components/forms/entry/FocusEntryInlineTitle.tsx

// Click-to-edit title for focus entries in the list form view.

import { useEffect, useState } from "react";

type FocusEntryInlineTitleProps = {
  value: string;
  onCommit: (nextTitle: string) => void;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
};

export function FocusEntryInlineTitle({
  value,
  onCommit,
  disabled = false,
  className = "text-sm font-medium text-white/88",
  inputClassName = "text-sm font-medium text-white/95",
}: FocusEntryInlineTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) {
      setDraft(value);
    }
  }, [editing, value]);

  const cancelEdit = () => {
    setDraft(value);
    setEditing(false);
  };

  const commitEdit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(value);
      return;
    }
    if (trimmed !== value) {
      onCommit(trimmed);
    }
  };

  if (editing && !disabled) {
    return (
      <input
        type="text"
        value={draft}
        autoFocus
        maxLength={512}
        aria-label="Entry title"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitEdit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitEdit();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            cancelEdit();
          }
        }}
        onClick={(event) => event.stopPropagation()}
        className={[
          "min-w-0 flex-1 rounded-md border border-white/15 bg-white/[0.04] px-2 py-0.5 outline-none focus:border-sky-400/35 focus:ring-1 focus:ring-sky-400/25",
          inputClassName,
        ].join(" ")}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={[
        "min-w-0 flex-1 truncate text-left transition hover:text-white disabled:cursor-default disabled:hover:text-inherit",
        className,
      ].join(" ")}
    >
      {value}
    </button>
  );
}
