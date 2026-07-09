// stack_sandbox/frontend_web/src/modules/auth/components/GoogleSignInButton.tsx

// Button that redirects the browser to the backend Google OAuth login URL.

import googleIcon from "../../../assets/general/google.png";
import { getGoogleLoginUrl } from "../api";

export function GoogleSignInButton() {
  function handleClick() {
    window.location.href = getGoogleLoginUrl();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex w-auto shrink-0 items-center justify-center gap-2 rounded-md border border-stone-500/35 bg-stone-600/45 px-3 py-2 text-sm font-bold text-stone-50 shadow-xl shadow-black/35 backdrop-blur-sm transition hover:border-stone-400/45 hover:bg-stone-500/50 focus:outline-none focus:ring-2 focus:ring-stone-500/50 focus:ring-offset-2 focus:ring-offset-app"
    >
      <img src={googleIcon} alt="" className="h-5 w-5 shrink-0" aria-hidden />
      Login with Google
    </button>
  );
}
