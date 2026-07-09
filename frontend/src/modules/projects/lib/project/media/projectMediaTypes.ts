// stack_sandbox/frontend_web/src/modules/projects/lib/project/media/projectMediaTypes.ts

// Shared rules for allowed project media uploads (images, video, 3D, documents, text).

export const MODEL_3D_EXTENSIONS = new Set([
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

export const TEXT_FILE_EXTENSIONS = new Set([
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

export const DOCUMENT_FILE_EXTENSIONS = new Set([".pdf"]);

const ALLOWED_MEDIA_EXTENSIONS = new Set([
  ...MODEL_3D_EXTENSIONS,
  ...TEXT_FILE_EXTENSIONS,
  ...DOCUMENT_FILE_EXTENSIONS,
]);

const EXTRA_TEXT_MIME_TYPES = new Set([
  "application/pdf",
  "application/json",
  "application/xml",
  "text/markdown",
  "application/javascript",
  "application/typescript",
]);

export type ProjectMediaKind = "image" | "video" | "model_3d" | "other";

export function fileExtension(filename: string): string {
  if (!filename.includes(".")) {
    return "";
  }
  return filename.slice(filename.lastIndexOf(".")).toLowerCase();
}

export function isAllowedProjectMediaFile(file: File): boolean {
  const mime = file.type.trim().toLowerCase();
  if (mime.startsWith("image/") || mime.startsWith("video/")) {
    return true;
  }
  if (mime.startsWith("text/") || EXTRA_TEXT_MIME_TYPES.has(mime)) {
    return true;
  }

  const extension = fileExtension(file.name);
  if (extension && ALLOWED_MEDIA_EXTENSIONS.has(extension)) {
    return true;
  }

  if (mime === "application/octet-stream" && extension) {
    return ALLOWED_MEDIA_EXTENSIONS.has(extension);
  }

  return false;
}

export function inferMediaKindFromFile(file: File): ProjectMediaKind {
  if (file.type.startsWith("image/")) {
    return "image";
  }
  if (file.type.startsWith("video/")) {
    return "video";
  }

  const extension = fileExtension(file.name);
  if (MODEL_3D_EXTENSIONS.has(extension)) {
    return "model_3d";
  }

  return "other";
}

export const PROJECT_MEDIA_VALIDATION_ERROR =
  "Unsupported file type. Use an image, video, 3D model, PDF, markdown, or text file.";
