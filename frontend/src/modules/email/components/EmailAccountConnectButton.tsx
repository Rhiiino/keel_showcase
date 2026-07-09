// keel_web/src/modules/email/components/EmailAccountConnectButton.tsx

import googleIcon from "../../../assets/general/google.png";
import type { EmailAccountStatus } from "../api";
import { getEmailAccountConnectUrl } from "../api";
import { emailAccountConnectLabel } from "../lib/emailDisplay";

type EmailAccountConnectButtonProps = {
  accountId: number;
  status: EmailAccountStatus;
  disabled?: boolean;
};

export function EmailAccountConnectButton({
  accountId,
  status,
  disabled = false,
}: EmailAccountConnectButtonProps) {
  function handleClick() {
    window.location.href = getEmailAccountConnectUrl(accountId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-500/35 bg-stone-600/45 px-3 py-2 text-sm font-semibold text-stone-50 shadow-lg shadow-black/25 backdrop-blur-sm transition hover:border-stone-400/45 hover:bg-stone-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <img src={googleIcon} alt="" className="h-5 w-5 shrink-0" aria-hidden />
      {emailAccountConnectLabel(status)} Gmail
    </button>
  );
}
