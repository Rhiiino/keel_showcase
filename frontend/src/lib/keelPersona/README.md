# Keel Persona (platform lib)

Production data layer for Keel's animated persona: **clips** (timed animations), **captions** (spoken text), and registry APIs for AppShell integration.

Dev staging and canvas authoring live in [`src/modules/dev/`](../modules/dev/README.md). Approved animations are promoted here.

## Intent

- One **animation** = one **`KeelAnimationClip`** with a stable `clip-*` id
- Each clip links to caption text via `defaultCaptionId` and/or step `captionId`
- Clips are discovered by tag (`loading`, `humor`, `ambient`) for settings like `KeelPersonaSettings.loadingClipTags`
- UI components in [`src/components/keelPersona/`](../components/keelPersona/README.md) consume this lib only — never dev module internals

## Directory structure

```
lib/keelPersona/
├── README.md
├── index.ts              # Public barrel; bootstraps registries
├── types.ts              # Production element kinds + clip/caption types (cake runtime)
├── promotedDesign.json   # Inline geometry only (dots, lines, overlays); media-image refs by mediaId
├── promotedDesign.ts     # KEEL_PERSONA_PROMOTED_ELEMENTS loader
├── eyeScale.ts           # Straight-gaze eye scale multiplier resolver (symmetric + asymmetric)
├── mediaAssets.ts        # mediaId → static files in src/assets/KeelPersona/
├── preloadKeelPersonaMedia.ts  # Pre-decode clip-critical media before playback
├── clipPlaybackElements.ts # Per-clip element subset for playback
├── clipMediaPreload.ts       # Resolve media URLs required by a clip
├── loadingTimeline.ts        # Compiles clip steps → WAAPI keyframe tracks (loadingPlayback mode)
├── bakedClipAssets.ts        # Optional baked VP9 WebM registry for complex clips
├── motionPlayback.ts         # Per-step motion descriptors + WAAPI hop keyframes
├── clipRegistry.ts       # registerKeelClip, getKeelClip, listKeelClips, getKeelClipsByTag
├── resolveCaption.ts     # registerKeelCaptions, getKeelCaption, resolveClipCaption
├── captionBank.ts        # Re-exports DEFAULT_KEEL_CAPTIONS
├── clips/
│   ├── index.ts          # Registers all approved clips
│   ├── bakingCake.ts
│   ├── suspiciousDisguise.ts
│   └── <name>.ts         # One clip per file after approval
└── captions/
    ├── index.ts          # Registers all approved captions
    ├── baking.ts
    ├── disguise.ts
    └── <theme>.ts        # Caption groups after approval
```

## Production animation layers

`KeelAnimationLayers` fields supported by production playback (`KeelPersonaPlayer` → renderer stack):

| Layer | Effect |
|-------|--------|
| `wobble` / `wobbleExcludedGroupIds` | Gentle body wobble; listed groups stay static |
| `happyEyes` | Straight-gaze dots morph to happy lines |
| `orangeEyeGlow` | Orange glow + tint on straight-gaze eye dots |
| `eyeScale` / `eyeScaleLeft` / `eyeScaleRight` | Scale straight-gaze dots (symmetric or per-eye), eased |
| `dropGroupIds` | Accessory groups drop into place from above |
| `groupWiggleIds` | Rotation oscillation on listed accessory groups |
| `bodyShiftDirection` | One-shot left/right body lean over the step duration |
| `gazeTransition` | Smooth left/right eye movement when gaze group changes |
| `spawnScaleGroupIds` / `despawnScaleGroupIds` | Accessory groups scale in/out (telescope pop) |
| `squintEyeSide` | One directional-gaze eye morphs to a flat squint line |
| `straightEyeBlink` | Straight-gaze dots close to a flat line and reopen (one blink per step) |
| `branchPoke` / `branchPokeGroupIds` | Branch prop jabs diagonally bottom-right twice per step |
| `teslaLineGlow` | **The Tesla** — sequenced mouth/outer/inner white line glow, eye charge cycle, and fluid eye scale |

All layer tweening runs as **compositor-driven CSS animations or Web Animations API transforms** (`keel-*` keyframes in `src/index.css`, `motionPlayback.ts` for the body-shift hop). JavaScript only applies per-step descriptors when the clip advances — there is no per-frame `requestAnimationFrame` + React state loop, so playback stays fluid while the main thread is busy (module loads, WebGL scene builds). New layers must follow the same rule: animate `transform`/`opacity` (or cheap scoped width/height) via CSS/WAAPI, never per-frame React state. Dev-only builder layers (`eyeLineSweep`, `axisSpin`, `centerOrbit`, `eyeBlink`, `straightEyeGlow`) are **not** part of production playback.

## Clip model

```typescript
type KeelAnimationClip = {
  id: string;           // e.g. "clip-loading-idle"
  name: string;
  tags: string[];       // behavior: loading, humor, ambient
  contextTags: string[]; // accessory/group context
  steps: KeelAnimationStep[];
  loop?: boolean;
  defaultCaptionId?: string;
};
```

Each step sets `durationMs`, optional `look.visibleGroupIds`, optional `layers`, and optional caption.

