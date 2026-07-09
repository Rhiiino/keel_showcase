// stack_sandbox/frontend_web/src/modules/agents/components/AgentToolCategoryEditor.tsx

// Assign or unassign existing catalog tool categories for an agent.

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { catalogQueryKeys, fetchToolCategories } from "../../catalog/api";
import { ToolCategoryIcon } from "../../chat/components/status";
import { toolCategoryLabel } from "../../chat/lib/tools";

type AgentToolCategoryEditorProps = {
  assignedCategories: string[];
  onChange: (categories: string[]) => void;
  readOnly?: boolean;
};

function sortCategories(categories: string[]) {
  return [...categories].sort((left, right) => left.localeCompare(right));
}

export function AgentToolCategoryEditor({
  assignedCategories,
  onChange,
  readOnly = false,
}: AgentToolCategoryEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const categoriesQuery = useQuery({
    queryKey: catalogQueryKeys.toolCategories(),
    queryFn: fetchToolCategories,
  });

  const assignedSet = useMemo(
    () => new Set(assignedCategories),
    [assignedCategories],
  );

  const availableToAdd = useMemo(() => {
    const catalog = categoriesQuery.data ?? [];
    return catalog
      .map((category) => category.key)
      .filter((key) => !assignedSet.has(key))
      .sort((left, right) => left.localeCompare(right));
  }, [assignedSet, categoriesQuery.data]);

  const removeCategory = (category: string) => {
    if (readOnly || assignedCategories.length <= 1) {
      return;
    }
    onChange(assignedCategories.filter((key) => key !== category));
  };

  const addCategory = (category: string) => {
    if (readOnly) {
      return;
    }
    onChange(sortCategories([...assignedCategories, category]));
    setPickerOpen(false);
  };

  if (readOnly) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {assignedCategories.map((category) => (
          <span
            key={category}
            className={[
              "inline-flex items-center gap-1.5 rounded bg-stone-900/50 py-1 pl-1.5 pr-2",
              "font-mono text-xs uppercase tracking-wider text-stone-400 ring-1 ring-stone-800/60",
            ].join(" ")}
          >
            <ToolCategoryIcon category={category} size="xs" />
            {toolCategoryLabel(category)}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {assignedCategories.map((category) => (
          <button
            key={category}
            type="button"
            title={
              assignedCategories.length <= 1
                ? "At least one category is required"
                : "Remove category"
            }
            onClick={() => removeCategory(category)}
            className={[
              "inline-flex items-center gap-1.5 rounded bg-stone-900/50 py-1 pl-1.5 pr-2",
              "font-mono text-xs uppercase tracking-wider text-stone-400 ring-1 ring-stone-800/60",
              assignedCategories.length <= 1
                ? "cursor-not-allowed opacity-80"
                : "transition hover:bg-red-950/30 hover:text-red-300 hover:ring-red-900/50",
            ].join(" ")}
          >
            <ToolCategoryIcon category={category} size="xs" />
            {toolCategoryLabel(category)}
            {assignedCategories.length > 1 ? (
              <span className="text-stone-600" aria-hidden>
                ×
              </span>
            ) : null}
          </button>
        ))}

        {availableToAdd.length > 0 ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((open) => !open)}
              className={[
                "rounded px-2 py-1 font-mono text-xs uppercase tracking-wider",
                "text-stone-500 ring-1 ring-stone-800/80 transition",
                "hover:bg-stone-900/70 hover:text-stone-300",
              ].join(" ")}
            >
              + Add
            </button>
            {pickerOpen ? (
              <div
                className={[
                  "absolute left-0 top-full z-20 mt-1 min-w-[10rem]",
                  "rounded-lg border border-stone-800 bg-stone-950 p-1 shadow-xl",
                ].join(" ")}
              >
                {availableToAdd.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => addCategory(category)}
                    className={[
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left",
                      "font-mono text-xs uppercase tracking-wider text-stone-300",
                      "transition hover:bg-stone-900",
                    ].join(" ")}
                  >
                    <ToolCategoryIcon category={category} size="xs" />
                    {toolCategoryLabel(category)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {assignedCategories.includes("core") ? null : (
        <p className="text-xs text-amber-400/90">
          Removing <span className="font-mono">core</span> may limit basic tools.
        </p>
      )}
    </div>
  );
}
