// stack_sandbox/frontend_web/src/modules/chat/components/message/MessageBubbleCopyButton.tsx

// Copy control for chat message bubbles.

import { useEffect, useRef, useState, type MouseEvent } from "react";

type MessageBubbleCopyButtonProps = {
  content: string;
  variant?: "user" | "assistant";
};

function IconCopy() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MessageBubbleCopyButton({
  content,
  variant = "assistant",
}: MessageBubbleCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    },
    [],
  );

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const text = content.trim();
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
      resetTimeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const buttonClass =
    variant === "user"
      ? copied
        ? "border-lime-300/40 bg-lime-950/30 text-lime-200"
        : "border-stone-900/40 bg-stone-950/25 text-stone-300 hover:border-stone-900/60 hover:bg-stone-950/40 hover:text-stone-100"
      : copied
        ? "border-lime-400/30 bg-lime-400/10 text-lime-300"
        : "border-stone-700/80 bg-stone-900/90 text-stone-400 hover:border-stone-600 hover:bg-stone-800 hover:text-stone-200";

  return (
    <div className="pointer-events-auto absolute right-2 top-2 z-10 flex items-center gap-1.5">
      {copied ? (
        <span
          role="status"
          aria-live="polite"
          className="rounded-md border border-stone-700 bg-stone-900/95 px-2 py-0.5 text-[10px] font-medium text-stone-300 shadow-lg"
        >
          Copied
        </span>
      ) : null}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied to clipboard" : "Copy message"}
        className={[
          "flex h-6 w-6 items-center justify-center rounded-md border transition",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400/40",
          buttonClass,
        ].join(" ")}
      >
        {copied ? <IconCheck /> : <IconCopy />}
      </button>
    </div>
  );
}
