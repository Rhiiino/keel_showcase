// keel_web/src/modules/media/components/shared/InlineEditableTitle.tsx

// Click-to-edit title that saves on blur or Enter.

import { useEffect, useRef, useState } from "react";

type InlineEditableTitleProps = {
  value: string;
  onSave: (nextValue: string) => void;
  disabled?: boolean;
  className?: string;
};

export function InlineEditableTitle({
  value,
  onSave,
  disabled = false,
  className = "mt-1 text-xl font-semibold text-stone-50",
}: InlineEditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraft(value);
    }
  }, [isEditing, value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commitEdit = () => {
    setIsEditing(false);
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) {
      setDraft(value);
      return;
    }
    onSave(trimmed);
  };

  const discardEdit = () => {
    setDraft(value);
    setIsEditing(false);
  };

  const startEditing = () => {
    if (disabled) {
      return;
    }
    setDraft(value);
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitEdit();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            discardEdit();
          }
        }}
        onBlur={commitEdit}
        className={[
          "w-full rounded-md bg-stone-950/90 px-2 py-1 text-xl font-semibold text-stone-100 outline-none ring-1 ring-sky-500/60",
          className.includes("mt-") ? "" : "mt-1",
        ].join(" ")}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={startEditing}
      className={[
        "max-w-full truncate rounded px-0 py-0.5 text-left",
        className,
        disabled ? "cursor-default" : "cursor-text hover:text-sky-200",
      ].join(" ")}
      title={value}
    >
      {value}
    </button>
  );
}
