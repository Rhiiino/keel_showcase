// src/modules/focus/components/constellation/automation/FocusAutomationSessionModal.tsx

// Center-canvas modal for revealing and copying the one-time automation token.

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchFocusAutomationGuide, focusQueryKeys } from "../../../api";
import { buildFocusAutomationSetupInstructions } from "../../../lib/automation/setupInstructions";
import { EyeIcon } from "../contextMenu";

type FocusAutomationSessionModalProps = {
  open: boolean;
  token: string | null;
  tokenRecoverable: boolean;
  onClose: () => void;
};

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export function FocusAutomationSessionModal({
  open,
  token,
  tokenRecoverable,
  onClose,
}: FocusAutomationSessionModalProps) {
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const guideQuery = useQuery({
    queryKey: focusQueryKeys.automationGuide(),
    queryFn: fetchFocusAutomationGuide,
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      setInstructionsOpen(false);
      setCopiedLabel(null);
    }
  }, [open]);

  const setupInstructions = useMemo(() => {
    if (!token || !guideQuery.data?.content) {
      return null;
    }
    return buildFocusAutomationSetupInstructions({
      guideMarkdown: guideQuery.data.content,
      token,
    });
  }, [guideQuery.data?.content, token]);

  if (!open) {
    return null;
  }

  const showCopied = (label: string) => {
    setCopiedLabel(label);
    window.setTimeout(() => setCopiedLabel(null), 1800);
  };

  const handleCopyToken = async () => {
    if (!token) {
      return;
    }
    await copyText(token);
    showCopied("token");
  };

  const handleCopySetup = async () => {
    if (!setupInstructions) {
      return;
    }
    await copyText(setupInstructions);
    showCopied("setup");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-white/12 bg-[#141210] p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 agent-live-dot-flash"
                aria-hidden
              />
              <h2 className="text-lg font-semibold text-white/90">Agent session in progress</h2>
            </div>
            <p className="mt-1 text-sm text-white/45">
              Give the external agent only this session key for authorization. No other login is
              required.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 py-1 text-sm text-white/50 hover:bg-white/8 hover:text-white/80"
          >
            Close
          </button>
        </div>

        {tokenRecoverable && token ? (
          <>
            <label className="mb-2 block text-xs uppercase tracking-wide text-white/40">
              Session key
            </label>
            <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 font-mono text-sm text-emerald-200 break-all">
              {token}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleCopyToken()}
                className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white/75 hover:bg-white/[0.08]"
              >
                {copiedLabel === "token" ? "Copied token" : "Copy token"}
              </button>
              <button
                type="button"
                onClick={() => void handleCopySetup()}
                disabled={!setupInstructions}
                className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white/75 hover:bg-white/[0.08] disabled:opacity-40"
              >
                {copiedLabel === "setup" ? "Copied setup" : "Copy setup instructions"}
              </button>
              <button
                type="button"
                onClick={() => setInstructionsOpen((current) => !current)}
                disabled={!setupInstructions}
                aria-expanded={instructionsOpen}
                aria-label={instructionsOpen ? "Hide setup instructions" : "View setup instructions"}
                className={[
                  "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:opacity-40",
                  instructionsOpen
                    ? "border-violet-400/35 bg-violet-500/15 text-violet-100"
                    : "border-white/12 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]",
                ].join(" ")}
              >
                <EyeIcon />
              </button>
            </div>

            <AnimatePresence initial={false}>
              {instructionsOpen && setupInstructions ? (
                <motion.div
                  key="agent-setup-instructions"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 max-h-[min(52vh,28rem)] overflow-y-auto rounded-xl border border-white/10 bg-black/30 px-4 py-4 scrollbar-hidden">
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-white/72">
                      {setupInstructions}
                    </pre>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </>
        ) : (
          <p className="text-sm leading-relaxed text-white/55">
            A session is active, but the session key cannot be recovered after refresh. End agent
            mode and start a new session to issue a fresh key.
          </p>
        )}
      </div>
    </div>
  );
}
