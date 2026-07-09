// keel_web/src/modules/auth/pages/login/GrayLoginScreen.tsx

// Gray gradient login screen: Keel logo and Google sign-in only.

import keelLogo from "../../../../assets/general/keel.png";
import { EnterButton } from "../../components/EnterButton";

export function GrayLoginScreen() {
  return (
    <main className="login-gray-screen relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10 text-stone-100">
      <div className="login-gray-gradient pointer-events-none fixed inset-0 z-0" aria-hidden />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <img
          src={keelLogo}
          alt="Keel"
          className="h-48 w-48 object-contain sm:h-56 sm:w-56"
        />
        <EnterButton />
      </div>
    </main>
  );
}
