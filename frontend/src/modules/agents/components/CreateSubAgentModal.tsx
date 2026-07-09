// stack_sandbox/frontend_web/src/modules/agents/components/CreateSubAgentModal.tsx

// Modal form for creating a new sub-agent from the Agents page.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  agentsQueryKeys,
  createAgent,
  type AgentCreatePayload,
  type AgentSummary,
} from "../api";
import {
  EDITABLE_AGENT_PROMPT_SECTIONS,
  REQUIRED_AGENT_PROMPT_SECTION_KEYS,
  emptyPromptSectionDrafts,
} from "../lib/agentPromptSections";
import { AgentModelViewer } from "./AgentModelViewer";
import { AgentToolCategoryEditor } from "./AgentToolCategoryEditor";
import { EditableText } from "./EditableText";
import { SystemPromptSectionBlock } from "./SystemPromptSectionBlock";

const TILE_IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
const MODEL_3D_ACCEPT = ".glb,model/gltf-binary";

type CreateSubAgentModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (agent: AgentSummary) => void;
};

function revokeObjectUrl(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

export function CreateSubAgentModal({
  open,
  onClose,
  onCreated,
}: CreateSubAgentModalProps) {
  const queryClient = useQueryClient();
  const tileInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [toolCategories, setToolCategories] = useState<string[]>(["core"]);
  const [promptSections, setPromptSections] = useState(emptyPromptSectionDrafts);
  const [tileImageFile, setTileImageFile] = useState<File | null>(null);
  const [tilePreviewUrl, setTilePreviewUrl] = useState<string | null>(null);
  const [model3dFile, setModel3dFile] = useState<File | null>(null);
  const [model3dPreviewUrl, setModel3dPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setDisplayName("");
    setDescription("");
    setToolCategories(["core"]);
    setPromptSections(emptyPromptSectionDrafts());
    setTileImageFile(null);
    revokeObjectUrl(tilePreviewUrl);
    setTilePreviewUrl(null);
    setModel3dFile(null);
    revokeObjectUrl(model3dPreviewUrl);
    setModel3dPreviewUrl(null);
    setValidationError(null);
  }, [model3dPreviewUrl, tilePreviewUrl]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, open]);

  useEffect(() => {
    return () => {
      revokeObjectUrl(tilePreviewUrl);
      revokeObjectUrl(model3dPreviewUrl);
    };
  }, [model3dPreviewUrl, tilePreviewUrl]);

  const createMutation = useMutation({
    mutationFn: async (payload: {
      body: AgentCreatePayload;
      tileImage: File;
      model3d?: File | null;
    }) =>
      createAgent(payload.body, payload.tileImage, payload.model3d),
    onSuccess: async (agent) => {
      queryClient.setQueryData<AgentSummary[]>(
        agentsQueryKeys.catalog(),
        (current) => {
          const list = current ?? [];
          if (list.some((item) => item.id === agent.id)) {
            return list;
          }
          return [...list, agent];
        },
      );
      await queryClient.invalidateQueries({ queryKey: agentsQueryKeys.catalog() });
      await queryClient.invalidateQueries({ queryKey: agentsQueryKeys.all });
      onCreated(agent);
      handleClose();
    },
  });

  const updatePromptSection = (key: string, content: string) => {
    setPromptSections((current) => ({ ...current, [key]: content }));
  };

  const handleTileFileChange = (file: File | null) => {
    revokeObjectUrl(tilePreviewUrl);
    if (!file) {
      setTileImageFile(null);
      setTilePreviewUrl(null);
      return;
    }
    setTileImageFile(file);
    setTilePreviewUrl(URL.createObjectURL(file));
  };

  const handleModelFileChange = (file: File | null) => {
    revokeObjectUrl(model3dPreviewUrl);
    if (!file) {
      setModel3dFile(null);
      setModel3dPreviewUrl(null);
      return;
    }
    setModel3dFile(file);
    setModel3dPreviewUrl(URL.createObjectURL(file));
  };

  const validateForm = useMemo(() => {
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

  const handleSubmit = async () => {
    setValidationError(null);
    if (validateForm) {
      setValidationError(validateForm);
      return;
    }
    if (!tileImageFile) {
      return;
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

    try {
      await createMutation.mutateAsync({
        body: payload,
        tileImage: tileImageFile,
        model3d: model3dFile,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create agent.";
      setValidationError(message);
    }
  };

  if (!open) {
    return null;
  }

  const submitError =
    validationError ??
    (createMutation.error instanceof Error
      ? createMutation.error.message
      : null);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={handleClose}
    >
      <button
        type="button"
        aria-label="Close sub-agent creator"
        className="absolute inset-0 cursor-default"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create sub-agent"
        className="relative z-10 flex max-h-[min(92vh,56rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-stone-800 px-6 py-4">
          <div>
            <h2 className="text-lg font-medium text-stone-50">New sub-agent</h2>
            <p className="mt-1 text-sm text-stone-500">
              Keel can delegate to this agent and it can be selected in chat.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-3 py-1.5 text-sm text-stone-400 transition hover:bg-stone-900 hover:text-stone-200"
          >
            Cancel
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
            <section className="space-y-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-stone-600">
                  Portrait
                </p>
                <button
                  type="button"
                  onClick={() => tileInputRef.current?.click()}
                  className="mt-2 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-stone-700 bg-stone-900/40 transition hover:border-violet-400/40"
                >
                  {tilePreviewUrl ? (
                    <img
                      src={tilePreviewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="px-4 text-center text-sm text-stone-500">
                      Choose portrait image
                    </span>
                  )}
                </button>
                <input
                  ref={tileInputRef}
                  type="file"
                  accept={TILE_IMAGE_ACCEPT}
                  className="hidden"
                  onChange={(event) =>
                    handleTileFileChange(event.target.files?.[0] ?? null)
                  }
                />
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-stone-600">
                  3D model (optional)
                </p>
                {model3dPreviewUrl ? (
                  <div className="mt-2 space-y-2">
                    <AgentModelViewer
                      agentId="new-agent"
                      src={model3dPreviewUrl}
                      placeholderSrc={tilePreviewUrl ?? undefined}
                      className="h-48 w-full"
                    />
                    <button
                      type="button"
                      onClick={() => handleModelFileChange(null)}
                      className="text-xs text-stone-500 transition hover:text-stone-300"
                    >
                      Remove 3D model
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => modelInputRef.current?.click()}
                    className="mt-2 flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-stone-700 bg-stone-900/40 text-sm text-stone-500 transition hover:border-violet-400/40"
                  >
                    Add GLB model
                  </button>
                )}
                <input
                  ref={modelInputRef}
                  type="file"
                  accept={MODEL_3D_ACCEPT}
                  className="hidden"
                  onChange={(event) =>
                    handleModelFileChange(event.target.files?.[0] ?? null)
                  }
                />
              </div>
            </section>

            <div className="min-w-0 space-y-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-stone-600">
                  Name
                </p>
                <EditableText
                  as="h3"
                  value={displayName}
                  onChange={setDisplayName}
                  placeholder="e.g. Finance assistant"
                  className="mt-2 text-lg font-medium text-stone-50"
                />
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-stone-600">
                  Description
                </p>
                <EditableText
                  as="p"
                  value={description}
                  onChange={setDescription}
                  placeholder="Short summary Keel uses when routing to this agent."
                  className="mt-2 text-sm leading-relaxed text-stone-300"
                />
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-stone-600">
                  Tool categories
                </p>
                <div className="mt-2">
                  <AgentToolCategoryEditor
                    assignedCategories={toolCategories}
                    onChange={setToolCategories}
                  />
                </div>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-stone-600">
                  System prompt
                </p>
                <div className="mt-3 space-y-5">
                  {EDITABLE_AGENT_PROMPT_SECTIONS.map((section) => (
                    <SystemPromptSectionBlock
                      key={section.key}
                      section={section}
                      content={promptSections[section.key] ?? ""}
                      onChange={(value) => updatePromptSection(section.key, value)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-stone-800 px-6 py-4">
          {submitError ? (
            <p className="text-sm text-red-400">{submitError}</p>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={createMutation.isPending}
            className="rounded-lg bg-lime-400/90 px-4 py-2 text-sm font-medium text-stone-950 transition hover:bg-lime-300 disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating…" : "Create agent"}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
