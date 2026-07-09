// stack_sandbox/frontend_web/src/modules/test/lib/viewer/stlViewerRuntime.ts

// Imperative Three.js runtime for the STL test viewer (single WebGL context).

import type { BufferGeometry } from "three";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Clock,
  DirectionalLight,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import {
  getWebGLRendererParameters,
  releaseCanvasWebGLContext,
} from "./webglSupport";

/** Relative spin rates per axis — incommensurate ratios avoid repetitive loops. */
const TUMBLE_AXIS_SPEEDS = { x: 0.62, y: 1, z: 0.41 } as const;

export type StlViewerLightingProfile = "default" | "bright";

export type StlViewerDisplayOptions = {
  transparent: boolean;
  /** Slow multi-axis tumble so every face passes into view. */
  autoTumble: boolean;
  /** Base radians per second (~0.18 ≈ gentle overall motion). */
  tumbleSpeed: number;
  /** When false, orbit/pan/zoom is disabled (e.g. Kanban card preview). */
  enableControls?: boolean;
  /** Brighter lights and material for large hero previews (project detail). */
  lightingProfile?: StlViewerLightingProfile;
};

export const STAGE_VIEWER_OPTIONS: StlViewerDisplayOptions = {
  transparent: true,
  autoTumble: true,
  tumbleSpeed: 0.18,
  enableControls: true,
};

export const CARD_STL_VIEWER_OPTIONS: StlViewerDisplayOptions = {
  transparent: true,
  autoTumble: true,
  tumbleSpeed: 0.18,
  enableControls: false,
  lightingProfile: "bright",
};

export const HERO_STL_VIEWER_OPTIONS: StlViewerDisplayOptions = {
  transparent: true,
  autoTumble: true,
  tumbleSpeed: 0.18,
  enableControls: true,
  lightingProfile: "bright",
};

export const STATIC_STL_VIEWER_OPTIONS: StlViewerDisplayOptions = {
  transparent: true,
  autoTumble: false,
  tumbleSpeed: 0,
  enableControls: false,
};

/** Static bright preview for file-grid STL thumbnails (matches cover lighting). */
export const FILE_STL_VIEWER_OPTIONS: StlViewerDisplayOptions = {
  transparent: true,
  autoTumble: false,
  tumbleSpeed: 0,
  enableControls: false,
  lightingProfile: "bright",
};

function fitCameraToGeometry(
  camera: PerspectiveCamera,
  geometry: BufferGeometry,
  controls: OrbitControls,
) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) {
    return;
  }

  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  const fovRadians = (camera.fov * Math.PI) / 180;
  const distance = (maxDim / 2 / Math.tan(fovRadians / 2)) * 1.8;

  camera.position.set(
    center.x + distance * 0.55,
    center.y + distance * 0.4,
    center.z + distance,
  );
  camera.near = Math.max(maxDim / 500, 0.001);
  camera.far = Math.max(maxDim * 500, 100);
  camera.lookAt(center);
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.update();
}

export function createPlaceholderGeometry(): BufferGeometry {
  const geometry = new IcosahedronGeometry(0.8, 1);
  geometry.computeVertexNormals();
  return geometry;
}

function forceRendererContextLoss(renderer: WebGLRenderer) {
  try {
    renderer.getContext().getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    // Context may already be lost during teardown.
  }
}

type SceneLightEntry = {
  light: AmbientLight | DirectionalLight;
  baseIntensity: number;
};

function createLightingProfile(
  profile: StlViewerLightingProfile,
  material: MeshStandardMaterial,
): SceneLightEntry[] {
  const bright = profile === "bright";
  const entries: SceneLightEntry[] = [];

  const ambient = new AmbientLight(0xffffff, bright ? 0.92 : 0.65);
  entries.push({ light: ambient, baseIntensity: ambient.intensity });

  const keyLight = new DirectionalLight(0xffffff, bright ? 1.55 : 1.1);
  keyLight.position.set(4, 6, 5);
  entries.push({ light: keyLight, baseIntensity: keyLight.intensity });

  if (bright) {
    const fillLight = new DirectionalLight(0xf4f7f2, 0.72);
    fillLight.position.set(-5, 2, -4);
    entries.push({ light: fillLight, baseIntensity: fillLight.intensity });

    const rimLight = new DirectionalLight(0xffffff, 0.45);
    rimLight.position.set(0, 4, -6);
    entries.push({ light: rimLight, baseIntensity: rimLight.intensity });

    material.roughness = 0.38;
    material.metalness = 0.12;
    material.emissive.setHex(0x1a1f18);
    material.emissiveIntensity = 0.06;
  } else {
    material.roughness = 0.55;
    material.metalness = 0.15;
    material.emissive.setHex(0x000000);
    material.emissiveIntensity = 0;
  }

  return entries;
}

