// stack_sandbox/frontend_web/src/modules/agents/components/AgentEditorActions.tsx

// Save and discard controls in the page header when the agent detail has unsaved edits.

import { useOptionalAgentEditorControls } from "../context/AgentEditorContext";

export function AgentEditorActions() {
  const controls = useOptionalAgentEditorControls();
  const isDirty = controls?.isDirty ?? false;

  if (!isDirty) {
    return null;
  }

  const disabled = controls?.isSaving ?? false;

  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5 py-1 pl-4 pr-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => controls?.discard()}
          disabled={disabled}
          className={[
            "rounded-md px-3 py-1.5 text-xs font-medium transition",
            disabled
              ? "cursor-not-allowed text-stone-600"
              : "text-stone-400 ring-1 ring-stone-800/80 hover:bg-stone-900/70 hover:text-stone-200",
          ].join(" ")}
        >
          Discard
        </button>
        <button
          type="button"
          onClick={() => void controls?.save()}
          disabled={disabled}
          className={[
            "rounded-md px-3 py-1.5 text-xs font-medium transition",
            disabled
              ? "cursor-not-allowed bg-stone-900/60 text-stone-600 ring-1 ring-stone-800/80"
              : "bg-lime-400/15 text-lime-300 ring-1 ring-lime-400/30 hover:bg-lime-400/25",
          ].join(" ")}
        >
          {controls?.isSaving ? "Saving…" : "Save"}
        </button>
      </div>
      {controls?.saveError ? (
        <p className="max-w-[16rem] text-right text-[11px] text-red-400">
          {controls.saveError}
        </p>
      ) : null}
    </div>
  );
}
