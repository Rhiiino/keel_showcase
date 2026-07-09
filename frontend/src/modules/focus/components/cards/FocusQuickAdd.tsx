// src/modules/focus/components/cards/FocusQuickAdd.tsx

// Inline form to add a focus item or list.

import { useEffect, useRef, useState } from "react";

type FocusQuickAddProps = {
  placeholder: string;
  buttonLabel: string;
  onSubmit: (title: string) => Promise<unknown>;
  disabled?: boolean;
  keepInputFocusedAfterSubmit?: boolean;
};

export function FocusQuickAdd({
  placeholder,
  buttonLabel,
  onSubmit,
  disabled = false,
  keepInputFocusedAfterSubmit = false,
}: FocusQuickAddProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldRefocusInput, setShouldRefocusInput] = useState(false);

  useEffect(() => {
    if (!shouldRefocusInput || pending || disabled) {
      return;
    }

    inputRef.current?.focus();
    setShouldRefocusInput(false);
  }, [disabled, pending, shouldRefocusInput]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || pending || disabled) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      setTitle("");
      setShouldRefocusInput(keepInputFocusedAfterSubmit);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to add.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={placeholder}
        disabled={pending || disabled}
        className="min-w-0 flex-1 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/30 focus:border-white/25"
      />
      <button
        type="submit"
        disabled={pending || disabled || !title.trim()}
        className="rounded-xl bg-white/12 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/18 disabled:opacity-40"
      >
        {pending ? "Adding…" : buttonLabel}
      </button>
      {error ? <p className="text-xs text-rose-300 sm:basis-full">{error}</p> : null}
    </form>
  );
}
