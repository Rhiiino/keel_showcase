// stack_sandbox/frontend_web/src/modules/agents/components/AgentSectionHeader.tsx

// Section label with optional token count badge aligned to the right.

import type { ReactNode } from "react";

import { TokenCountBadge } from "./TokenCountBadge";

type AgentSectionHeaderProps = {
  label: string;
  tokenCount?: number;
  isEstimate?: boolean;
  isLoading?: boolean;
  action?: ReactNode;
};

export function AgentSectionHeader({
  label,
  tokenCount,
  isEstimate,
  isLoading,
  action,
}: AgentSectionHeaderProps) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <div className="flex items-center gap-3">
        {action}
        <TokenCountBadge
          count={tokenCount}
          isEstimate={isEstimate}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
