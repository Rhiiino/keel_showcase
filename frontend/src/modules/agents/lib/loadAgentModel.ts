// stack_sandbox/frontend_web/src/modules/agents/lib/loadAgentModel.ts

// Fetch agent turntable GLBs as ArrayBuffers, validate the glTF magic header,
// and expose stable blob: URLs for useGLTF. Avoids three.js FileLoader racing
// with cache clears and silently parsing SPA HTML from the frontend origin.

import { getApiBaseUrl } from "../../../lib/api";

const MIN_GLB_BYTES = 64;
const GLB_MAGIC = [0x67, 0x6c, 0x54, 0x46]; // "glTF"

const blobUrlBySource = new Map<string, string>();
const inflightBySource = new Map<string, Promise<string>>();

function isGlbArrayBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < MIN_GLB_BYTES) {
    return false;
  }
  const header = new Uint8Array(buffer, 0, 4);
  return GLB_MAGIC.every((byte, index) => header[index] === byte);
}

function resolveCatalogUrl(src: string): string {
  if (/^https?:\/\//i.test(src) || src.startsWith("blob:")) {
    return src;
  }
  // Relative /catalog/... must hit the API host, not the Vite SPA.
  const base = getApiBaseUrl().replace(/\/$/, "");
  return `${base}${src.startsWith("/") ? src : `/${src}`}`;
}

async function fetchGlbArrayBuffer(src: string): Promise<ArrayBuffer> {
  const url = resolveCatalogUrl(src);
  const response = await fetch(url, {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    cache: "no-cache",
  });

  if (!response.ok) {
    throw new Error(`GLB fetch failed (${response.status}) for ${url}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    throw new Error(
      `GLB URL returned HTML instead of a model (check API base URL): ${url}`,
    );
  }

  const buffer = await response.arrayBuffer();
  if (!isGlbArrayBuffer(buffer)) {
    const preview = new TextDecoder().decode(buffer.slice(0, 80));
    throw new Error(
      `GLB response was not a glTF binary (${buffer.byteLength} bytes) from ${url}: ${preview}`,
    );
  }

  return buffer;
}

/** Return a blob: URL for a validated agent GLB, caching by source URL. */
export function loadAgentModelBlobUrl(src: string): Promise<string> {
  const cached = blobUrlBySource.get(src);
  if (cached) {
    return Promise.resolve(cached);
  }

  const inflight = inflightBySource.get(src);
  if (inflight) {
    return inflight;
  }

  const promise = fetchGlbArrayBuffer(src)
    .then((buffer) => {
      const blobUrl = URL.createObjectURL(
        new Blob([buffer], { type: "model/gltf-binary" }),
      );
      blobUrlBySource.set(src, blobUrl);
      inflightBySource.delete(src);
      return blobUrl;
    })
    .catch((error) => {
      inflightBySource.delete(src);
      throw error;
    });

  inflightBySource.set(src, promise);
  return promise;
}

export function clearAgentModelBlobUrl(src: string): void {
  const blobUrl = blobUrlBySource.get(src);
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
    blobUrlBySource.delete(src);
  }
  inflightBySource.delete(src);
}
