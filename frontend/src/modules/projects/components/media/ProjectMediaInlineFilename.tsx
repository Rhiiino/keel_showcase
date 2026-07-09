// stack_sandbox/frontend_web/src/modules/projects/components/media/ProjectMediaInlineFilename.tsx

// Click-to-edit media filename on the project detail display view (saved via header Save).

type ProjectMediaInlineFilenameProps = {
  value: string;
  onChange: (nextFilename: string) => void;
  disabled?: boolean;
};

export function ProjectMediaInlineFilename({
  value,
  onChange,
  disabled = false,
}: ProjectMediaInlineFilenameProps) {
  return (
    <input
      type="text"
      value={value}
      maxLength={512}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      aria-label="File name"
      className="w-full cursor-text border-0 bg-transparent text-xs font-medium leading-snug text-stone-200 shadow-none outline-none ring-0 placeholder:text-stone-500 focus:border-0 focus:outline-none focus:ring-0"
    />
  );
}
