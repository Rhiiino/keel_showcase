// stack_sandbox/frontend_web/src/modules/agents/lib/agentPromptSections.ts

// Editable system prompt section metadata for agent create/edit forms.

import type { SystemPromptSection } from "../api";

export const EDITABLE_AGENT_PROMPT_SECTIONS: SystemPromptSection[] = [
  {
    key: "identity",
    label: null,
    content: "",
    editable: true,
  },
  {
    key: "purpose",
    label: "Purpose",
    content: "",
    editable: true,
  },
  {
    key: "guidelines",
    label: "Guidelines",
    content: "",
    editable: true,
  },
  {
    key: "domain_reference",
    label: "Domain reference",
    content: "",
    editable: true,
  },
  {
    key: "tool_guidance",
    label: "Tool guidance",
    content: "",
    editable: true,
  },
  {
    key: "safety",
    label: "Safety",
    content: "",
    editable: true,
  },
];

export const REQUIRED_AGENT_PROMPT_SECTION_KEYS = new Set([
  "identity",
  "purpose",
  "guidelines",
  "domain_reference",
  "safety",
]);

export function emptyPromptSectionDrafts(): Record<string, string> {
  const drafts: Record<string, string> = {};
  for (const section of EDITABLE_AGENT_PROMPT_SECTIONS) {
    drafts[section.key] = "";
  }
  return drafts;
}
