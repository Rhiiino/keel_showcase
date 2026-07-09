// keel_web/src/modules/auth/components/login/scatter/LoginScatterIntroSailor.tsx

// Intro sailor beat centered above the KEEL title (no quip).

import { KeelPersonaPlayer } from "../../../../../components/keelPersona";
import { useKeelClipMediaReady } from "../../../../../hooks/keelPersona";
import { THE_SAILOR_CLIP } from "../../../../../lib/keelPersona/clips/theSailor";
import {
  LOGIN_SCATTER_INTRO_SAILOR_SIZE_PX,
  pickLoginScatterIntroSailorPosition,
  type ViewportSize,
} from "../../../lib/loginScatterPlacement";

type LoginScatterIntroSailorProps = {
  viewport: ViewportSize;
  exiting?: boolean;
  /** When false, media preloads off-screen before the reveal teleport-in. */
  revealed?: boolean;
};

export function LoginScatterIntroSailor({
  viewport,
  exiting = false,
  revealed = true,
}: LoginScatterIntroSailorProps) {
  const mediaReady = useKeelClipMediaReady(THE_SAILOR_CLIP.id, true);
  const position = pickLoginScatterIntroSailorPosition(viewport);

  const phaseClass = exiting
    ? "login-scatter-spot--teleporting-out"
    : revealed
      ? "login-scatter-intro-sailor--entering"
      : "login-scatter-intro-sailor--preloading";

  return (
    <div
      className={`login-scatter-spot login-scatter-intro-sailor pointer-events-none absolute ${phaseClass}`}
      style={{ left: position.x, top: position.y }}
      aria-hidden
    >
      {mediaReady ? (
        <KeelPersonaPlayer
          clipId={THE_SAILOR_CLIP.id}
          size={LOGIN_SCATTER_INTRO_SAILOR_SIZE_PX}
          waitForMedia
          mediaReady={mediaReady}
          loadingPlayback={true}
          showCaption={false}
        />
      ) : null}
    </div>
  );
}
