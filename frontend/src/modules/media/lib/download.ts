// keel_web/src/modules/media/lib/download.ts

// Trigger a browser download for one stored media object.

import { fetchMediaBlob } from "../api";

export async function downloadMediaObject(
  mediaId: string,
  filename: string,
): Promise<void> {
  const blob = await fetchMediaBlob(mediaId);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename.trim() || "download";
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
