// frontend/src/modules/auth/components/MobileUnsupportedScreen.tsx

// Arrival screen shown instead of Enter when the showcase is opened on a phone.

import { LoginScatterAmbience } from "./login/scatter/LoginScatterAmbience";

export function MobileUnsupportedScreen() {
  return (
    <main className="login-gray-screen relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10 text-stone-100">
      <div className="login-gray-gradient pointer-events-none fixed inset-0 z-0" aria-hidden />

      <LoginScatterAmbience />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8 text-center">
        <p className="font-mono text-3xl font-bold uppercase tracking-[0.38em] text-lime-300">
          K E E L
        </p>
        <p className="text-base leading-relaxed text-stone-300">
          Keel is not supported on mobile devices yet. Please visit on a desktop
          for the full experience.
        </p>
      </div>
    </main>
  );
}
