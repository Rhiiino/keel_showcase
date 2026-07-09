// stack_sandbox/frontend_web/src/modules/agents/components/AgentDetailPanel.tsx

// Tools and system-prompt preview for a selected agent (open layout, no panel chrome).

import { useQuery } from "@tanstack/react-query";

import {
  agentsQueryKeys,
  fetchAgentSystemPrompt,
  type AgentSummary,
  type SystemPromptSection,
} from "../api";
import { useAgentEditor } from "../hooks/useAgentEditor";
import { useAgentContextUsage } from "../hooks/useAgentContextUsage";
import {
  subagentDisplayNameClassName,
} from "../lib/agentDisplay";
import { isDraftAgent } from "../lib/draftAgent";
import { EDITABLE_AGENT_PROMPT_SECTIONS } from "../lib/agentPromptSections";
import { AgentMediaHero } from "./AgentMediaHero";
import { AgentModelSettings } from "./AgentModelSettings";
import { AgentSectionHeader } from "./AgentSectionHeader";
import { AgentStartChatButton } from "./AgentStartChatButton";
import { AgentToolCategoryEditor } from "./AgentToolCategoryEditor";
import { EditableText } from "./EditableText";
import { SystemPromptSectionBlock } from "./SystemPromptSectionBlock";
import { formatContextWindow } from "./TokenCountBadge";

type AgentDetailPanelProps = {
  agent: AgentSummary;
  onCreated?: (agent: AgentSummary) => void;
};

function AgentSystemPromptBlock({
  sections,
  fallbackPrompt,
  isLoading,
  isError,
  promptSections,
  updatePromptSection,
  editingEnabled,
}: {
  sections: SystemPromptSection[];
  fallbackPrompt?: string;
  isLoading: boolean;
  isError: boolean;
  promptSections: Record<string, string>;
  updatePromptSection: (key: string, content: string) => void;
  editingEnabled: boolean;
}) {
  if (isLoading) {
    return <p className="text-sm text-stone-500">Loading prompt…</p>;
  }

  if (isError) {
    return <p className="text-sm text-red-400">Failed to load system prompt.</p>;
  }

  return (
    <div className="scrollbar-hidden max-h-[min(32rem,50vh)] space-y-6 overflow-y-auto overscroll-contain px-1 py-0.5">
      {sections.length > 0 ? (
        sections.map((section) => (
          <SystemPromptSectionBlock
            key={section.key}
            section={section}
            content={promptSections[section.key] ?? section.content}
            onChange={(value) => updatePromptSection(section.key, value)}
            editingEnabled={editingEnabled}
          />
        ))
      ) : (
        <EditableText
          value={fallbackPrompt ?? ""}
          onChange={() => {}}
          editable={false}
          className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-stone-300"
        />
      )}
    </div>
  );
}

