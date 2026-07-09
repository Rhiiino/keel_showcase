// keel_web/src/modules/media/lib/media.ts

// Media list display helpers and upload metadata.

export const MEDIA_STATUSES = ["pending", "ready"] as const;

export type MediaObjectStatus = (typeof MEDIA_STATUSES)[number];

export const MEDIA_KINDS = [
  "image",
  "video",
  "audio",
  "document",
  "model_3d",
  "other",
] as const;

export type MediaKind = (typeof MEDIA_KINDS)[number];

export const MEDIA_KIND_LABELS: Record<MediaKind, string> = {
  image: "Image",
  video: "Video",
  audio: "Audio",
  document: "Document",
  model_3d: "3D model",
  other: "Other",
};

export const MEDIA_STATUS_LABELS: Record<MediaObjectStatus, string> = {
  pending: "Pending",
  ready: "Ready",
};

export function isMediaObjectStatus(value: string): value is MediaObjectStatus {
  return (MEDIA_STATUSES as readonly string[]).includes(value);
}

export function mediaStatusLabel(status: string): string {
  return isMediaObjectStatus(status) ? MEDIA_STATUS_LABELS[status] : status;
}

export function mediaStatusPillClass(status: string): string {
  switch (status) {
    case "pending":
      return "bg-amber-950/60 text-amber-200 ring-amber-800/80";
    case "ready":
      return "bg-emerald-950/60 text-emerald-200 ring-emerald-800/80";
    default:
      return "bg-stone-900/80 text-stone-300 ring-stone-700/80";
  }
}

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatByteSizeWithBytes(bytes: number): string {
  return `${formatByteSize(bytes)} (${bytes.toLocaleString()} bytes)`;
}

export function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTimestampParts(
  value: string,
): { date: string; time: string } | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return {
    date: date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export function isMediaKind(value: string): value is MediaKind {
  return (MEDIA_KINDS as readonly string[]).includes(value);
}

export function mediaKindLabel(kind: string): string {
  return isMediaKind(kind) ? MEDIA_KIND_LABELS[kind] : kind;
}

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export function isVideoMimeType(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

export function supportsInlinePreview(mimeType: string): boolean {
  return isImageMimeType(mimeType) || isVideoMimeType(mimeType);
}

export const MAX_MEDIA_BYTES = 100 * 1024 * 1024;

const MODEL_3D_EXTENSIONS = new Set([
  ".stl",
  ".obj",
  ".gltf",
  ".glb",
  ".fbx",
  ".3mf",
  ".step",
  ".stp",
  ".iges",
  ".igs",
  ".dae",
  ".ply",
  ".wrl",
  ".x3d",
  ".usdz",
  ".usd",
  ".3ds",
  ".blend",
  ".ma",
  ".mb",
  ".c4d",
  ".amf",
  ".off",
  ".ac",
  ".ac3d",
]);

const TEXT_FILE_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".markdown",
  ".json",
  ".csv",
  ".tsv",
  ".xml",
  ".yaml",
  ".yml",
  ".log",
  ".html",
  ".htm",
  ".css",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".swift",
  ".c",
  ".cc",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".php",
  ".sh",
  ".bash",
  ".zsh",
  ".toml",
  ".ini",
  ".cfg",
  ".conf",
  ".env",
  ".rtf",
  ".tex",
  ".rst",
  ".adoc",
  ".asciidoc",
]);

const EXTRA_TEXT_MIME_TYPES = new Set([
  "application/pdf",
  "application/json",
  "application/xml",
  "text/markdown",
  "application/javascript",
  "application/typescript",
]);

const MODEL_3D_MIME_TYPES = new Set([
  "model/stl",
  "application/sla",
  "application/vnd.ms-pki.stl",
  "application/octet-stream",
  "model/obj",
  "model/gltf+json",
  "model/gltf-binary",
]);

function fileExtension(filename: string): string {
  const index = filename.lastIndexOf(".");
  if (index <= 0) {
    return "";
  }
  return filename.slice(index).toLowerCase();
}

/** Mirror backend classify_media for upload form previews. */
export function classifyMediaKind(mime: string, filename: string): MediaKind {
  if (mime.startsWith("image/")) {
    return "image";
  }
  if (mime.startsWith("video/")) {
    return "video";
  }
  if (mime.startsWith("audio/")) {
    return "audio";
  }

  const suffix = fileExtension(filename);
  if (MODEL_3D_EXTENSIONS.has(suffix) || MODEL_3D_MIME_TYPES.has(mime)) {
    return "model_3d";
  }
  if (suffix === ".pdf" || mime === "application/pdf") {
    return "document";
  }
  if (mime.startsWith("text/") || EXTRA_TEXT_MIME_TYPES.has(mime)) {
    return "document";
  }
  if (TEXT_FILE_EXTENSIONS.has(suffix)) {
    return "document";
  }
  return "other";
}

export type MediaFileMetadata = {
  filename: string;
  mimeType: string;
  byteSize: number;
  mediaKind: MediaKind;
};

export function deriveMediaFileMetadata(file: File): MediaFileMetadata {
  const mimeType = file.type || "application/octet-stream";
  return {
    filename: file.name,
    mimeType,
    byteSize: file.size,
    mediaKind: classifyMediaKind(mimeType, file.name),
  };
}
