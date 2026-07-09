// stack_sandbox/frontend_web/src/modules/agents/components/AgentEditorActions.tsx

// Create sub-agent and save/create controls in the page header.

import {
  useAgentsPageActions,
  useOptionalAgentEditorControls,
} from "../context/AgentEditorContext";

export function AgentEditorActions() {
  const pageActions = useAgentsPageActions();
  const controls = useOptionalAgentEditorControls();

  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5 py-1 pl-4 pr-2">
      <div className="flex items-center gap-2">
        {pageActions ? (
          <button
            type="button"
            title="New sub-agent"
            aria-label="New sub-agent"
            onClick={pageActions.createSubagent}
            className={[
              "rounded-md p-1.5 text-stone-400 transition",
              "ring-1 ring-stone-700/80 hover:bg-stone-900/70 hover:text-lime-400",
            ].join(" ")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
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
