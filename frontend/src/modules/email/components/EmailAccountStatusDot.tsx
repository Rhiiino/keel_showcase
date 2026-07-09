// keel_web/src/modules/email/components/EmailAccountStatusDot.tsx

import type { EmailAccountStatus } from "../api";
import {
  emailAccountStatusDotClass,
  emailAccountStatusLabel,
} from "../lib/emailDisplay";

type EmailAccountStatusDotProps = {
  status: EmailAccountStatus;
  sizeClass?: string;
};

export function EmailAccountStatusDot({
  status,
  sizeClass = "h-3 w-3",
}: EmailAccountStatusDotProps) {
  return (
    <span
      role="img"
      aria-label={emailAccountStatusLabel(status)}
      className={[
        "inline-block shrink-0 rounded-full",
        sizeClass,
        emailAccountStatusDotClass(status),
      ].join(" ")}
    />
  );
}
