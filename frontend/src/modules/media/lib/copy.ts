// keel_web/src/modules/media/lib/copy.ts

// Copy one media file to the system clipboard.

import { fetchMediaBlob } from "../api";

export type MediaClipboardSource =
  | { kind: "file"; file: File }
  | { kind: "media"; mediaId: string; mimeType: string };

async function writeBlobToClipboard(blob: Blob, mimeType: string): Promise<void> {
  if (!navigator.clipboard?.write) {
    throw new Error("Copy to clipboard is not supported in this browser.");
  }

  const type = mimeType || blob.type || "application/octet-stream";
  const clipboardBlob = blob.type === type ? blob : new Blob([blob], { type });

  await navigator.clipboard.write([
    new ClipboardItem({
      [type]: clipboardBlob,
    }),
  ]);
}

export async function copyMediaToClipboard(source: MediaClipboardSource): Promise<void> {
  if (source.kind === "file") {
    const file = source.file;
    const type = file.type || "application/octet-stream";
    await writeBlobToClipboard(file, type);
    return;
  }

  const blob = await fetchMediaBlob(source.mediaId);
  await writeBlobToClipboard(blob, source.mimeType || blob.type);
}
