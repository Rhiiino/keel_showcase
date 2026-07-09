// stack_sandbox/frontend_web/src/modules/agents/hooks/useAgentEditor.ts

// Draft state and save orchestration for agent metadata, categories, and prompt sections.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  agentsQueryKeys,
  updateAgent,
  updateAgentSystemPrompt,
  type AgentSummary,
  type AgentSystemPrompt,
  type SystemPromptSection,
} from "../api";
import { useAgentEditorContext } from "../context/AgentEditorContext";

type PromptSectionDrafts = Record<string, string>;

function buildPromptDrafts(sections: SystemPromptSection[]): PromptSectionDrafts {
  const drafts: PromptSectionDrafts = {};
  for (const section of sections) {
    if (section.editable !== false) {
      drafts[section.key] = section.content;
    }
  }
  return drafts;
}

function categoriesEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

function promptDraftsEqual(
  left: PromptSectionDrafts,
  right: PromptSectionDrafts,
) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    if ((left[key] ?? "") !== (right[key] ?? "")) {
      return false;
    }
  }
  return true;
}

export function useAgentEditor(
  agent: AgentSummary,
  promptData: AgentSystemPrompt | undefined,
) {
  const queryClient = useQueryClient();
  const { setControls } = useAgentEditorContext();
  const [displayName, setDisplayName] = useState(agent.display_name);
  const [description, setDescription] = useState(agent.description);
  const [toolCategories, setToolCategories] = useState(agent.tool_categories);
  const [promptSections, setPromptSections] = useState<PromptSectionDrafts>({});

  useEffect(() => {
    setDisplayName(agent.display_name);
    setDescription(agent.description);
    setToolCategories(agent.tool_categories);
  }, [agent.display_name, agent.description, agent.id, agent.tool_categories]);

  useEffect(() => {
    if (!promptData) {
      return;
    }
    setPromptSections(buildPromptDrafts(promptData.sections));
  }, [agent.id, promptData]);

  const baselinePromptSections = useMemo(
    () => (promptData ? buildPromptDrafts(promptData.sections) : {}),
    [promptData],
  );

  const metadataDirty =
    displayName.trim() !== agent.display_name ||
    description.trim() !== agent.description ||
    !categoriesEqual(toolCategories, agent.tool_categories);

  const promptDirty = !promptDraftsEqual(promptSections, baselinePromptSections);
  const isDirty = metadataDirty || promptDirty;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const tasks: Promise<unknown>[] = [];

      if (metadataDirty) {
        tasks.push(
          updateAgent(agent.id, {
            display_name: displayName.trim(),
            description: description.trim(),
            tool_categories: toolCategories,
          }),
        );
      }

      if (promptDirty) {
        const changedSections = Object.entries(promptSections)
          .filter(([key, content]) => content !== (baselinePromptSections[key] ?? ""))
          .map(([key, content]) => ({ key, content }));

        if (changedSections.length > 0) {
          tasks.push(
            updateAgentSystemPrompt(agent.id, { sections: changedSections }),
          );
        }
      }

      await Promise.all(tasks);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: agentsQueryKeys.catalog() }),
        queryClient.invalidateQueries({
          queryKey: agentsQueryKeys.systemPrompt(agent.id),
        }),
        queryClient.invalidateQueries({ queryKey: agentsQueryKeys.all }),
      ]);
    },
  });

  const { mutateAsync, isPending, error, reset: resetSaveMutation } = saveMutation;
  const mutateAsyncRef = useRef(mutateAsync);
  mutateAsyncRef.current = mutateAsync;
  const resetSaveMutationRef = useRef(resetSaveMutation);
  resetSaveMutationRef.current = resetSaveMutation;

  const save = useCallback(async () => {
    if (!isDirty || isPending) {
      return;
    }
    await mutateAsyncRef.current();
  }, [isDirty, isPending]);

  const discard = useCallback(() => {
    setDisplayName(agent.display_name);
    setDescription(agent.description);
    setToolCategories(agent.tool_categories);
    setPromptSections({ ...baselinePromptSections });
    resetSaveMutationRef.current();
  }, [
    agent.description,
    agent.display_name,
    agent.tool_categories,
    baselinePromptSections,
  ]);

  useEffect(() => {
    const saveError = error instanceof Error ? error.message : null;
    setControls((previous) => {
      if (
        previous &&
        previous.isDirty === isDirty &&
        previous.isSaving === isPending &&
        previous.saveError === saveError &&
        previous.save === save &&
        previous.discard === discard
      ) {
        return previous;
      }
      return {
        isDirty,
        isSaving: isPending,
        saveError,
        save,
        discard,
      };
    });

    return () => setControls(null);
  }, [discard, error, isDirty, isPending, save, setControls]);

  const updatePromptSection = (key: string, content: string) => {
    setPromptSections((current) => ({ ...current, [key]: content }));
  };

  return {
    displayName,
    setDisplayName,
    description,
    setDescription,
    toolCategories,
    setToolCategories,
    promptSections,
    updatePromptSection,
    isDirty,
    isSaving: isPending,
    saveError: error instanceof Error ? error.message : null,
    save,
    discard,
  };
}
