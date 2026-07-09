// keel_web/src/modules/auth/components/login/scatter/LoginScatterClipDescriptor.tsx

import { DEFAULT_KEEL_CAPTIONS, getKeelClip } from "../../../../../lib/keelPersona";

type LoginScatterClipDescriptorProps = {
  clipId: string;
};

function resolveScatterClipDescriptor(clipId: string): {
  name: string;
  text: string | null;
} | null {
  const clip = getKeelClip(clipId);
  if (!clip) {
    return null;
  }

  const caption = clip.defaultCaptionId
    ? DEFAULT_KEEL_CAPTIONS.find((entry) => entry.id === clip.defaultCaptionId) ?? null
    : null;

  return {
    name: clip.name,
    text: caption?.text ?? null,
  };
}

export function LoginScatterClipDescriptor({ clipId }: LoginScatterClipDescriptorProps) {
  const descriptor = resolveScatterClipDescriptor(clipId);

  if (!descriptor || !descriptor.text) {
    return null;
  }

  return (
    <div className="login-scatter-clip-descriptor flex max-w-[11rem] flex-col gap-1.5 text-left">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-lime-400/90">
        {descriptor.name}
      </p>
      <p className="text-sm font-medium leading-snug text-stone-100/95">
        {descriptor.text}
      </p>
    </div>
  );
}