## Clip authoring for fluid playback

When authoring or promoting clips, follow these rules so animations play fluidly in any module overlay. Full details: [`INTEGRATION.md`](../components/keelPersona/INTEGRATION.md).

1. **Start motion on frame 0** — wobble, happy eyes, and visible accessories active from the first step.
2. **Prefer long steps + compositor layers** over rapid step cadences (baking-cake template: one 5s step).
3. **Complex short beats** must be expressible by `buildKeelLoadingTimeline` — extend the compiler or bake WebM if not.
4. **Register all `media-image` assets** in `mediaAssets.ts` + `KEEL_PERSONA_PRELOAD_MEDIA`.
5. **Trim `promotedDesign.json`** to clip-used elements only.
6. **Never rely on dev-only layers** in promoted clips.

Module overlays must pass `loadingPlayback` to `KeelPersonaPlayer`. See Khan Maykr skill (`.cursor/skills/khan-maykr/SKILL.md`).

## Asset and element rules

Production paths outside `src/modules/dev/**` must contain **only** what registered clips and playback actually use.

### Used-only rule

| Location | May contain |
|----------|-------------|
| `src/lib/keelPersona/` | Clips registered in `clips/index.ts`, captions, and promoted elements referenced by those clips |
| `src/hooks/keelPersona/` | Motion/playback hooks consumed by production playback |
| `src/components/keelPersona/` | Components consumed by production playback (`KeelPersonaPlayer`, renderer stack, etc.) |
| `src/assets/KeelPersona/` | Image files referenced by `mediaAssets.ts` for registered clips |

Do not promote unused elements, components, or assets. Experiments and builder-only UI stay in the dev module until a clip is approved and registered.

### No inline images

| Element kind | Where it lives |
|--------------|----------------|
| `dot`, `line`, `polygon-overlay`, `glass-overlay` | Inline in `promotedDesign.json` (geometry, colors, positions) |
| `media-image` | Geometry + `mediaId` in `promotedDesign.json`; **image file** in `src/assets/KeelPersona/` |

For `media-image` elements:

1. Place the PNG (or other image) in [`src/assets/KeelPersona/`](../../assets/KeelPersona/).
2. Map `mediaId` → bundled URL in [`mediaAssets.ts`](./mediaAssets.ts).
3. Add the URL to `KEEL_PERSONA_PRELOAD_MEDIA` when the clip needs pre-decode before playback.

**Do not** inline image bytes (base64, data URIs) in `promotedDesign.json`. Keep the export bundle's `media` object empty in production — the dev export may include inlined media for clipboard/download convenience, but promotion strips it.

Example `media-image` element in `promotedDesign.json` (geometry only; file lives in assets):

```json
{
  "kind": "media-image",
  "mediaId": "0aeb057d-c61f-4904-9519-e6a7127f366a",
  "mediaFilename": "chef hat",
  "x": 261.9,
  "y": -28.5,
  "width": 255,
  "height": 255
}
```

## How to add an approved animation

1. Author and iterate in dev [`seedData.ts`](../modules/dev/lib/keelPersona/seedData.ts) with Khan Maykr (see [`.cursor/skills/khan-maykr/SKILL.md`](../../.cursor/skills/khan-maykr/SKILL.md))
2. User approves preview in Keel Persona Builder Animations panel
3. Click **Copy animation spec** on Animation Playground for the visible layout + look snapshot. Promote to production by:
   - Committing **only** elements referenced by the approved clip(s) to `promotedDesign.json` (remove unused elements).
   - Keeping non-image geometry (`dot`, `line`, `polygon-overlay`, `glass-overlay`) inline in the JSON.
   - Moving each `media-image` file to `src/assets/KeelPersona/` and registering its `mediaId` in `mediaAssets.ts` — **never** commit inlined image data or a populated `media` bundle.
   - Adding new elements/assets only when registering a clip that needs them.
4. Create `clips/<camelCase>.ts` exporting one clip constant
5. Import and register in `clips/index.ts`
6. Add caption(s) under `captions/` if new
7. Update root `CHANGELOG.md` and [`PROJECT_TREE.md`](../../PROJECT_TREE.md)

## Public exports (`index.ts`)

- Types from `types.ts`
- `getKeelClip`, `listKeelClips`, `getKeelClipsByTag`, `pickRandomKeelClipId`
- `getKeelCaption`, `resolveClipCaption`, `DEFAULT_KEEL_CAPTIONS`
- `DEFAULT_KEEL_PERSONA_SETTINGS`
- `KEEL_PERSONA_PROMOTED_ELEMENTS`, `KEEL_PERSONA_PRELOAD_MEDIA`, `preloadKeelPersonaMedia`, `resolveKeelPersonaMediaSrc`

## Related

- Motion hooks: [`src/hooks/keelPersona/README.md`](../hooks/keelPersona/README.md)
- UI layer: [`src/components/keelPersona/README.md`](../components/keelPersona/README.md)
- **Module integration:** [`src/components/keelPersona/INTEGRATION.md`](../components/keelPersona/INTEGRATION.md)
- Dev builder: [`src/modules/dev/README.md`](../modules/dev/README.md)
