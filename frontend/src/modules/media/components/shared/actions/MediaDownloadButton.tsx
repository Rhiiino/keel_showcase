// keel_web/src/modules/media/components/shared/actions/MediaDownloadButton.tsx

// Download action as an icon button or labeled button.

import { useState } from "react";

import { downloadMediaObject } from "../../../lib/download";

type MediaDownloadButtonProps = {
  mediaId: string;
  filename: string;
  disabled?: boolean;
  variant?: "icon" | "button" | "circle";
  label?: string;
};

function DownloadIcon({ className = "h-4 w-4" }: { className?: string }) {
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
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function MediaDownloadButton({
  mediaId,
  filename,
  disabled = false,
  variant = "icon",
  label = "Download file",
}: MediaDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || isDownloading) {
      return;
    }

    setIsDownloading(true);
    try {
      await downloadMediaObject(mediaId, filename);
    } finally {
      setIsDownloading(false);
    }
  };

  if (variant === "circle") {
    return (
      <button
        type="button"
        disabled={disabled || isDownloading}
        aria-label={isDownloading ? "Downloading file" : `Download ${filename}`}
        title={isDownloading ? "Downloading file" : `Download ${filename}`}
        onClick={(event) => void handleDownload(event)}
        className={[
          "inline-flex h-12 w-12 items-center justify-center rounded-full transition",
          "shadow-lg shadow-sky-950/40 ring-1 ring-inset",
          disabled || isDownloading
            ? "cursor-not-allowed bg-stone-900/40 text-stone-600 opacity-50 ring-stone-800/60"
            : "bg-sky-500/20 text-sky-100 ring-sky-400/45 hover:bg-sky-500/30 hover:text-white hover:ring-sky-300/70",
        ].join(" ")}
      >
        <DownloadIcon className="h-5 w-5" />
      </button>
    );
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        disabled={disabled || isDownloading}
        onClick={(event) => void handleDownload(event)}
        className={[
          "rounded-lg px-4 py-2.5 text-sm font-medium transition",
          disabled || isDownloading
            ? "cursor-not-allowed text-stone-600 opacity-50"
            : "text-stone-300 ring-1 ring-stone-800/80 hover:bg-stone-900/70 hover:text-stone-100",
        ].join(" ")}
      >
        {isDownloading ? "Downloading…" : label}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || isDownloading}
      aria-label={isDownloading ? "Downloading file" : `Download ${filename}`}
      title={isDownloading ? "Downloading file" : `Download ${filename}`}
      onClick={(event) => void handleDownload(event)}
      className={[
        "inline-flex h-8 w-8 items-center justify-center transition",
        disabled || isDownloading
          ? "cursor-not-allowed text-stone-600 opacity-50"
          : "text-sky-200 hover:text-sky-100",
      ].join(" ")}
    >
      <DownloadIcon />
    </button>
  );
}
