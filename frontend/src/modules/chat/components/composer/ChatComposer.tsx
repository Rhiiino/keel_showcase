// stack_sandbox/frontend_web/src/modules/chat/components/composer/ChatComposer.tsx

// Message input and send button for the active conversation.

import { useState } from "react";

type ChatComposerProps = {
  disabled?: boolean;
  onSend: (content: string) => void;
};

export function ChatComposer({ disabled = false, onSend }: ChatComposerProps) {
  const [draft, setDraft] = useState("");

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (!trimmed || disabled) {
      return;
    }
    onSend(trimmed);
    setDraft("");
  };

  return (
    <form
      className="shrink-0 border-t border-stone-800/80 px-4 py-4 sm:px-6"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <label htmlFor="chat-input" className="sr-only">
        Message
      </label>
      <div className="flex gap-3">
        <textarea
          id="chat-input"
          rows={2}
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={
            disabled ? "Select a conversation to start chatting…" : "Type a message…"
          }
          className="min-h-[3rem] flex-1 resize-none rounded-xl border border-stone-800 bg-stone-950/60 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:border-lime-400/40 focus:outline-none focus:ring-1 focus:ring-lime-400/30 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !draft.trim()}
          className="self-end rounded-xl bg-lime-400/90 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </form>
  );
}