function applyDisplayOptions(
  scene: Scene,
  renderer: WebGLRenderer,
  controls: OrbitControls,
  options: StlViewerDisplayOptions,
) {
  if (options.transparent) {
    scene.background = null;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.background = "transparent";
  } else {
    renderer.setClearColor(0x141916, 1);
  }

  controls.autoRotate = false;
}

export class StlViewerRuntime {
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(45, 1, 0.01, 1000);
  private readonly renderer: WebGLRenderer;
  private readonly controls: OrbitControls;
  private readonly material = new MeshStandardMaterial({
    color: 0xa8b5a0,
    metalness: 0.15,
    roughness: 0.55,
  });
  private readonly resizeObserver: ResizeObserver;
  private readonly clock = new Clock();
  private displayOptions: StlViewerDisplayOptions;
  private readonly tumbleGroup = new Group();
  private mesh: Mesh;
  private ownedGeometry: BufferGeometry;
  private frameId = 0;
  private disposed = false;
  private tumblePausedByUser = false;
  private readonly onControlsStart = () => {
    this.tumblePausedByUser = true;
  };
  private readonly onControlsEnd = () => {
    this.tumblePausedByUser = false;
  };
  private readonly sceneLights: SceneLightEntry[] = [];
  private modelBrightness = 1;
  private baseToneExposure = 1;
  private baseEmissiveIntensity = 0;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly container: HTMLElement,
    initialGeometry: BufferGeometry,
    displayOptions: StlViewerDisplayOptions,
  ) {
    this.displayOptions = displayOptions;

    this.renderer = new WebGLRenderer(
      getWebGLRendererParameters(canvas, { alpha: displayOptions.transparent }),
    );
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const lightingProfile = displayOptions.lightingProfile ?? "default";
    const lightingEntries = createLightingProfile(lightingProfile, this.material);
    for (const entry of lightingEntries) {
      this.scene.add(entry.light);
      this.sceneLights.push(entry);
    }

    const bright = lightingProfile === "bright";
    this.baseToneExposure = bright ? 1.12 : 1;
    this.baseEmissiveIntensity = bright ? 0.06 : 0;
    if (bright) {
      this.renderer.toneMapping = ACESFilmicToneMapping;
    }
    this.applyModelBrightness();

    this.ownedGeometry = initialGeometry.clone();
    this.mesh = new Mesh(this.ownedGeometry, this.material);
    this.tumbleGroup.add(this.mesh);
    this.scene.add(this.tumbleGroup);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enabled = displayOptions.enableControls !== false;

    applyDisplayOptions(this.scene, this.renderer, this.controls, displayOptions);
    fitCameraToGeometry(this.camera, this.ownedGeometry, this.controls);

    if (this.displayOptions.autoTumble && this.controls.enabled) {
      this.controls.addEventListener("start", this.onControlsStart);
      this.controls.addEventListener("end", this.onControlsEnd);
    }

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.startLoop();
  }

  setGeometry(geometry: BufferGeometry | null) {
    if (this.disposed) {
      return;
    }

    const nextGeometry = (geometry ?? createPlaceholderGeometry()).clone();
    this.tumbleGroup.remove(this.mesh);
    this.ownedGeometry.dispose();
    this.ownedGeometry = nextGeometry;
    this.mesh = new Mesh(this.ownedGeometry, this.material);
    this.tumbleGroup.add(this.mesh);
    fitCameraToGeometry(this.camera, this.ownedGeometry, this.controls);
  }

  setDisplayOptions(options: StlViewerDisplayOptions) {
    const hadPauseListeners =
      this.displayOptions.autoTumble && this.controls.enabled;
    this.displayOptions = options;
    applyDisplayOptions(this.scene, this.renderer, this.controls, options);

    const needsPauseListeners = options.autoTumble && this.controls.enabled;
    if (hadPauseListeners && !needsPauseListeners) {
      this.controls.removeEventListener("start", this.onControlsStart);
      this.controls.removeEventListener("end", this.onControlsEnd);
      this.tumblePausedByUser = false;
    } else if (!hadPauseListeners && needsPauseListeners) {
      this.controls.addEventListener("start", this.onControlsStart);
      this.controls.addEventListener("end", this.onControlsEnd);
    }
  }

  setTumbleSpeed(speed: number) {
    this.displayOptions = { ...this.displayOptions, tumbleSpeed: speed };
  }

  setModelColor(hex: string) {
    this.material.color.set(hex);
  }

  setModelBrightness(multiplier: number) {
    if (this.disposed) {
      return;
    }
    this.modelBrightness = Math.min(2, Math.max(0.5, multiplier));
    this.applyModelBrightness();
  }

  private applyModelBrightness() {
    const mult = this.modelBrightness;
    for (const entry of this.sceneLights) {
      entry.light.intensity = entry.baseIntensity * mult;
    }
    this.renderer.toneMappingExposure = this.baseToneExposure * mult;
    this.material.emissiveIntensity = this.baseEmissiveIntensity * mult;
  }

  private resize() {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private startLoop() {
    const tick = () => {
      if (this.disposed) {
        return;
      }
      this.frameId = window.requestAnimationFrame(tick);

      const delta = this.clock.getDelta();
      if (
        this.displayOptions.autoTumble &&
        !this.tumblePausedByUser
      ) {
        const step = this.displayOptions.tumbleSpeed * delta;
        this.tumbleGroup.rotation.x += step * TUMBLE_AXIS_SPEEDS.x;
        this.tumbleGroup.rotation.y += step * TUMBLE_AXIS_SPEEDS.y;
        this.tumbleGroup.rotation.z += step * TUMBLE_AXIS_SPEEDS.z;
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  dispose() {
    if (this.disposed) {
      return;
    }
    this.disposed = true;

    window.cancelAnimationFrame(this.frameId);
    this.resizeObserver.disconnect();
    if (this.displayOptions.autoTumble && this.controls.enabled) {
      this.controls.removeEventListener("start", this.onControlsStart);
      this.controls.removeEventListener("end", this.onControlsEnd);
    }
    this.controls.dispose();
    this.tumbleGroup.remove(this.mesh);
    this.scene.remove(this.tumbleGroup);
    this.ownedGeometry.dispose();
    this.material.dispose();
    forceRendererContextLoss(this.renderer);
    this.renderer.dispose();
    releaseCanvasWebGLContext(this.renderer.domElement);
  }
}

export async function createStlViewerRuntime(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  initialGeometry: BufferGeometry,
  displayOptions: StlViewerDisplayOptions,
  maxAttempts = 3,
): Promise<StlViewerRuntime> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return new StlViewerRuntime(canvas, container, initialGeometry, displayOptions);
    } catch (error) {
      lastError = error;
      releaseCanvasWebGLContext(canvas);
      if (attempt < maxAttempts) {
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 120 * attempt);
        });
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("WebGL viewer failed to start.");
}

export function deferUntilWebGLSafe(callback: () => void): () => void {
  let frame1 = 0;
  let frame2 = 0;
  let timeoutId = 0;
  let cancelled = false;

  frame1 = window.requestAnimationFrame(() => {
    if (cancelled) {
      return;
    }
    frame2 = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }
      timeoutId = window.setTimeout(() => {
        if (!cancelled) {
          callback();
        }
      }, 50);
    });
  });

  return () => {
    cancelled = true;
    window.cancelAnimationFrame(frame1);
    window.cancelAnimationFrame(frame2);
    window.clearTimeout(timeoutId);
  };
}
