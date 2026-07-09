// keel_web/src/modules/projects/components/workspace/settings/WorkspaceContainerShapeToggle.tsx

// Single button that cycles box → circle → hexagon on workspace cards.

import {
  containerShapeLabel,
  nextContainerShape,
  type WorkspaceContainerShape,
} from "../../../lib/workspace/node";

type WorkspaceContainerShapeToggleProps = {
  shape: WorkspaceContainerShape;
  onSelectShape: (shape: WorkspaceContainerShape) => void;
};

function ShapeIcon({ shape }: { shape: WorkspaceContainerShape }) {
  if (shape === "circle") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    );
  }

  if (shape === "hexagon") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
        <path
          d="M8 6.5h8l4 5.5-4 5.5H8l-4-5.5 4-5.5z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

export function WorkspaceContainerShapeToggle({
  shape,
  onSelectShape,
}: WorkspaceContainerShapeToggleProps) {
  const nextShape = nextContainerShape(shape);
  const nextLabel = containerShapeLabel(nextShape);

  return (
    <button
      type="button"
      aria-label={`Container shape: ${containerShapeLabel(shape)}. Click for ${nextLabel}.`}
      title={`Shape: ${containerShapeLabel(shape)} (click for ${nextLabel})`}
      onClick={() => onSelectShape(nextShape)}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-400 transition hover:bg-stone-800 hover:text-stone-200"
    >
      <ShapeIcon shape={shape} />
    </button>
  );
}
