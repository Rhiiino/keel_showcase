# Integrating Keel Persona animations into a feature module

How to show a looping Keel Persona clip (animation + quip) while a module surface is loading — and keep playback fluid on any host surface.

## Principle

| Layer | Owns | Path |
|-------|------|------|
| **Platform lib** | Clip/caption data, element geometry, registries | `src/lib/keelPersona/` |
| **Platform hooks** | Motion/playback orchestration | `src/hooks/keelPersona/` |
| **Platform UI** | Playback (`KeelPersonaPlayer`) | `src/components/keelPersona/` |
| **Dev sandbox** | Authoring experiments only | `src/modules/dev/` — **never imported by production modules** |
| **Feature module** | When/where to show overlay; readiness logic | `src/modules/{module}/` |

```
dev sandbox  ──promote──►  platform (lib + components + hooks)
                                ▲
feature modules  ──import───────┘
```

## Fluid playback requirements

### Why constellation playback broke

C.O.A.K. constellation was the first real stress test: a Keel Persona loop played while API data loaded and a Three.js/WebGL graph built on the same main thread. Three problems stacked:

1. **JS step timers stalled** — `useKeelAnimationPlayer` advances clips on a `setTimeout` clock. While WebGL scene setup blocked the main thread, those timers froze and the animation looked stuck or choppy.
2. **Animation competed with scene setup** — the graph and the persona renderer fought for the same thread budget when both were visible at once.
3. **DOM and layout churn** — hidden gaze/accessory elements unmounted each step; eye-scale tweens used width/height transitions that triggered layout recalculations.

### Compositor-first rule

All production motion runs on the **compositor** (`transform` / `opacity` via CSS keyframes or Web Animations API). JavaScript advances clip steps or compiles timelines — **never** per-frame `requestAnimationFrame` + React state.

| Mechanism | Path |
|-----------|------|
| Per-step motion descriptors | [`motionPlayback.ts`](../../lib/keelPersona/motionPlayback.ts) |
| Loading timeline compiler | [`loadingTimeline.ts`](../../lib/keelPersona/loadingTimeline.ts) |
| WAAPI playback hook | [`useKeelLoadingPlayback.ts`](../../hooks/keelPersona/useKeelLoadingPlayback.ts) |
| CSS keyframes (`keel-*`) | [`index.css`](../../index.css) |

When adding a new motion layer:

1. Express the tween as CSS keyframes (parametrize with CSS custom properties) or a WAAPI `element.animate` transform.
2. Animate `transform` / `opacity` where possible; scoped width/height transitions on small elements are acceptable in standard mode only.
3. Never drive motion with `requestAnimationFrame` + React state in production playback — it stutters whenever the host module is busy loading.

### Two playback modes

| Mode | Prop | When to use | Mechanism |
|------|------|-------------|-----------|
| **Loading compositor** | `loadingPlayback` | Module loading overlays; any surface where the host may block the main thread | WAAPI timeline (`buildKeelLoadingTimeline`) + stable DOM + CSS continuous layers |
| **Standard stepped** | default (omit prop) | Idle surfaces (Settings → Animations gallery) | `useKeelAnimationPlayer` + per-step CSS/WAAPI descriptors |

**Default for new integrations:** pass `loadingPlayback` whenever the player appears over or during a loading/build phase. Standard mode is acceptable only when the host surface is idle.

```
Module loading overlay ──always──► loadingPlayback
Idle surface (Settings) ──────────► standard mode
When uncertain ───────────────────► loadingPlayback (safer)
```

## Dev module isolation (required)

| Code path | May import `modules/dev/**`? |
|-----------|------------------------------|
| `src/modules/dev/**` | Yes |
| Any other feature module | **Never** |
| `src/components/**`, `src/hooks/**`, `src/lib/**`, `src/app/**` | **Never** |

```typescript
// ✓ Feature module
import { KeelPersonaPlayer } from "../../../components/keelPersona";
import { useKeelClipMediaReady, useRandomKeelClip } from "../../../hooks/keelPersona";

// ✗ Forbidden
import { useKeelAnimationPlayer } from "../../modules/dev/hooks/useKeelAnimationPlayer";
```

**Verification before merge:** from `keel_web/`, search for `modules/dev` in import paths under `src/` — matches must appear **only** under `src/modules/dev/**` (app shell `registry.ts` registering the dev manifest is allowed).

## Prerequisites

1. Clip promoted to [`src/lib/keelPersona/clips/`](../../lib/keelPersona/clips/) with stable `clip-*` id.
2. Caption(s) under [`src/lib/keelPersona/captions/`](../../lib/keelPersona/captions/).
3. [`KeelPersonaPlayer`](./KeelPersonaPlayer.tsx) available on platform (not dev). Clip-critical media resolve from static assets in `src/assets/KeelPersona/` via `mediaAssets.ts`.
4. `promotedDesign.json` contains **only** elements used by registered clips. Non-image geometry (`dot`, `line`, `polygon-overlay`, `glass-overlay`) is defined inline; `media-image` elements reference `mediaId` only — image files live in `src/assets/KeelPersona/`, never inlined in the JSON.

