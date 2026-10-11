// keel_web/src/modules/auth/pages/login/MobileDesktopGate.tsx

// Full-screen gate for narrow viewports — fixed persona cycle above title, no Enter.

import { MobileDesktopGateAmbience } from "../../components/login/scatter/MobileDesktopGateAmbience";
import { ScatterLoginTitle } from "../../components/login/scatter/ScatterLoginTitle";

export function MobileDesktopGate() {
  return (
    <main className="login-gray-screen relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10 text-stone-100">
      <div className="login-gray-gradient pointer-events-none fixed inset-0 z-0" aria-hidden />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <MobileDesktopGateAmbience />
        <ScatterLoginTitle />
        <div className="max-w-sm text-center">
          <p className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-lime-300">
            Best on desktop
          </p>
          <p className="mt-3 text-sm leading-relaxed text-stone-300/90">
            Pssh — Keel isn&apos;t optimized for mobile yet. Open this on a computer for the
            full experience.
          </p>
        </div>
      </div>
    </main>
  );
}
