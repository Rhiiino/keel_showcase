// stack_sandbox/frontend_web/src/modules/chat/lib/model/modelDisplayUtils.ts

// Format model context windows and pricing for the General tab UI.

import type { ChatModel } from "../../api";

export function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) {
    const millions = tokens / 1_000_000;
    return Number.isInteger(millions) ? `${millions}M` : `${millions.toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${Math.round(tokens / 1_000)}k`;
  }
  return String(tokens);
}

function formatUsdPer1M(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (value >= 1) {
    return `$${value.toFixed(2)}`;
  }
  if (value >= 0.01) {
    return `$${value.toFixed(2)}`;
  }
  return `$${value.toFixed(3)}`;
}

export function formatModelPricing(model: ChatModel): string {
  const input = formatUsdPer1M(model.input_price_per_1m);
  const output = formatUsdPer1M(model.output_price_per_1m);
  if (input === "—" && output === "—") {
    return "Pricing unavailable";
  }
  return `${input} in / ${output} out per 1M`;
}

export function formatModelOptionMeta(model: ChatModel): string {
  return `${formatContextWindow(model.max_context_window)} · ${formatModelPricing(model)}`;
}

export function formatModelSummaryLine(model: ChatModel): string {
  return `${model.id} · ${formatContextWindow(model.max_context_window)} · ${formatModelPricing(model)}`;
}