To author new clips, use the dev Keel Persona Builder (Animation Playground) and Khan Maykr skill — see [`src/lib/keelPersona/README.md`](../../lib/keelPersona/README.md). Promote the canvas design with **Copy animation spec** on Animation Playground.

## Integration checklist

Repeat for each loading surface in a feature module:

1. **Readiness hook** — module-local hook combining API loading (`isLoading`) and any render/paint signals (first WebGL frame, hydration, etc.).
2. **Overlay shell** — module component with scrim + `absolute inset-0 flex items-center justify-center` + z-index for that layout.
3. **Player** — canonical overlay wiring (see below). No step timers, layer wiring, or element stack in the module.
4. **Wire show/hide** — `showOverlay = isLoading || !surfaceReady` at the nearest layout root.
5. **Docs** — update module README **Dependencies** + module changelog; root `CHANGELOG.md` if user-visible.

### Required player props for module overlays

Canonical wiring (matches [`CoakConstellationLoadingOverlay.tsx`](../../modules/coak/components/tabs/constellation/CoakConstellationLoadingOverlay.tsx)):

```tsx
import { KeelPersonaPlayer } from "../../../components/keelPersona";
import { useKeelClipMediaReady, useRandomKeelClip } from "../../../hooks/keelPersona";

const clipId = useRandomKeelClip();
const mediaReady = useKeelClipMediaReady(clipId, true);

<KeelPersonaPlayer
  clipId={clipId}
  size={220}
  waitForMedia
  mediaReady={mediaReady}
  loadingPlayback
/>
```

| Prop | Purpose |
|------|---------|
| `loadingPlayback` | Skips the step timer; compiles the full clip to an infinite WAAPI loop; keeps hidden elements mounted for stable compositor targets |
| `waitForMedia` + `mediaReady` | Gate playback until clip accessories (hats, props) decode — avoids pop-in mid-animation |
| Overlay `key={sessionId}` | Key by session id (e.g. `recordId`) so navigation remounts the overlay and re-rolls the random clip |

### Choosing a clip

- **Standard:** call `useRandomKeelClip()` inside the module loading overlay. The hook picks one registered clip on mount and keeps it stable through visible and fade phases.
- **Optional filter:** pass a candidate list to `pickRandomKeelClipId(getKeelClipsByTag("loading"))` or intersect with `KeelPersonaSettings.loadingClipTags` when settings wiring lands.

## What `loadingPlayback` does internally

When `loadingPlayback` is true, `KeelPersonaPlayer` bypasses the step-based clock and drives the entire loop on the compositor:

1. [`buildKeelLoadingTimeline`](../../lib/keelPersona/loadingTimeline.ts) compiles clip steps into per-element WAAPI keyframe tracks (dots, media, overlays) plus an optional whole-body hop track.
2. [`useKeelLoadingPlayback`](../../hooks/keelPersona/useKeelLoadingPlayback.ts) attaches those tracks with `iterations: Infinity` so the loop keeps running even while the main thread is blocked.
3. [`KeelPersonaElementStack`](./elements/KeelPersonaElementStack.tsx) stable-mounts all clip elements (`data-keel-lp` attributes as WAAPI targets); hidden gaze/accessory nodes stay in the DOM with `opacity: 0` instead of unmounting.
4. Continuous layers (`wobble`, `happyEyes`, `orangeEyeGlow`) run as CSS keyframes in both playback modes.
5. **Baked WebM fallback** — when a clip exceeds compositor compiler coverage, export a VP9 WebM from the dev builder and register it in [`bakedClipAssets.ts`](../../lib/keelPersona/bakedClipAssets.ts). `KeelPersonaPlayer` plays the video when a baked URL exists (registry currently empty; compositor timeline is the primary path).

Clips still play their full registered choreography — do not replace complex clips with wobble-only stubs. Loading-friendly layer choices (e.g. cake `wobble` + `wobbleExcludedGroupIds`) live in each clip definition under `src/lib/keelPersona/clips/`.

## Host-surface coordination (module responsibility)

The player handles compositor motion; the **module** must prevent its heavy surface from competing with or revealing before the overlay is ready.

Generic pattern (constellation is the reference):

| Concern | Approach |
|---------|----------|
| Readiness | Module-local hook combines `isLoading` + surface paint signal |
| Heavy surface mount | Mount invisibly (`invisible pointer-events-none`) behind opaque overlay so WebGL/trees warm up off-screen |
| Reveal timing | Reveal the surface only after the overlay has fully dismissed — eliminates post-reveal stutter |
| Minimum visible + fade | Enforce a minimum overlay duration, then fade scrim + animation over ~450ms |
| Scrim | Opaque warm backdrop blocks partial renders until loading completes |

