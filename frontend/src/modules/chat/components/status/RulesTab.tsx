// stack_sandbox/frontend_web/src/modules/chat/components/status/RulesTab.tsx

// Rules status panel tab — per-user system prompt rules with multi-agent assignment.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import {
  agentsQueryKeys,
  fetchAgents,
  type AgentSummary,
} from "../../../agents/api";
import {
  chatQueryKeys,
  createRule,
  deleteRule,
  fetchRules,
  updateRule,
  type ChatRule,
} from "../../api";
import { SwitchToggle } from "../common";
import { GeneralTabSection } from "./GeneralTabSection";

type RuleFormState = {
  title: string;
  content: string;
  agent_ids: string[];
  is_active: boolean;
};

const EMPTY_FORM: RuleFormState = {
  title: "",
  content: "",
  agent_ids: [],
  is_active: true,
};

function agentLabel(agentId: string, agents: AgentSummary[]): string {
  return agents.find((agent) => agent.id === agentId)?.display_name ?? agentId;
}

function RuleForm({
  agents,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  isPending,
}: {
  agents: AgentSummary[];
  initial: RuleFormState;
  submitLabel: string;
  onSubmit: (values: RuleFormState) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<RuleFormState>(initial);

  const toggleAgent = (agentId: string) => {
    setForm((current) => ({
      ...current,
      agent_ids: current.agent_ids.includes(agentId)
        ? current.agent_ids.filter((id) => id !== agentId)
        : [...current.agent_ids, agentId],
    }));
  };

  const canSubmit =
    form.title.trim().length > 0 &&
    form.content.trim().length > 0 &&
    form.agent_ids.length > 0 &&
    !isPending;

  return (
    <div className="rounded-lg border border-stone-800/90 bg-stone-950/70 p-3">
      <label className="block">
        <span className="font-mono text-[9px] uppercase tracking-wider text-stone-600">
          Title
        </span>
        <input
          type="text"
          value={form.title}
          maxLength={200}
          onChange={(event) =>
            setForm((current) => ({ ...current, title: event.target.value }))
          }
          className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950 px-2.5 py-2 text-sm text-stone-100 focus:border-lime-400/40 focus:outline-none"
        />
      </label>

      <label className="mt-3 block">
        <span className="font-mono text-[9px] uppercase tracking-wider text-stone-600">
          Content
        </span>
        <textarea
          value={form.content}
          rows={4}
          onChange={(event) =>
            setForm((current) => ({ ...current, content: event.target.value }))
          }
          className="mt-1 w-full resize-y rounded-lg border border-stone-800 bg-stone-950 px-2.5 py-2 text-sm text-stone-100 focus:border-lime-400/40 focus:outline-none"
        />
      </label>

      <div className="mt-3">
        <span className="font-mono text-[9px] uppercase tracking-wider text-stone-600">
          Agents
        </span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {agents.map((agent) => {
            const selected = form.agent_ids.includes(agent.id);
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => toggleAgent(agent.id)}
                className={[
                  "rounded-lg border px-2.5 py-1.5 text-xs transition",
                  selected
                    ? "border-lime-400/50 bg-lime-400/10 text-stone-100"
                    : "border-stone-800 bg-stone-950/40 text-stone-500 hover:border-stone-700",
                ].join(" ")}
              >
                {agent.display_name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <SwitchToggle
          checked={form.is_active}
          onChange={(is_active) =>
            setForm((current) => ({ ...current, is_active }))
          }
          label="Active"
        />
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => onSubmit(form)}
          className="rounded-lg border border-lime-400/40 bg-lime-400/10 px-3 py-1.5 text-xs font-medium text-stone-100 transition hover:bg-lime-400/15 disabled:opacity-50"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-xs text-stone-500 transition hover:bg-stone-900 hover:text-stone-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function RuleCard({
  rule,
  agents,
  onEdit,
  onToggleActive,
  onDelete,
  togglePending,
}: {
  rule: ChatRule;
  agents: AgentSummary[];
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  togglePending: boolean;
}) {
  return (
    <li
      className={[
        "rounded-lg border bg-stone-950/70 px-3 py-2.5",
        rule.is_active
          ? "border-stone-800/90"
          : "border-stone-800/60 opacity-70",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-stone-100">{rule.title}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">
            {rule.content}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {rule.agent_ids.map((agentId) => (
              <span
                key={agentId}
                className="rounded bg-stone-800/80 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-stone-400 ring-1 ring-stone-700/60"
              >
                {agentLabel(agentId, agents)}
              </span>
            ))}
          </div>
        </div>
        <SwitchToggle
          checked={rule.is_active}
          onChange={() => onToggleActive()}
          disabled={togglePending}
          label="Active"
        />
      </div>

      <div className="mt-2 flex gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="rounded px-2 py-1 text-xs text-stone-500 transition hover:bg-stone-900 hover:text-stone-300"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded px-2 py-1 text-xs text-stone-500 transition hover:bg-red-950/40 hover:text-red-400"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export function RulesTab() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const rulesQuery = useQuery({
    queryKey: chatQueryKeys.rules(),
    queryFn: fetchRules,
  });

  const agentsQuery = useQuery({
    queryKey: agentsQueryKeys.catalog(),
    queryFn: fetchAgents,
  });

  const agents = agentsQuery.data ?? [];

  const invalidateRules = () => {
    queryClient.invalidateQueries({ queryKey: chatQueryKeys.rules() });
    queryClient.invalidateQueries({ queryKey: agentsQueryKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: createRule,
    onSuccess: () => {
      setActionError(null);
      setShowCreateForm(false);
      invalidateRules();
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      ruleId,
      payload,
    }: {
      ruleId: number;
      payload: Parameters<typeof updateRule>[1];
    }) => updateRule(ruleId, payload),
    onSuccess: () => {
      setActionError(null);
      setEditingRuleId(null);
      invalidateRules();
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRule,
    onSuccess: () => {
      setActionError(null);
      invalidateRules();
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const editingRule = useMemo(
    () => rulesQuery.data?.find((rule) => rule.id === editingRuleId) ?? null,
    [editingRuleId, rulesQuery.data],
  );

  const handleCreate = (values: RuleFormState) => {
    createMutation.mutate({
      title: values.title.trim(),
      content: values.content.trim(),
      agent_ids: values.agent_ids,
      is_active: values.is_active,
    });
  };

  const handleUpdate = (values: RuleFormState) => {
    if (editingRuleId === null) {
      return;
    }
    updateMutation.mutate({
      ruleId: editingRuleId,
      payload: {
        title: values.title.trim(),
        content: values.content.trim(),
        agent_ids: values.agent_ids,
        is_active: values.is_active,
      },
    });
  };

  const handleDelete = (rule: ChatRule) => {
    if (!window.confirm(`Delete rule "${rule.title}"?`)) {
      return;
    }
    deleteMutation.mutate(rule.id);
  };

  const handleToggleActive = (rule: ChatRule) => {
    updateMutation.mutate({
      ruleId: rule.id,
      payload: { is_active: !rule.is_active },
    });
  };

  return (
    <GeneralTabSection
      title="Rules"
      className="flex min-h-0 flex-1 flex-col bg-stone-950/20"
      headerAction={
        <button
          type="button"
          title="New rule"
          aria-label="New rule"
          onClick={() => {
            setEditingRuleId(null);
            setShowCreateForm((open) => !open);
          }}
          className="rounded p-1 text-stone-500 transition hover:bg-stone-800 hover:text-lime-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden
          >
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
        </button>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2">
        {actionError && (
          <p className="mb-2 text-xs text-red-400">{actionError}</p>
        )}

        {showCreateForm && !editingRule && agents.length > 0 && (
          <div className="mb-3">
            <RuleForm
              agents={agents}
              initial={EMPTY_FORM}
              submitLabel={createMutation.isPending ? "Creating…" : "Create rule"}
              onSubmit={handleCreate}
              onCancel={() => setShowCreateForm(false)}
              isPending={createMutation.isPending}
            />
          </div>
        )}

        {editingRule && agents.length > 0 && (
          <div className="mb-3">
            <RuleForm
              agents={agents}
              initial={{
                title: editingRule.title,
                content: editingRule.content,
                agent_ids: editingRule.agent_ids,
                is_active: editingRule.is_active,
              }}
              submitLabel={updateMutation.isPending ? "Saving…" : "Save rule"}
              onSubmit={handleUpdate}
              onCancel={() => setEditingRuleId(null)}
              isPending={updateMutation.isPending}
            />
          </div>
        )}

        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto">
          {rulesQuery.isLoading && (
            <p className="py-8 text-center text-sm text-stone-500">Loading rules…</p>
          )}

          {rulesQuery.isError && (
            <p className="py-8 text-center text-sm text-red-400">
              Failed to load rules.
            </p>
          )}

          {!rulesQuery.isLoading && (rulesQuery.data?.length ?? 0) === 0 && (
            <p className="py-8 text-center text-sm text-stone-500">
              No rules yet.
            </p>
          )}

          {rulesQuery.data && rulesQuery.data.length > 0 && (
            <ul className="space-y-2">
              {rulesQuery.data.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  agents={agents}
                  onEdit={() => {
                    setShowCreateForm(false);
                    setEditingRuleId(rule.id);
                  }}
                  onToggleActive={() => handleToggleActive(rule)}
                  onDelete={() => handleDelete(rule)}
                  togglePending={updateMutation.isPending}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </GeneralTabSection>
  );
}