function AgentToolsColumn({
  toolCategories,
  onCategoriesChange,
  toolsTokenCount,
  isEstimate,
  isLoading,
  readOnly,
}: {
  toolCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  toolsTokenCount?: number;
  isEstimate?: boolean;
  isLoading?: boolean;
  readOnly: boolean;
}) {
  return (
    <div className="min-w-0">
      <AgentSectionHeader
        label="Tools"
        tokenCount={toolsTokenCount}
        isEstimate={isEstimate}
        isLoading={isLoading}
      />

      <div className="mt-2">
        <AgentToolCategoryEditor
          assignedCategories={toolCategories}
          onChange={onCategoriesChange}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}

export function AgentDetailPanel({ agent, onCreated }: AgentDetailPanelProps) {
  const isDraft = isDraftAgent(agent);
  const promptQuery = useQuery({
    queryKey: agentsQueryKeys.systemPrompt(agent.id),
    queryFn: () => fetchAgentSystemPrompt(agent.id),
    enabled: !isDraft,
  });
  const editor = useAgentEditor(agent, promptQuery.data, { onCreated });
  const { usage, isLoading: usageLoading, isError: usageError } =
    useAgentContextUsage(agent);

  const showUsage = !usageError && !isDraft;
  const isEstimate = usage?.is_estimate ?? false;
  const fieldsEditable = editor.fieldsEditable;
  const promptSections = isDraft
    ? EDITABLE_AGENT_PROMPT_SECTIONS
    : (promptQuery.data?.sections ?? []);

  const headerGridClass =
    "grid-cols-[auto_minmax(0,1fr)_minmax(0,14rem)]";

  return (
    <section className="flex min-w-0 w-full flex-col">
      <div
        className={[
          "grid min-w-0 shrink-0 items-start gap-6",
          headerGridClass,
        ].join(" ")}
      >
        <div className="flex shrink-0 flex-col items-center gap-4">
          <AgentMediaHero
            agent={agent}
            editable={fieldsEditable}
            tilePreviewUrl={editor.tilePreviewUrl}
            model3dPreviewUrl={editor.model3dPreviewUrl}
            onTileImageChange={editor.setTileImage}
            onModel3dChange={editor.setModel3d}
          />
          {!isDraft ? (
            <AgentStartChatButton
              agentId={agent.id}
              displayName={editor.displayName}
            />
          ) : null}
        </div>
        <div className="min-w-0">
          <EditableText
            as="h3"
            value={editor.displayName}
            onChange={editor.setDisplayName}
            editable={fieldsEditable}
            placeholder={isDraft ? "e.g. Finance assistant" : undefined}
            className={[
              "text-xl font-medium outline-none",
              agent.is_orchestrator
                ? "text-stone-50"
                : subagentDisplayNameClassName(agent.id),
            ].join(" ")}
          />
          <EditableText
            as="p"
            value={editor.description}
            onChange={editor.setDescription}
            editable={fieldsEditable}
            placeholder={
              isDraft
                ? "Short summary Keel uses when routing to this agent."
                : undefined
            }
            className="mt-2 text-sm leading-relaxed text-stone-300"
            editableClassName="px-3 py-3"
          />
          {!agent.is_orchestrator && !isDraft ? (
            <p className="mt-2 text-sm text-stone-400">Invoked via Keel delegation</p>
          ) : null}
        </div>

        <div className="min-w-0 max-w-full border-l border-stone-800/50 pl-5">
          {!isDraft ? (
            <>
              <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
                Provider
              </p>
              <div className="mt-2">
                <AgentModelSettings
                  agentId={agent.id}
                  isOrchestrator={agent.is_orchestrator}
                  layout="column"
                />
              </div>
              {showUsage && (
                <p
                  className="mt-3 text-xs leading-relaxed text-stone-500"
                  title="Estimated input tokens for system prompt plus tool definitions, before conversation history."
                >
                  Context overhead{" "}
                  {usageLoading ? (
                    <span className="font-mono text-stone-600">—</span>
                  ) : usage ? (
                    <span className="font-mono tabular-nums text-stone-400">
                      {isEstimate ? "~" : ""}
                      {usage.total_tokens.toLocaleString()} /{" "}
                      {formatContextWindow(usage.max_context_window)}
                    </span>
                  ) : null}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-stone-500">
              Provider and model can be configured after the agent is created.
            </p>
          )}
        </div>
      </div>

      {!agent.is_orchestrator ? (
        <div className="mt-8 grid min-w-0 grid-cols-[minmax(0,18rem)_minmax(0,1fr)] gap-6 border-t border-stone-800/50 pt-8 sm:gap-10">
          <AgentToolsColumn
            toolCategories={editor.toolCategories}
            onCategoriesChange={editor.setToolCategories}
            toolsTokenCount={showUsage ? usage?.tools_tokens : undefined}
            isEstimate={isEstimate}
            isLoading={usageLoading}
            readOnly={!fieldsEditable}
          />

          <div className="min-w-0 border-l border-stone-800/50 pl-6 sm:pl-10">
            <AgentSectionHeader
              label="System prompt"
              tokenCount={showUsage ? usage?.system_prompt_tokens : undefined}
              isEstimate={isEstimate}
              isLoading={usageLoading}
            />
            <div className="mt-3">
              <AgentSystemPromptBlock
                sections={promptSections}
                fallbackPrompt={promptQuery.data?.system_prompt}
                isLoading={!isDraft && promptQuery.isLoading}
                isError={!isDraft && promptQuery.isError}
                promptSections={editor.promptSections}
                updatePromptSection={editor.updatePromptSection}
                editingEnabled={fieldsEditable}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
