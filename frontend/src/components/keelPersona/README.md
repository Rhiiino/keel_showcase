# Keel Persona (components)

Plug-and-play UI for Keel's animated persona in AppShell — loading states, ambient captions, and full clip playback.

## Intent

Components here render persona **output** for production (dot, polygon-overlay, line, media-image, glass-overlay; wobble, happyEyes, orangeEyeGlow, eye scale, drop, wiggle, gaze travel, spawn/despawn, squint). Animation definitions live in [`src/lib/keelPersona/`](../lib/keelPersona/README.md). Canvas authoring and clip staging live in the dev module (promoted upward when approved).

**Production-only rule:** Only components actively consumed by production playback belong here. Unused or experimental UI (builder panels, extra element kinds, authoring tools) stays in `src/modules/dev/**` until promoted. Do not copy dev components into this folder speculatively.

**Integrating into a feature module:** see [`INTEGRATION.md`](./INTEGRATION.md) — especially the **Fluid playback requirements** section.

## Components

| Component | Role |
|-----------|------|
| `KeelPersonaPlayer` | Looping clip playback from promoted design + caption bubble |
| `KeelCaptionBubble` | Renders caption text for the active clip step |
| `KeelPersonaRenderer` | Element stack + base image at design resolution |
| `KeelAnimationComposer` | Wobble wrapper + body-shift layer |

## Playback modes

`KeelPersonaPlayer` supports two modes — see [`INTEGRATION.md`](./INTEGRATION.md):

| Mode | Prop | Use when |
|------|------|----------|
| Loading compositor | `loadingPlayback` | Module loading overlays; host may block main thread |
| Standard stepped | default | Idle surfaces (Settings → Animations gallery) |

**Rule:** pass `loadingPlayback` in all loading overlays. Motion runs on the compositor (CSS + WAAPI), never per-frame JS.

## `KeelPersonaPlayer` API

```tsx
import { KeelPersonaPlayer } from "../../components/keelPersona";
import { useKeelClipMediaReady, useRandomKeelClip } from "../../hooks/keelPersona";

// Module loading overlay (canonical)
const clipId = useRandomKeelClip();
const mediaReady = useKeelClipMediaReady(clipId, true);

<KeelPersonaPlayer
  clipId={clipId}
  size={220}
  waitForMedia
  mediaReady={mediaReady}
  loadingPlayback
/>

// Idle surface (Settings gallery)
<KeelPersonaPlayer clipId="clip-baking-cake" size={160} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `clipId` | `string` | required | Registry id, e.g. `clip-baking-cake` |
| `size` | `number` | `120` | Display size in px (renders at 560px design resolution, scaled down) |
| `className` | `string` | `""` | Wrapper classes |
| `autoPlay` | `boolean` | `true` | Start loop on mount; stop on unmount |
| `waitForMedia` | `boolean` | `false` | Return null until `mediaReady` is true |
| `mediaReady` | `boolean` | `true` | Gate from `useKeelClipMediaReady` — accessories decoded |
| `loadingPlayback` | `boolean` | `false` | Compositor timeline mode for loading overlays |

## Dependencies

- **Allowed:** `src/lib/keelPersona/`, `src/hooks/keelPersona/`, `src/assets/KeelPersona/` (via lib `mediaAssets.ts`)
- **Not allowed:** `src/modules/dev/**`
- **Promotion:** Add a component here only when a registered clip or production playback path needs it; remove components that no registered clip uses.

## Related

- Integration guide: [`INTEGRATION.md`](./INTEGRATION.md)
- Data layer: [`src/lib/keelPersona/README.md`](../lib/keelPersona/README.md)
- Motion hooks: [`src/hooks/keelPersona/README.md`](../hooks/keelPersona/README.md)
- Dev builder: [`src/modules/dev/README.md`](../modules/dev/README.md)
