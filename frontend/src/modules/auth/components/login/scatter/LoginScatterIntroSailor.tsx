// keel_web/src/modules/auth/components/login/scatter/LoginScatterIntroSailor.tsx

// Intro sailor beat in an in-flow slot above the KEEL title (no quip).
// Uses a fixed-size slot (not viewport-absolute) so zoom cannot drift it from the title.

import { KeelPersonaPlayer } from "../../../../../components/keelPersona";
import { useKeelClipMediaReady } from "../../../../../hooks/keelPersona";
import { THE_SAILOR_CLIP } from "../../../../../lib/keelPersona/clips/theSailor";
import {
  LOGIN_SCATTER_INTRO_SAILOR_SIZE_PX,
  loginScatterDisplayHeightPx,
} from "../../../lib/loginScatterPlacement";

const SLOT_SIZE_PX = LOGIN_SCATTER_INTRO_SAILOR_SIZE_PX;
const SLOT_HEIGHT_PX = loginScatterDisplayHeightPx(SLOT_SIZE_PX);
/** Slightly above geometric center so head overflow sits above the slot, feet sit closer to the title. */
const SLOT_ANCHOR_TOP = "44%";

type LoginScatterIntroSailorProps = {
  exiting?: boolean;
};

export function LoginScatterIntroSailor({
  exiting = false,
}: LoginScatterIntroSailorProps) {
  const mediaReady = useKeelClipMediaReady(THE_SAILOR_CLIP.id, true);

  const phaseClass = exiting
    ? "login-scatter-spot--teleporting-out"
    : "login-scatter-spot--entering";

  return (
    <div
      className="pointer-events-none relative shrink-0 overflow-visible"
      style={{ width: SLOT_SIZE_PX, height: SLOT_HEIGHT_PX }}
      aria-hidden
    >
      <div
        className={`login-scatter-spot login-scatter-intro-sailor pointer-events-none absolute ${phaseClass}`}
        style={{ left: "50%", top: SLOT_ANCHOR_TOP }}
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
    </div>
  );
}
