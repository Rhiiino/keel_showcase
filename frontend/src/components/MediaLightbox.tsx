// keel_web/src/components/MediaLightbox.tsx

// Full-screen preview for media (image or PDF).

import { useEffect } from "react";
import { createPortal } from "react-dom";

type MediaLightboxProps = {
  kind: "image" | "pdf";
  src: string;
  title: string;
  onClose: () => void;
};

export function MediaLightbox({
  kind,
  src,
  title,
  onClose,
}: MediaLightboxProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Media preview"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 rounded-xl bg-stone-900/80 px-3 py-1.5 text-sm text-stone-200 shadow-lg hover:bg-stone-800"
      >
        Close
      </button>
      <div
        className="max-h-[90vh] max-w-[min(96vw,72rem)] overflow-hidden rounded-2xl bg-stone-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {kind === "image" ? (
          <img
            src={src}
            alt={title}
            className="max-h-[90vh] max-w-full object-contain"
            draggable={false}
          />
        ) : (
          <iframe
            src={src}
            title={title}
            className="h-[min(85vh,48rem)] w-[min(96vw,48rem)] bg-stone-900"
          />
        )}
      </div>
    </div>,
    document.body,
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function MediaTrashButton({
  onClick,
  disabled,
  className = "",
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label="Remove media"
      className={[
        "inline-flex h-6 w-6 items-center justify-center rounded-md bg-stone-950/80 text-red-400 ring-1 ring-stone-700/80 transition",
        "opacity-0 group-hover:opacity-100",
        disabled ? "cursor-not-allowed opacity-50" : "hover:bg-red-950/50 hover:text-red-300",
        className,
      ].join(" ")}
    >
      <TrashIcon />
    </button>
  );
}
