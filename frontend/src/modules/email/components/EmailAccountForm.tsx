// keel_web/src/modules/email/components/EmailAccountForm.tsx

import { ConfirmDeleteButton } from "../../media/components/shared/actions/ConfirmDeleteButton";
import type { EmailAccount } from "../api";
import type { EmailAccountFormValues } from "../lib/emailDisplay";
import {
  EMAIL_PROVIDER_OPTIONS,
  emailAccountStatusLabel,
  emailProviderLabel,
  formatEmailAccountTimestamp,
} from "../lib/emailDisplay";
import { EmailAccountConnectButton } from "./EmailAccountConnectButton";
import { EmailAccountStatusDot } from "./EmailAccountStatusDot";

type EmailAccountFormProps = {
  values: EmailAccountFormValues;
  onChange: (values: EmailAccountFormValues) => void;
  disabled?: boolean;
  account?: EmailAccount | null;
  showDelete?: boolean;
  onDelete?: () => void;
  deleteDisabled?: boolean;
};

export function EmailAccountForm({
  values,
  onChange,
  disabled = false,
  account = null,
  showDelete = false,
  onDelete,
  deleteDisabled = false,
}: EmailAccountFormProps) {
  const update = <K extends keyof EmailAccountFormValues>(
    key: K,
    value: EmailAccountFormValues[K],
  ) => {
    onChange({ ...values, [key]: value });
  };

  const fieldClass =
    "w-full rounded-lg border border-stone-800 bg-stone-950/60 px-3 py-2 text-sm text-stone-100 outline-none ring-sky-500/40 focus:border-sky-500/50 focus:ring-2 disabled:opacity-50";

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Provider
          </span>
          <select
            value={values.provider}
            onChange={(event) =>
              update("provider", event.target.value as EmailAccountFormValues["provider"])
            }
            disabled={disabled}
            className={fieldClass}
          >
            {EMAIL_PROVIDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Email address
          </span>
          <input
            type="email"
            value={values.email_address}
            onChange={(event) => update("email_address", event.target.value)}
            disabled={disabled}
            placeholder="you@gmail.com"
            className={fieldClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Nickname
          </span>
          <input
            type="text"
            value={values.nickname}
            onChange={(event) => update("nickname", event.target.value)}
            disabled={disabled}
            placeholder="Climb, Personal, Work…"
            className={fieldClass}
          />
        </label>
      </div>

      {account ? (
        <div className="rounded-xl border border-stone-800/80 bg-stone-950/30 p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Connection
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-stone-500">Status</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm text-stone-200">
                <EmailAccountStatusDot status={account.status} />
                {emailAccountStatusLabel(account.status)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Provider</dt>
              <dd className="mt-1 text-sm text-stone-200">
                {emailProviderLabel(account.provider)}
              </dd>
            </div>
            {account.connected_at ? (
              <div>
                <dt className="text-xs text-stone-500">Connected at</dt>
                <dd className="mt-1 text-sm text-stone-200">
                  {formatEmailAccountTimestamp(account.connected_at)}
                </dd>
              </div>
            ) : null}
            {account.status === "disconnected" ? (
              <div>
                <dt className="text-xs text-stone-500">Disconnected at</dt>
                <dd className="mt-1 text-sm text-stone-200">
                  {formatEmailAccountTimestamp(account.disconnected_at)}
                </dd>
              </div>
            ) : null}
          </dl>
          <div className="mt-4 border-t border-stone-800/70 pt-4">
            <EmailAccountConnectButton
              accountId={account.id}
              status={account.status}
              disabled={disabled}
            />
          </div>
        </div>
      ) : null}

      {showDelete && onDelete ? (
        <div className="border-t border-stone-800/70 pt-6">
          <ConfirmDeleteButton onConfirm={onDelete} disabled={deleteDisabled || disabled} />
        </div>
      ) : null}
    </div>
  );
}
