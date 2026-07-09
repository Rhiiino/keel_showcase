# Keel Persona (hooks)

Playback hooks for Keel's animated persona — clip stepping, loading-overlay helpers, and compositor timeline playback.

## Intent

Hooks here drive **when** clip steps apply and **how** loading overlays compile clips to WAAPI timelines. Data and types live in [`src/lib/keelPersona/`](../../lib/keelPersona/README.md). Rendering lives in [`src/components/keelPersona/`](../../components/keelPersona/README.md).

**No per-frame JS motion:** all tweening runs as CSS animations or Web Animations API transforms on the compositor — see [`motionPlayback.ts`](../../lib/keelPersona/motionPlayback.ts), [`loadingTimeline.ts`](../../lib/keelPersona/loadingTimeline.ts), and the `keel-*` keyframes in [`index.css`](../../index.css). This keeps clips fluid even while the main thread is busy (module loads, WebGL scene builds). Do not add `requestAnimationFrame` + React state motion hooks here.

**Production-only rule:** Only hooks consumed by production playback (`KeelPersonaPlayer`, renderer stack) belong here. Builder-only effects (`eyeBlink`, `eyeLineSweep`, `axisSpin`, etc.) stay in `src/modules/dev/hooks/`.

## Directory structure

```
hooks/keelPersona/
├── README.md
├── index.ts                      # Public barrel
├── useKeelAnimationPlayer.ts     # Step-based clip player (standard mode)
├── useKeelLoadingPlayback.ts     # WAAPI timeline runner (loadingPlayback mode)
├── useKeelClipMediaReady.ts      # Clip-specific media preload gate
└── useRandomKeelClip.ts          # Random clip id for loading overlays
```

## Playback modes

See [`INTEGRATION.md`](../../components/keelPersona/INTEGRATION.md) for the full fluid-playback guide.

| Mode | Hooks involved | Transient motion |
|------|----------------|------------------|
| **Standard stepped** | `useKeelAnimationPlayer` | Per-step CSS classes + WAAPI body hop (`LoadingIconBodyShiftLayer`) |
| **Loading compositor** | `useKeelLoadingPlayback` + `buildKeelLoadingTimeline` | WAAPI keyframe tracks on `data-keel-lp` elements; CSS only for continuous layers |

## Motion → mechanism mapping

### Standard mode (per-step CSS/WAAPI)

| `KeelAnimationLayers` flag | Mechanism |
|------|-----------|
| `wobble` | CSS `loading-icon-wobble` class (composer layer) |
| `happyEyes` | CSS `keel-happy-eye-morph` keyframes on straight-gaze dots |
| `squintEyeSide` | CSS `keel-squint-eye` keyframes on the squinting dot |
| `bodyShiftDirection` / gaze-derived travel | WAAPI transform in `LoadingIconBodyShiftLayer` |
| `gazeTransition` | CSS `keel-gaze-blend` slide-in on newly mounted gaze dots |
| `dropGroupIds` | CSS `keel-media-drop` on media wrapper |
| `spawnScaleGroupIds` / `despawnScaleGroupIds` | CSS `keel-media-spawn` / `keel-media-despawn` |
| `groupWiggleIds` | CSS `loading-icon-group-wiggle` on media wrapper |
| `orangeEyeGlow` | Static glow styles on straight-gaze dots |
| `eyeScale*` | Width/height transition on dots (standard mode only) |

Per-step descriptors (`bodyShift`, `gazeBlend`, `squintEyeSide`) come from `resolveKeelPersonaStepMotion` in [`motionPlayback.ts`](../../lib/keelPersona/motionPlayback.ts) — evaluated once per step change.

### Loading mode (`loadingPlayback`)

| Concern | Mechanism |
|---------|-----------|
| Step choreography | `buildKeelLoadingTimeline` compiles all steps → WAAPI keyframe tracks |
| Playback | `useKeelLoadingPlayback` runs tracks with `iterations: Infinity` |
| Element targets | `data-keel-lp` attributes on stable-mounted elements |
| Body hops / gaze travel | WAAPI body track + per-dot transform keyframes in timeline |
| Eye scale / squint / spawn / drop / wiggle | WAAPI transform keyframes (not width/height transitions) |
| `wobble`, `happyEyes`, `orangeEyeGlow` | CSS keyframes (continuous layers, same as standard mode) |

## Loading overlays

Feature modules call `useRandomKeelClip()` inside their loading overlay component. Gate playback with `useKeelClipMediaReady(clipId)` and `KeelPersonaPlayer` `waitForMedia` / `mediaReady` / `loadingPlayback` props.

```tsx
const clipId = useRandomKeelClip();
const mediaReady = useKeelClipMediaReady(clipId, true);

<KeelPersonaPlayer
  clipId={clipId}
  waitForMedia
  mediaReady={mediaReady}
  loadingPlayback
/>
```

Full checklist: [`INTEGRATION.md`](../../components/keelPersona/INTEGRATION.md).

## Import standard

```typescript
import {
  useKeelAnimationPlayer,
  useKeelClipMediaReady,
  useKeelLoadingPlayback,
  useRandomKeelClip,
} from "../../hooks/keelPersona";
```

## Boundaries

- **Allowed:** `src/lib/keelPersona/`
- **Not allowed:** `src/modules/dev/**`

## Related

- Data layer: [`src/lib/keelPersona/README.md`](../../lib/keelPersona/README.md)
- UI layer: [`src/components/keelPersona/README.md`](../../components/keelPersona/README.md)
- Integration guide: [`src/components/keelPersona/INTEGRATION.md`](../../components/keelPersona/INTEGRATION.md)
- Dev builder: [`src/modules/dev/README.md`](../../modules/dev/README.md)
- Animation authoring: [`.cursor/skills/khan-maykr/SKILL.md`](../../../.cursor/skills/khan-maykr/SKILL.md)
