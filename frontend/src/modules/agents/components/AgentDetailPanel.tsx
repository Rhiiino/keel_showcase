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
  orchestratorPortraitSrc,
  subagentDisplayNameClassName,
  subagentModelSrc,
  subagentPortraitSrc,
} from "../lib/agentDisplay";
import { AgentModelSettings } from "./AgentModelSettings";
import { AgentModelViewer } from "./AgentModelViewer";
import { AgentSectionHeader } from "./AgentSectionHeader";
import { AgentStartChatButton } from "./AgentStartChatButton";
import { AgentToolCategoryEditor } from "./AgentToolCategoryEditor";
import { EditableText } from "./EditableText";
import { formatContextWindow } from "./TokenCountBadge";

type AgentDetailPanelProps = {
  agent: AgentSummary;
};

function SystemPromptSectionBlock({
  section,
  content,
  onChange,
}: {
  section: SystemPromptSection;
  content: string;
  onChange: (value: string) => void;
}) {
  const editable = section.editable !== false;

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
        className={[
          "whitespace-pre-wrap font-mono text-sm leading-relaxed",
          editable
            ? "text-stone-300"
            : "text-stone-500",
        ].join(" ")}
        editableClassName="px-3 py-2.5"
      />
    </section>
  );
}

function AgentSystemPromptBlock({
  sections,
  fallbackPrompt,
  isLoading,
  isError,
  promptSections,
  updatePromptSection,
}: {
  sections: SystemPromptSection[];
  fallbackPrompt?: string;
  isLoading: boolean;
  isError: boolean;
  promptSections: Record<string, string>;
  updatePromptSection: (key: string, content: string) => void;
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
}: {
  toolCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  toolsTokenCount?: number;
  isEstimate?: boolean;
  isLoading?: boolean;
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
        />
      </div>
    </div>
  );
}

function OrchestratorPortraitHero({ agent }: { agent: AgentSummary }) {
  return (
    <div
      className="flex h-64 w-56 shrink-0 items-center justify-center"
      aria-hidden
    >
      <div
        className={[
          "flex h-44 w-44 items-center justify-center rounded-2xl",
          "border border-lime-400/20 bg-stone-950/60",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.35)]",
        ].join(" ")}
      >
        <img
          src={orchestratorPortraitSrc(agent)}
          alt=""
          className="h-32 w-32 object-contain drop-shadow-md"
        />
      </div>
    </div>
  );
}

export function AgentDetailPanel({ agent }: AgentDetailPanelProps) {
  const promptQuery = useQuery({
    queryKey: agentsQueryKeys.systemPrompt(agent.id),
    queryFn: () => fetchAgentSystemPrompt(agent.id),
  });
  const editor = useAgentEditor(agent, promptQuery.data);
  const { usage, isLoading: usageLoading, isError: usageError } =
    useAgentContextUsage(agent);

  const showUsage = !usageError;
  const isEstimate = usage?.is_estimate ?? false;
  const modelSrc = subagentModelSrc(agent.id, agent.media);
  const showHeroColumn = Boolean(modelSrc || agent.is_orchestrator);

  const headerGridClass = showHeroColumn
    ? "grid-cols-[auto_minmax(0,1fr)_minmax(0,14rem)]"
    : "grid-cols-[minmax(0,1fr)_minmax(0,14rem)]";

  return (
    <section className="flex min-w-0 w-full flex-col">
      <div
        className={[
          "grid min-w-0 shrink-0 items-start gap-6",
          headerGridClass,
        ].join(" ")}
      >
        {showHeroColumn ? (
          <div className="flex shrink-0 flex-col items-center gap-4">
            {modelSrc ? (
              <AgentModelViewer
                agentId={agent.id}
                src={modelSrc}
                placeholderSrc={subagentPortraitSrc(agent.id, agent.media)}
                className="h-64 w-56"
              />
            ) : (
              <OrchestratorPortraitHero agent={agent} />
            )}
            <AgentStartChatButton
              agentId={agent.id}
              displayName={editor.displayName}
            />
          </div>
        ) : null}
        <div className="min-w-0">
          <EditableText
            as="h3"
            value={editor.displayName}
            onChange={editor.setDisplayName}
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
            className="mt-2 text-sm leading-relaxed text-stone-300"
            editableClassName="px-3 py-3"
          />
          {!agent.is_orchestrator && (
            <p className="mt-2 text-sm text-stone-400">Invoked via Keel delegation</p>
          )}
        </div>

        <div className="min-w-0 max-w-full border-l border-stone-800/50 pl-5">
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
            Model
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
        </div>
      </div>

      <div className="mt-8 grid min-w-0 grid-cols-[minmax(0,18rem)_minmax(0,1fr)] gap-6 border-t border-stone-800/50 pt-8 sm:gap-10">
        <AgentToolsColumn
          toolCategories={editor.toolCategories}
          onCategoriesChange={editor.setToolCategories}
          toolsTokenCount={showUsage ? usage?.tools_tokens : undefined}
          isEstimate={isEstimate}
          isLoading={usageLoading}
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
              sections={promptQuery.data?.sections ?? []}
              fallbackPrompt={promptQuery.data?.system_prompt}
              isLoading={promptQuery.isLoading}
              isError={promptQuery.isError}
              promptSections={editor.promptSections}
              updatePromptSection={editor.updatePromptSection}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
