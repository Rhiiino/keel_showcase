// stack_sandbox/frontend_web/src/modules/agents/components/TokenCountBadge.tsx

// Muted token count label for agent detail section headers.

const TOKEN_COUNT_TOOLTIP =
  "Estimated input tokens for this section using the selected provider and model. " +
  "Does not include conversation history or tool results. Anthropic counts are approximate.";

type TokenCountBadgeProps = {
  count: number | undefined;
  isEstimate?: boolean;
  isLoading?: boolean;
};

function formatTokenCount(count: number): string {
  return count.toLocaleString();
}

export function TokenCountBadge({
  count,
  isEstimate = false,
  isLoading = false,
}: TokenCountBadgeProps) {
  if (isLoading) {
    return (
      <span className="shrink-0 font-mono text-xs text-stone-600" aria-hidden>
        — tokens
      </span>
    );
  }

  if (count === undefined) {
    return null;
  }

  const prefix = isEstimate ? "~" : "";

  return (
    <span
      className="shrink-0 font-mono text-xs tabular-nums text-stone-500"
      title={TOKEN_COUNT_TOOLTIP}
    >
      {prefix}
      {formatTokenCount(count)} tokens
    </span>
  );
}

export function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) {
    const millions = tokens / 1_000_000;
    return Number.isInteger(millions) ? `${millions}M` : `${millions.toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    const thousands = Math.round(tokens / 1_000);
    return `${thousands}k`;
  }
  return tokens.toLocaleString();
}
