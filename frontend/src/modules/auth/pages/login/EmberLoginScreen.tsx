// keel_web/src/modules/auth/pages/login/EmberLoginScreen.tsx

// Ember-themed login screen: warm gradient background, random Keel Persona animation, Google sign-in.

import { KeelPersonaPlayer } from "../../../../components/keelPersona";
import { useKeelClipMediaReady, useRandomKeelClip } from "../../../../hooks/keelPersona";
import { EnterButton } from "../../components/EnterButton";

const PERSONA_SIZE_PX = 220;

export function EmberLoginScreen() {
  const clipId = useRandomKeelClip();
  const mediaReady = useKeelClipMediaReady(clipId, true);

  return (
    <main className="login-ember-screen relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10 text-stone-100">
      <div className="login-ember-gradient pointer-events-none fixed inset-0 z-0" aria-hidden />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <KeelPersonaPlayer
          clipId={clipId}
          size={PERSONA_SIZE_PX}
          waitForMedia
          mediaReady={mediaReady}
          showCaption={false}
        />
        <EnterButton />
      </div>
    </main>
  );
}
