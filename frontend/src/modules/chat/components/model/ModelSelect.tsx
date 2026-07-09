// stack_sandbox/frontend_web/src/modules/chat/components/model/ModelSelect.tsx

// Custom model picker — each row shows display name, model id, context, and pricing.

import { useEffect, useId, useRef, useState } from "react";

import type { ChatModel } from "../../api";
import {
  formatContextWindow,
  formatModelOptionMeta,
  formatModelPricing,
} from "../../lib/model";

type ModelSelectProps = {
  models: ChatModel[];
  value: string;
  disabled?: boolean;
  onChange: (modelId: string) => void;
};

export function ModelSelect({
  models,
  value,
  disabled = false,
  onChange,
}: ModelSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selected = models.find((model) => model.id === value) ?? models[0] ?? null;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (modelId: string) => {
    setOpen(false);
    if (modelId !== value) {
      onChange(modelId);
    }
  };

  return (
    <div ref={rootRef} className="relative mt-1">
      <button
        type="button"
        disabled={disabled || models.length === 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-2 rounded-lg border border-stone-800 bg-stone-950 px-2.5 py-2 text-left transition hover:border-stone-700 focus:border-lime-400/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {selected ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-stone-100">
              {selected.display_name}
            </span>
            <span className="mt-0.5 block truncate font-mono text-[10px] text-stone-500">
              {selected.id}
            </span>
            <span className="mt-1 block truncate text-[11px] text-stone-500">
              {formatContextWindow(selected.max_context_window)} ·{" "}
              {formatModelPricing(selected)}
            </span>
          </span>
        ) : (
          <span className="text-sm text-stone-500">No models available</span>
        )}
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className={`mt-0.5 h-4 w-4 shrink-0 text-stone-500 transition ${open ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.08 1.04l-4.25 4.25a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && models.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Models"
          className="scrollbar-hidden absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-stone-800 bg-stone-950 py-1 shadow-xl shadow-black/40"
        >
          {models.map((model) => {
            const isSelected = model.id === value;
            return (
              <li key={model.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => handleSelect(model.id)}
                  className={[
                    "w-full px-2.5 py-2 text-left transition",
                    isSelected
                      ? "bg-lime-400/10 text-stone-100"
                      : "text-stone-200 hover:bg-stone-900/80",
                  ].join(" ")}
                >
                  <span className="block text-sm font-medium">{model.display_name}</span>
                  <span className="mt-0.5 block truncate font-mono text-[10px] text-stone-500">
                    {model.id}
                  </span>
                  <span className="mt-1 block text-[11px] text-stone-500">
                    {formatModelOptionMeta(model)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
