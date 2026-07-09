// keel_web/src/modules/auth/pages/login/ScatterLoginScreen.tsx

// Gray gradient login with scattered Keel Persona animations around the viewport.

import { LoginScatterAmbience } from "../../components/login/scatter/LoginScatterAmbience";
import { EnterButton } from "../../components/EnterButton";

export function ScatterLoginScreen() {
  return (
    <main className="login-gray-screen relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10 text-stone-100">
      <div className="login-gray-gradient pointer-events-none fixed inset-0 z-0" aria-hidden />

      <LoginScatterAmbience />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <p className="font-mono text-3xl font-bold uppercase tracking-[0.38em] text-lime-300 sm:text-4xl sm:tracking-[0.42em]">
          K E E L
        </p>
        <EnterButton />
      </div>
    </main>
  );
}
