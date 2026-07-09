// keel_web/src/modules/projects/components/media/ProjectMultiSelectCheckbox.tsx

// Checkbox overlay shown on project file/folder cards in multi-select mode.

type ProjectMultiSelectCheckboxProps = {
  selected: boolean;
};

export function ProjectMultiSelectCheckbox({ selected }: ProjectMultiSelectCheckboxProps) {
  return (
    <div className="absolute left-1.5 top-1.5 z-20">
      <span
        className={[
          "inline-flex h-5 w-5 items-center justify-center rounded-md ring-1",
          selected
            ? "bg-sky-500 text-stone-950 ring-sky-300"
            : "bg-stone-950/80 text-transparent ring-stone-700/80",
        ].join(" ")}
        aria-hidden
      >
        {selected && (
          <svg
            viewBox="0 0 24 24"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M5 12l5 5L20 7" />
          </svg>
        )}
      </span>
    </div>
  );
}