### Reference implementation: C.O.A.K. constellation

| Piece | Path |
|-------|------|
| Readiness hook | [`useCoakConstellationGraphReady.ts`](../../modules/coak/hooks/tabs/constellation/useCoakConstellationGraphReady.ts) |
| Graph paint signal | [`CoakGraph.tsx`](../../modules/coak/components/tabs/constellation/graph/CoakGraph.tsx) — first `useFrame` calls `markGraphPainted()` |
| Context | [`CoakConstellationGraphReadyContext.tsx`](../../modules/coak/components/tabs/constellation/CoakConstellationGraphReadyContext.tsx) |
| Overlay | [`CoakConstellationLoadingOverlay.tsx`](../../modules/coak/components/tabs/constellation/CoakConstellationLoadingOverlay.tsx) |
| Tab wiring | [`CoakConstellationTab.tsx`](../../modules/coak/components/tabs/constellation/CoakConstellationTab.tsx) |
| Scrim CSS | `coak-constellation-loading-backdrop` in [`index.css`](../../index.css) |
| Clip | Random from registry via `useRandomKeelClip()` |

Overlay shows while the **record/items query is loading**, then fades out after a minimum visible duration once **both data and the WebGL graph first paint** are ready. The graph mounts invisibly after data loads so it can warm up behind the opaque overlay; it is revealed only after the overlay fully dismisses.

## Clip authoring for fluid playback

Khan Maykr and anyone promoting clips must follow these rules so animations play fluidly in any module:

1. **Start motion on frame 0** — wobble, happy eyes, and visible accessories should be active from the first step. Loading overlays may only be visible for a few hundred milliseconds.
2. **Prefer long steps + compositor layers** over rapid step cadences. **Baking a 3-tier cake** is the performance template: one 5s step with `wobble`, `happyEyes`, and `wobbleExcludedGroupIds`.
3. **Complex short beats** (spawn/hold/despawn, gaze hops, eye-scale changes) must be expressible by `buildKeelLoadingTimeline`. If the compiler cannot represent a beat, extend `loadingTimeline.ts` or bake a WebM before promoting.
4. **Register all `media-image` assets** in `mediaAssets.ts` and add URLs to `KEEL_PERSONA_PRELOAD_MEDIA` when clip-critical.
5. **Trim `promotedDesign.json`** to clip-used elements only. `KeelPersonaPlayer` reserves head overflow space (~28% of display size) so hats and telescopes above the 560px design canvas are not clipped.
6. **Never rely on dev-only layers** (`axisSpin`, `straightEyeGlow`, `eyeLineSweep`, `centerOrbit`, `eyeBlink`) in promoted clips.

See also: [`src/lib/keelPersona/README.md`](../../lib/keelPersona/README.md) and Khan Maykr skill (`.cursor/skills/khan-maykr/SKILL.md`).

## Verification checklist

Before merging any new clip or module integration:

- [ ] Plays fluidly in the target module overlay with `loadingPlayback` while the host surface is building
- [ ] Plays correctly in **Settings → Animations** (standard mode sanity check)
- [ ] Media preloads before first frame (`waitForMedia` in overlays)
- [ ] No `modules/dev` imports outside dev
- [ ] Accessories not clipped above the canvas
- [ ] No new per-frame JS motion hooks introduced

## Do / don't

| Do | Don't |
|----|-------|
| Import `KeelPersonaPlayer` from `src/components/keelPersona/` | Import anything from `modules/dev/**` |
| Pass `loadingPlayback` in all loading overlays | Use standard stepped mode while the host surface is still building |
| Keep readiness logic in the module | Copy renderer, hooks, or element presets into the module |
| Promote approved clips to platform lib | Run parallel dev + platform playback implementations |
| Promote only elements/assets used by registered clips | Commit unused builder elements or inlined image data to `promotedDesign.json` |
| Register `media-image` files in `src/assets/KeelPersona/` + `mediaAssets.ts` | Inline base64/data-URI images in production JSON |

When **3+ modules** share the same scrim + centered player pattern, consider extracting `KeelPersonaLoadingOverlay` to `src/components/keelPersona/`. Keep readiness hooks module-local.

## Related

- API reference: [`README.md`](./README.md)
- Clip model: [`src/lib/keelPersona/README.md`](../../lib/keelPersona/README.md)
- Motion hooks: [`src/hooks/keelPersona/README.md`](../../hooks/keelPersona/README.md)
- Module boundaries: [`src/modules/README.md`](../../modules/README.md)
- Animation authoring: [`.cursor/skills/khan-maykr/SKILL.md`](../../../.cursor/skills/khan-maykr/SKILL.md)
