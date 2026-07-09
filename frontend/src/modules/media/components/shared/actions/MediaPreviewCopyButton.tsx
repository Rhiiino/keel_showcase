// keel_web/src/modules/media/components/shared/actions/MediaPreviewCopyButton.tsx

// Copy-to-clipboard control for media form previews.

import { useCallback, useEffect, useRef, useState } from "react";

import {
  copyMediaToClipboard,
  type MediaClipboardSource,
} from "../../../lib/copy";

type MediaPreviewCopyButtonProps = {
  copySource: MediaClipboardSource | null;
  disabled?: boolean;
};

function CopyIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const copiedResetMs = 2000;

export function MediaPreviewCopyButton({
  copySource,
  disabled = false,
}: MediaPreviewCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const copiedTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setCopied(false);
    if (copiedTimeoutRef.current !== null) {
      window.clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = null;
    }
  }, [copySource]);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (disabled || isCopying || !copySource) {
        return;
      }

      setIsCopying(true);
      try {
        await copyMediaToClipboard(copySource);
        setCopied(true);
        if (copiedTimeoutRef.current !== null) {
          window.clearTimeout(copiedTimeoutRef.current);
        }
        copiedTimeoutRef.current = window.setTimeout(() => {
          setCopied(false);
          copiedTimeoutRef.current = null;
        }, copiedResetMs);
      } finally {
        setIsCopying(false);
      }
    },
    [copySource, disabled, isCopying],
  );

  const isDisabled = disabled || isCopying || copySource === null;
  const label = copied ? "Copied file" : isCopying ? "Copying file" : "Copy file";

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-label={label}
      title={label}
      onClick={(event) => void handleCopy(event)}
      className={[
        "pointer-events-auto absolute right-2.5 top-2.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg transition",
        "bg-stone-950/75 text-stone-100 ring-1 ring-white/10 backdrop-blur-sm",
        isDisabled
          ? "cursor-not-allowed opacity-45"
          : copied
            ? "text-emerald-200 ring-emerald-400/40 hover:bg-stone-950/85"
            : "hover:bg-stone-900/90 hover:text-white hover:ring-white/20",
      ].join(" ")}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}
