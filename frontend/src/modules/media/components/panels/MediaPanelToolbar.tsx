// keel_web/src/modules/media/components/panels/MediaPanelToolbar.tsx

// Panel page header controls.

import { MediaPanelToolbarActions } from "./MediaPanelToolbarActions";

type MediaPanelToolbarProps = {
  name: string;
  editMode: boolean;
  onBackToPanels?: () => void;
  onNameChange: (name: string) => void;
  onNameCommit?: () => void;
  onToggleEdit: () => void;
  onDeletePanel?: () => void;
  busy?: boolean;
};

export function MediaPanelToolbar({
  name,
  editMode,
  onBackToPanels,
  onNameChange,
  onNameCommit,
  onToggleEdit,
  onDeletePanel,
  busy = false,
}: MediaPanelToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-[12rem] flex-1 flex-wrap items-center gap-3">
        {onBackToPanels ? (
          <button
            type="button"
            onClick={onBackToPanels}
            className="text-sm text-stone-500 transition hover:text-stone-300"
          >
            ← Back to panels
          </button>
        ) : null}
        <input
          value={name}
          disabled={busy}
          onChange={(event) => onNameChange(event.target.value)}
          onBlur={() => onNameCommit?.()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          className="min-w-[12rem] flex-1 bg-transparent text-2xl font-semibold text-stone-50 outline-none placeholder:text-stone-600"
          aria-label="Panel name"
        />
      </div>
      <MediaPanelToolbarActions
        editMode={editMode}
        busy={busy}
        onToggleEdit={onToggleEdit}
        onDeletePanel={onDeletePanel}
      />
    </div>
  );
}
