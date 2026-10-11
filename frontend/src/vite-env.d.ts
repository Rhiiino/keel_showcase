// keel_web/src/vite-env.d.ts

// Vite client type references and ImportMetaEnv declarations for frontend
// env vars (VITE_API_BASE_URL).

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __KEEL_SHELL_WALLPAPER_URL__?: string;
  __KEEL_SHELL_SHOW_LOADING__?: boolean;
}

declare module "*.glb" {
  const src: string;
  export default src;
}
