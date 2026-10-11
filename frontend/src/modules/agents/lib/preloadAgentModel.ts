// stack_sandbox/frontend_web/src/modules/agents/lib/preloadAgentModel.ts

// Warm the three.js GLTF cache before AgentModelViewer mounts.
// Kept separate from the viewer component so Vite Fast Refresh stays stable.

import { useGLTF } from "@react-three/drei";

import { loadAgentModelBlobUrl } from "./loadAgentModel";

/**
 * Prefetch an agent turntable GLB into a blob: URL, then warm useGLTF.
 * Avoids loading SPA HTML (relative /catalog on the frontend host) and
 * racing with useGLTF.clear during mount.
 */
export function preloadAgentModel(src: string): void {
  void loadAgentModelBlobUrl(src)
    .then((blobUrl) => {
      useGLTF.preload(blobUrl);
    })
    .catch((error) => {
      console.warn("[preloadAgentModel] failed", src, error);
    });
}
