// stack_sandbox/frontend_web/src/modules/projects/components/detail/ProjectDetailInlineDescription.tsx

// Click-to-edit project description on the detail display view (saved via header Save).

import { AutoSizeTextarea } from "../common";

type ProjectDetailInlineDescriptionProps = {
  value: string;
  onChange: (nextDescription: string) => void;
  disabled?: boolean;
};

export function ProjectDetailInlineDescription({
  value,
  onChange,
  disabled = false,
}: ProjectDetailInlineDescriptionProps) {
  return (
    <AutoSizeTextarea
      value={value}
      maxLength={8000}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Project description"
      placeholder="Add a description…"
      className="w-full cursor-text border-0 bg-transparent text-base leading-relaxed text-stone-300 shadow-none outline-none ring-0 placeholder:text-stone-500 focus:border-0 focus:outline-none focus:ring-0"
    />
  );
}
