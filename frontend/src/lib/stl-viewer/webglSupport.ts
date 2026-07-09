// stack_sandbox/frontend_web/src/modules/test/lib/viewer/webglSupport.ts

// WebGL context helpers — tuned for Chrome's stricter context lifecycle rules.

const CONTEXT_OPTIONS: WebGLContextAttributes = {
  alpha: false,
  antialias: false,
  depth: true,
  stencil: false,
  failIfMajorPerformanceCaveat: false,
  powerPreference: "default",
};

function isChromeBrowser(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return (
    /Chrome/i.test(navigator.userAgent) &&
    !/Edg/i.test(navigator.userAgent) &&
    !/OPR/i.test(navigator.userAgent)
  );
}

export function webGLUnavailableMessage(): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";

  const lines = [
    "WebGL could not start in this browser window.",
    `Try ${origin}/dev in a fresh tab.`,
  ];

  if (isChromeBrowser()) {
    lines.push(
      "Chrome: enable Settings → System → “Use graphics acceleration when available”, then relaunch Chrome.",
      "Chrome: check chrome://settings/content/all — allow WebGL for localhost.",
      "Disable WebGL-blocking extensions (ad blockers, privacy tools) for this site.",
    );
  } else {
    lines.push(
      "Use Chrome, Safari, or Firefox with hardware acceleration enabled.",
      "Cursor's built-in Simple Browser often blocks WebGL.",
    );
  }

  return lines.join(" ");
}

export function releaseCanvasWebGLContext(canvas: HTMLCanvasElement) {
  const gl =
    (canvas.getContext("webgl2") as WebGL2RenderingContext | null) ??
    (canvas.getContext("webgl") as WebGLRenderingContext | null) ??
    (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

  gl?.getExtension("WEBGL_lose_context")?.loseContext();
}

export function replaceCanvasElement(canvas: HTMLCanvasElement): HTMLCanvasElement {
  releaseCanvasWebGLContext(canvas);
  const next = document.createElement("canvas");
  next.className = canvas.className;
  next.setAttribute("aria-label", canvas.getAttribute("aria-label") ?? "3D model preview");
  canvas.replaceWith(next);
  return next;
}

export function getWebGLRendererParameters(
  canvas: HTMLCanvasElement,
  options: { alpha?: boolean } = {},
) {
  const alpha = options.alpha ?? false;

  return {
    canvas,
    antialias: false,
    failIfMajorPerformanceCaveat: false,
    powerPreference: "default" as WebGLPowerPreference,
    depth: CONTEXT_OPTIONS.depth,
    stencil: CONTEXT_OPTIONS.stencil,
    alpha,
    premultipliedAlpha: alpha,
  };
}

export async function waitForWebGLReleaseMs(ms = 120): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function isChrome(): boolean {
  return isChromeBrowser();
}
