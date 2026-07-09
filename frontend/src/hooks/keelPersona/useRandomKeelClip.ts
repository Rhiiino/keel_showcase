// keel_web/src/hooks/keelPersona/useRandomKeelClip.ts

import { useState } from "react";

import { pickRandomKeelClipId } from "../../lib/keelPersona";

export function useRandomKeelClip(): string {
  const [clipId] = useState(() => pickRandomKeelClipId());
  return clipId;
}
