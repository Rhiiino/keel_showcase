// stack_sandbox/frontend_web/src/modules/chat/components/message/CopyableCodeBlock.tsx

// Fenced code block wrapper with copy-to-clipboard control.

import { useEffect, useRef, useState, type ReactNode } from "react";

type CopyableCodeBlockProps = {
  children: ReactNode;
};

function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CopyableCodeBlock({ children }: CopyableCodeBlockProps) {
  const preRef = useRef<HTMLPreElement>(null);
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

  const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    const text = preRef.current?.textContent ?? "";
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text.replace(/\n$/, ""));
      setCopied(true);
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
      resetTimeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="group relative my-3 first:mt-0 last:mb-0">
      <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
        {copied && (
          <span
            role="status"
            aria-live="polite"
            className="rounded-md border border-stone-700 bg-stone-900/95 px-2 py-1 text-[10px] font-medium text-stone-300 shadow-lg"
          >
            Copied to clipboard
          </span>
        )}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
          className={[
            "flex h-7 w-7 items-center justify-center rounded-lg border transition",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400/40",
            copied
              ? "border-lime-400/30 bg-lime-400/10 text-lime-300 opacity-100"
              : "border-stone-700/80 bg-stone-900/90 text-stone-400 opacity-70 hover:border-stone-600 hover:bg-stone-800 hover:text-stone-200 group-hover:opacity-100",
          ].join(" ")}
        >
          {copied ? <IconCheck /> : <IconCopy />}
        </button>
      </div>

      <pre
        ref={preRef}
        className="chat-code-block scrollbar-subtle overflow-x-auto rounded-xl border border-stone-800 pt-9"
      >
        {children}
      </pre>
    </div>
  );
}
