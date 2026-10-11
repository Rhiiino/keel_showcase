// stack_sandbox/frontend_web/src/modules/agents/components/AgentEditorActions.tsx

// Save/create controls in the page header (new sub-agent lives on the catalog + tile).

import { useOptionalAgentEditorControls } from "../context/AgentEditorContext";

export function AgentEditorActions() {
  const controls = useOptionalAgentEditorControls();

  if (!controls?.isDirty && !controls?.saveError) {
    return null;
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5 py-1 pl-4 pr-2">
      <div className="flex items-center gap-2">
        {controls?.isDraft ? (
          <button
            type="button"
            onClick={() => controls.discard()}
            disabled={controls.isSaving}
            className={[
              "rounded-md px-3 py-1.5 text-xs font-medium transition",
              controls.isSaving
                ? "cursor-not-allowed text-stone-600"
                : "text-stone-400 ring-1 ring-stone-800/80 hover:bg-stone-900/70 hover:text-stone-200",
            ].join(" ")}
          >
            Discard
          </button>
        ) : null}
        {controls?.isDirty ? (
          <button
            type="button"
            onClick={() => void controls.save()}
            disabled={controls.isSaving}
            className={[
              "rounded-md px-3 py-1.5 text-xs font-medium transition",
              controls.isSaving
                ? "cursor-not-allowed bg-stone-900/60 text-stone-600 ring-1 ring-stone-800/80"
                : "bg-lime-400/15 text-lime-300 ring-1 ring-lime-400/30 hover:bg-lime-400/25",
            ].join(" ")}
          >
            {controls.isSaving
              ? controls.isDraft
                ? "Creating…"
                : "Saving…"
              : controls.isDraft
                ? "Create"
                : "Save"}
          </button>
        ) : null}
      </div>
      {controls?.saveError ? (
        <p className="max-w-[16rem] text-right text-[11px] text-red-400">
          {controls.saveError}
        </p>
      ) : null}
    </div>
  );
}
