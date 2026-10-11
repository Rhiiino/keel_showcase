// frontend/vite.config.ts

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function parsePublicOrigin(origin: string | undefined) {
  if (!origin) {
    return null;
  }

  try {
    return new URL(origin);
  } catch {
    return null;
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devPort = Number(env.VITE_DEV_PORT ?? 5173);
  const previewPort = Number(env.VITE_PREVIEW_PORT ?? 5177);
  const devPublicOrigin = parsePublicOrigin(env.VITE_DEV_PUBLIC_ORIGIN);
  const apiBaseUrl = (env.VITE_API_BASE_URL ?? "http://127.0.0.1:9092").replace(/\/$/, "");

  return {
    plugins: [
      react(),
      {
        name: "keel-html-api-base",
        transformIndexHtml(html) {
          return html.replaceAll("%VITE_API_BASE_URL%", apiBaseUrl);
        },
      },
    ],
    assetsInclude: ["**/*.glb"],
    server: {
      port: devPort,
      strictPort: true,
      // Required when Caddy (or another reverse proxy) forwards keel.themidhunraj.com to this port.
      host: true,
      allowedHosts: ["keel.themidhunraj.com", "127.0.0.1", "localhost"],
      proxy: {
        // If a relative /catalog/... URL ever slips through, serve API assets
        // instead of the Vite SPA HTML fallback (which breaks GLB loading).
        "/catalog": {
          target: env.VITE_API_BASE_URL ?? "http://127.0.0.1:9092",
          changeOrigin: true,
        },
      },
      hmr: devPublicOrigin
        ? {
            host: devPublicOrigin.hostname,
            protocol: devPublicOrigin.protocol === "https:" ? "wss" : "ws",
            clientPort:
              devPublicOrigin.protocol === "https:"
                ? devPublicOrigin.port
                  ? Number(devPublicOrigin.port)
                  : 443
                : devPublicOrigin.port
                  ? Number(devPublicOrigin.port)
                  : 80,
          }
        : true,
    },
    preview: {
      port: previewPort,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: ["keel.themidhunraj.com", "127.0.0.1", "localhost"],
    },
  };
});
