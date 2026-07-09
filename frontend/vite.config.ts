// frontend/vite.config.ts

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devPort = Number(env.VITE_DEV_PORT ?? 5173);
  const previewPort = Number(env.VITE_PREVIEW_PORT ?? 5177);

  return {
    plugins: [react()],
    assetsInclude: ["**/*.glb"],
    server: {
      port: devPort,
      strictPort: true,
      allowedHosts: ["keel.themidhunraj.com", "127.0.0.1", "localhost"],
    },
    preview: {
      port: previewPort,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: ["keel.themidhunraj.com", "127.0.0.1", "localhost"],
    },
  };
});
