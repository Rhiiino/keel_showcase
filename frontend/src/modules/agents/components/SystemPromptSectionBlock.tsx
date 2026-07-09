// stack_sandbox/frontend_web/src/modules/agents/components/SystemPromptSectionBlock.tsx

// One editable (or read-only) system prompt section block.

import type { SystemPromptSection } from "../api";
import { EditableText } from "./EditableText";

type SystemPromptSectionBlockProps = {
  section: SystemPromptSection;
  content: string;
  onChange: (value: string) => void;
  editingEnabled?: boolean;
};

export function SystemPromptSectionBlock({
  section,
  content,
  onChange,
  editingEnabled = true,
}: SystemPromptSectionBlockProps) {
  const editable = editingEnabled && section.editable !== false;

  return (
    <section className="space-y-2">
      {section.label ? (
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
            {section.label}
          </p>
          {!editable ? (
            <span className="font-mono text-[10px] uppercase tracking-wider text-stone-600">
              Auto-generated
            </span>
          ) : null}
        </div>
      ) : null}
      <EditableText
        value={content}
        onChange={onChange}
        editable={editable}
        placeholder={
          section.key === "identity"
            ? "Who is this agent? Name, role, and tone."
            : undefined
        }
        className={[
          "whitespace-pre-wrap font-mono text-sm leading-relaxed",
          editable ? "text-stone-300" : "text-stone-500",
        ].join(" ")}
        editableClassName="px-3 py-2.5"
      />
    </section>
  );
}
