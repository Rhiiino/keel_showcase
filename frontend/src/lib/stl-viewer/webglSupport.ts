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

/** Session cache — avoids re-probing (and console spam) when WebGL is disabled. */
let webglAvailabilityCache: boolean | null = null;

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

/**
 * Release an existing WebGL context on a canvas.
 * Does not call getContext() when WebGL is known unavailable — that would attempt
 * creation and re-fire webglcontextcreationerror (noisy in sandboxed browsers).
 */
export function releaseCanvasWebGLContext(canvas: HTMLCanvasElement) {
  if (webglAvailabilityCache === false) {
    return;
  }

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

export function isWebGLAvailable(
  options: Partial<WebGLContextAttributes> = {},
): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  // Once we know WebGL is dead for this session, never probe again.
  if (webglAvailabilityCache === false) {
    return false;
  }

  if (webglAvailabilityCache === true && Object.keys(options).length === 0) {
    return true;
  }

  try {
    const canvas = document.createElement("canvas");
    const contextOptions: WebGLContextAttributes = {
      ...CONTEXT_OPTIONS,
      ...options,
    };
    const gl =
      (canvas.getContext("webgl2", contextOptions) as WebGL2RenderingContext | null) ??
      (canvas.getContext("webgl", contextOptions) as WebGLRenderingContext | null) ??
      (canvas.getContext(
        "experimental-webgl",
        contextOptions,
      ) as WebGLRenderingContext | null);

    const available = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();

    if (Object.keys(options).length === 0) {
      webglAvailabilityCache = available ? true : false;
    }

    return available;
  } catch {
    if (Object.keys(options).length === 0) {
      webglAvailabilityCache = false;
    }
    return false;
  }
}

/** Mark WebGL as unavailable for this session (e.g. after a failed renderer create). */
export function markWebGLUnavailable() {
  webglAvailabilityCache = false;
}
