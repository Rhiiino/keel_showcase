// keel_web/src/modules/email/components/EmailInboxFetchFilters.tsx

import {
  EMAIL_MAILBOX_OPTIONS,
  type EmailInboxFetchFilters,
} from "../lib/emailInboxDisplay";

type EmailInboxFetchFiltersProps = {
  values: EmailInboxFetchFilters;
  onChange: (values: EmailInboxFetchFilters) => void;
  disabled?: boolean;
};

export function EmailInboxFetchFiltersPanel({
  values,
  onChange,
  disabled = false,
}: EmailInboxFetchFiltersProps) {
  const fieldClass =
    "w-full rounded-lg border border-stone-800 bg-stone-950/60 px-3 py-2 text-sm text-stone-100 outline-none ring-sky-500/40 focus:border-sky-500/50 focus:ring-2 disabled:opacity-50";

  const update = <K extends keyof EmailInboxFetchFilters>(
    key: K,
    value: EmailInboxFetchFilters[K],
  ) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-950/40 p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Mailbox
          </span>
          <select
            value={values.mailbox}
            onChange={(event) =>
              update("mailbox", event.target.value as EmailInboxFetchFilters["mailbox"])
            }
            disabled={disabled}
            className={fieldClass}
          >
            {EMAIL_MAILBOX_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
            From / To
          </span>
          <input
            type="text"
            value={values.from_or_to}
            onChange={(event) => update("from_or_to", event.target.value)}
            disabled={disabled}
            placeholder="Name or email address"
            className={fieldClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Subject
          </span>
          <input
            type="text"
            value={values.subject}
            onChange={(event) => update("subject", event.target.value)}
            disabled={disabled}
            placeholder="Subject contains"
            className={fieldClass}
          />
        </label>

        <label className="block md:col-span-2 xl:col-span-1">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Body
          </span>
          <input
            type="text"
            value={values.body}
            onChange={(event) => update("body", event.target.value)}
            disabled={disabled}
            placeholder="Body contains"
            className={fieldClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Max results
          </span>
          <input
            type="number"
            min={1}
            max={500}
            value={values.max_results}
            onChange={(event) => update("max_results", event.target.value)}
            disabled={disabled}
            placeholder="All (up to 500)"
            className={fieldClass}
          />
        </label>
      </div>
      <p className="mt-3 text-xs text-stone-500">
        Search filters are saved per account. Results load only when you click Fetch.
      </p>
    </div>
  );
}
