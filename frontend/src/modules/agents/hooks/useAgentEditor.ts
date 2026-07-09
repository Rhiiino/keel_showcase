// stack_sandbox/frontend_web/src/modules/agents/hooks/useAgentEditor.ts

// Draft state and save orchestration for agent metadata, categories, prompt, and media.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  agentsQueryKeys,
  createAgent,
  updateAgent,
  updateAgentMedia,
  updateAgentSystemPrompt,
  type AgentCreatePayload,
  type AgentSummary,
  type AgentSystemPrompt,
  type SystemPromptSection,
} from "../api";
import { useAgentEditorContext } from "../context/AgentEditorContext";
import {
  EDITABLE_AGENT_PROMPT_SECTIONS,
  REQUIRED_AGENT_PROMPT_SECTION_KEYS,
  emptyPromptSectionDrafts,
} from "../lib/agentPromptSections";
import { isDraftAgent } from "../lib/draftAgent";

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

function revokeObjectUrl(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

type UseAgentEditorOptions = {
  onCreated?: (agent: AgentSummary) => void;
};

export function useAgentEditor(
  agent: AgentSummary,
  promptData: AgentSystemPrompt | undefined,
  options: UseAgentEditorOptions = {},
) {
  const queryClient = useQueryClient();
  const { setControls } = useAgentEditorContext();
  const isDraft = isDraftAgent(agent);
  const isOrchestrator = agent.is_orchestrator;

  const [displayName, setDisplayName] = useState(agent.display_name);
  const [description, setDescription] = useState(agent.description);
  const [toolCategories, setToolCategories] = useState(agent.tool_categories);
  const [promptSections, setPromptSections] = useState<PromptSectionDrafts>(() =>
    isDraft ? emptyPromptSectionDrafts() : {},
  );
  const [tileImageFile, setTileImageFile] = useState<File | null>(null);
  const [tilePreviewUrl, setTilePreviewUrl] = useState<string | null>(null);
  const [model3dFile, setModel3dFile] = useState<File | null>(null);
  const [model3dPreviewUrl, setModel3dPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(agent.display_name);
    setDescription(agent.description);
    setToolCategories(agent.tool_categories);
    setTileImageFile(null);
    revokeObjectUrl(tilePreviewUrl);
    setTilePreviewUrl(null);
    setModel3dFile(null);
    revokeObjectUrl(model3dPreviewUrl);
    setModel3dPreviewUrl(null);
    setValidationError(null);
    if (isDraft) {
      setPromptSections(emptyPromptSectionDrafts());
    }
  }, [agent.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isDraft || !promptData) {
      return;
    }
    setPromptSections(buildPromptDrafts(promptData.sections));
  }, [agent.id, isDraft, promptData]);

  useEffect(
    () => () => {
      revokeObjectUrl(tilePreviewUrl);
      revokeObjectUrl(model3dPreviewUrl);
    },
    [model3dPreviewUrl, tilePreviewUrl],
  );

  const baselinePromptSections = useMemo(() => {
    if (isDraft) {
      return emptyPromptSectionDrafts();
    }
    return promptData ? buildPromptDrafts(promptData.sections) : {};
  }, [isDraft, promptData]);

  const metadataDirty =
    !isOrchestrator &&
    (displayName.trim() !== agent.display_name ||
      description.trim() !== agent.description ||
      !categoriesEqual(toolCategories, agent.tool_categories));

  const promptDirty =
    !isOrchestrator &&
    !promptDraftsEqual(promptSections, baselinePromptSections);

  const mediaDirty = tileImageFile !== null || model3dFile !== null;

  const isDirty =
    isDraft ||
    metadataDirty ||
    promptDirty ||
    mediaDirty;

  const validateDraft = useCallback(() => {
    if (!displayName.trim()) {
      return "Name is required.";
    }
    if (!description.trim()) {
      return "Description is required.";
    }
    if (toolCategories.length === 0) {
      return "At least one tool category is required.";
    }
    for (const key of REQUIRED_AGENT_PROMPT_SECTION_KEYS) {
      if (!promptSections[key]?.trim()) {
        const section = EDITABLE_AGENT_PROMPT_SECTIONS.find(
          (item) => item.key === key,
        );
        const label = section?.label ?? "Identity";
        return `${label} is required.`;
      }
    }
    if (!tileImageFile) {
      return "Portrait image is required.";
    }
    return null;
  }, [description, displayName, promptSections, tileImageFile, toolCategories]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isDraft) {
        const validationMessage = validateDraft();
        if (validationMessage) {
          throw new Error(validationMessage);
        }
        if (!tileImageFile) {
          throw new Error("Portrait image is required.");
        }

        const payload: AgentCreatePayload = {
          display_name: displayName.trim(),
          description: description.trim(),
          tool_categories: toolCategories,
          system_prompt: {
            identity: promptSections.identity.trim(),
            purpose: promptSections.purpose.trim(),
            guidelines: promptSections.guidelines.trim(),
            domain_reference: promptSections.domain_reference.trim(),
            tool_guidance: promptSections.tool_guidance.trim() || undefined,
            safety: promptSections.safety.trim(),
          },
        };

        return createAgent(payload, tileImageFile, model3dFile);
      }

      const tasks: Promise<unknown>[] = [];
      let updatedAgentSummary: AgentSummary | undefined;

      if (metadataDirty) {
        tasks.push(
          updateAgent(agent.id, {
            display_name: displayName.trim(),
            description: description.trim(),
            tool_categories: toolCategories,
          }).then((updated) => {
            updatedAgentSummary = updated;
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

      if (mediaDirty) {
        tasks.push(
          updateAgentMedia(agent.id, {
            tileImage: tileImageFile,
            model3d: model3dFile,
          }).then((updated) => {
            updatedAgentSummary = updated;
          }),
        );
      }

      await Promise.all(tasks);
      return updatedAgentSummary ?? null;
    },
    onSuccess: async (updatedAgent) => {
      if (updatedAgent && !isDraft) {
        queryClient.setQueryData<AgentSummary[]>(
          agentsQueryKeys.catalog(),
          (current) =>
            current?.map((item) =>
              item.id === updatedAgent.id ? updatedAgent : item,
            ) ?? current,
        );
      }

      setValidationError(null);
      setTileImageFile(null);
      revokeObjectUrl(tilePreviewUrl);
      setTilePreviewUrl(null);
      setModel3dFile(null);
      revokeObjectUrl(model3dPreviewUrl);
      setModel3dPreviewUrl(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: agentsQueryKeys.catalog() }),
        queryClient.invalidateQueries({ queryKey: agentsQueryKeys.all }),
        ...(isDraft
          ? []
          : [
              queryClient.invalidateQueries({
                queryKey: agentsQueryKeys.systemPrompt(agent.id),
              }),
            ]),
      ]);

      if (updatedAgent && isDraft) {
        options.onCreated?.(updatedAgent);
      }
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
    setValidationError(null);
    await mutateAsyncRef.current();
  }, [isDirty, isPending]);

  const setTileImage = useCallback(
    (file: File | null) => {
      revokeObjectUrl(tilePreviewUrl);
      if (!file) {
        setTileImageFile(null);
        setTilePreviewUrl(null);
        return;
      }
      setTileImageFile(file);
      setTilePreviewUrl(URL.createObjectURL(file));
    },
    [tilePreviewUrl],
  );

  const setModel3d = useCallback(
    (file: File | null) => {
      revokeObjectUrl(model3dPreviewUrl);
      if (!file) {
        setModel3dFile(null);
        setModel3dPreviewUrl(null);
        return;
      }
      setModel3dFile(file);
      setModel3dPreviewUrl(URL.createObjectURL(file));
    },
    [model3dPreviewUrl],
  );

  const saveError =
    validationError ??
    (error instanceof Error ? error.message : null);

  useEffect(() => {
    setControls((previous) => {
      if (
        previous &&
        previous.isDraft === isDraft &&
        previous.isDirty === isDirty &&
        previous.isSaving === isPending &&
        previous.saveError === saveError &&
        previous.save === save
      ) {
        return previous;
      }
      return {
        isDraft,
        isDirty,
        isSaving: isPending,
        saveError,
        save,
      };
    });

    return () => setControls(null);
  }, [error, isDirty, isDraft, isPending, save, saveError, setControls]);

  const updatePromptSection = (key: string, content: string) => {
    setPromptSections((current) => ({ ...current, [key]: content }));
  };

  const fieldsEditable = !isOrchestrator;

  return {
    displayName,
    setDisplayName,
    description,
    setDescription,
    toolCategories,
    setToolCategories,
    promptSections,
    updatePromptSection,
    fieldsEditable,
    isDraft,
    isDirty,
    isSaving: isPending,
    saveError,
    save,
    tilePreviewUrl,
    model3dPreviewUrl,
    setTileImage,
    setModel3d,
    clearModel3d: () => setModel3d(null),
  };
}
