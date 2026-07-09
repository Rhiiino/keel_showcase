// stack_sandbox/frontend_web/src/modules/chat/lib/message/conversationTokenEstimate.ts

// Actual provider-reported context usage for the latest completed assistant turn.

import type { Message } from "../../api";

/** Return the latest completed turn's full model usage, including prompt and completion tokens. */
export function getLatestActualContextTokensUsed(messages: Message[]): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "assistant") {
      continue;
    }

    const inputTokens = message.input_tokens ?? 0;
    const outputTokens = message.output_tokens ?? 0;
    if (inputTokens > 0 || outputTokens > 0) {
      return inputTokens + outputTokens;
    }
  }

  return 0;
}
