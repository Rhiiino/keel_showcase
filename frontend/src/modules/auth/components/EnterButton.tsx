// frontend/src/modules/auth/components/EnterButton.tsx

// Showcase login — creates a session for the shared demo user.

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { enterShowcase } from "../api";

export function EnterButton() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (pending) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await enterShowcase();
      navigate("/", { replace: true });
    } catch {
      setError("Could not enter. Is the API running?");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={pending}
        className="inline-flex w-auto shrink-0 items-center justify-center rounded-md border border-stone-500/35 bg-stone-600/45 px-6 py-2.5 text-sm font-bold uppercase tracking-[0.2em] text-stone-50 shadow-xl shadow-black/35 backdrop-blur-sm transition hover:border-stone-400/45 hover:bg-stone-500/50 focus:outline-none focus:ring-2 focus:ring-stone-500/50 focus:ring-offset-2 focus:ring-offset-app disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Entering…" : "Enter"}
      </button>
      {error ? (
        <p className="max-w-xs text-center text-xs text-red-300/90" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
