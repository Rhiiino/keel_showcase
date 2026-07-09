// stack_sandbox/frontend_web/src/modules/projects/components/detail/ProjectDetailAppearanceColors.tsx

// Draft appearance color rows beneath the detail cover preview.

import {
  resolveCoverGlowColor,
  resolveCoverModelColor,
  resolveKanbanCardColor,
} from "../../lib/project/appearance";
import type { AppearanceDraft } from "../../lib/project/appearance";
import { isModelCoverProject } from "../../lib/project/appearance";
import type { Project } from "../../api";
import { AppearanceBrightnessSlider, ColorSwatchPicker } from "../common";

type ProjectDetailAppearanceColorsProps = {
  previewProject: Project;
  appearanceDraft: AppearanceDraft;
  onAppearanceDraftChange: (nextDraft: AppearanceDraft) => void;
  disabled?: boolean;
};

export function ProjectDetailAppearanceColors({
  previewProject,
  appearanceDraft,
  onAppearanceDraftChange,
  disabled = false,
}: ProjectDetailAppearanceColorsProps) {
  const isModelCover = isModelCoverProject(previewProject);

  const updateDraft = (patch: Partial<AppearanceDraft>) => {
    onAppearanceDraftChange({ ...appearanceDraft, ...patch });
  };

  return (
    <div className="grid w-fit max-w-full grid-cols-[1.25rem_auto_2.25rem] items-center gap-x-4 gap-y-3">
      {isModelCover && (
        <>
          <ColorSwatchPicker
            label="3D cover glow"
            description="Glow behind the 3D model on this page and Kanban cards."
            value={resolveCoverGlowColor(appearanceDraft.coverGlowColorHex)}
            disabled={disabled}
            onChange={(next) => updateDraft({ coverGlowColorHex: next })}
          />

          <ColorSwatchPicker
            label="3D model color"
            description="Surface color of the 3D cover model."
            value={resolveCoverModelColor(appearanceDraft.coverModelColorHex)}
            disabled={disabled}
            onChange={(next) => updateDraft({ coverModelColorHex: next })}
          />

          <AppearanceBrightnessSlider
            label="3D model brightness"
            description="How bright the 3D cover model appears on this page and Kanban cards."
            value={appearanceDraft.coverModelBrightness}
            disabled={disabled}
            onChange={(next) => updateDraft({ coverModelBrightness: next })}
          />
        </>
      )}

      <ColorSwatchPicker
        label="Kanban card border"
        description="Border color for this project on the Kanban board."
        value={resolveKanbanCardColor(appearanceDraft.kanbanCardColorHex)}
        disabled={disabled}
        onChange={(next) => updateDraft({ kanbanCardColorHex: next })}
      />

      {!isModelCover && (
        <p className="col-span-3 text-[11px] leading-relaxed text-stone-600">
          3D glow and model color options appear when a 3D file is the cover.
        </p>
      )}
    </div>
  );
}
