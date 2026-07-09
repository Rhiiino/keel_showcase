// keel_web/src/modules/services/components/ServiceForm.tsx

import { ToggleSwitch } from "../../../components/ToggleSwitch";
import { ConfirmDeleteButton } from "../../media/components/shared/actions/ConfirmDeleteButton";
import type { Service } from "../api";
import type { ServiceFormValues } from "../lib/serviceDisplay";
import {
  formatServiceCheckedAt,
  formatServiceResponseTime,
  formatServiceStatusCode,
  SERVICE_TYPE_OPTIONS,
  serviceStatusLabel,
} from "../lib/serviceDisplay";
import { ServiceStatusDot } from "./ServiceStatusDot";

type ServiceFormProps = {
  values: ServiceFormValues;
  onChange: (values: ServiceFormValues) => void;
  disabled?: boolean;
  service?: Service | null;
  showDelete?: boolean;
  onDelete?: () => void;
  deleteDisabled?: boolean;
};

export function ServiceForm({
  values,
  onChange,
  disabled = false,
  service = null,
  showDelete = false,
  onDelete,
  deleteDisabled = false,
}: ServiceFormProps) {
  const update = <K extends keyof ServiceFormValues>(key: K, value: ServiceFormValues[K]) => {
    onChange({ ...values, [key]: value });
  };

  const fieldClass =
    "w-full rounded-lg border border-stone-800 bg-stone-950/60 px-3 py-2 text-sm text-stone-100 outline-none ring-sky-500/40 focus:border-sky-500/50 focus:ring-2 disabled:opacity-50";

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Service name
          </span>
          <input
            type="text"
            value={values.service_name}
            onChange={(event) => update("service_name", event.target.value)}
            disabled={disabled}
            className={fieldClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
            URL
          </span>
          <input
            type="url"
            value={values.url}
            onChange={(event) => update("url", event.target.value)}
            disabled={disabled}
            placeholder="https://example.com/health"
            className={fieldClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Type
          </span>
          <select
            value={values.service_type}
            onChange={(event) => update("service_type", event.target.value as ServiceFormValues["service_type"])}
            disabled={disabled}
            className={fieldClass}
          >
            {SERVICE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Description
          </span>
          <textarea
            value={values.description}
            onChange={(event) => update("description", event.target.value)}
            disabled={disabled}
            rows={3}
            className={fieldClass}
          />
        </label>

        <div className="flex items-center gap-3">
          <ToggleSwitch
            checked={values.check_enabled}
            disabled={disabled}
            ariaLabel="Include in scheduled health checks"
            onChange={(check_enabled) => update("check_enabled", check_enabled)}
          />
          <span className="text-sm text-stone-200">Include in scheduled health checks</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
              Expected status code
            </span>
            <input
              type="number"
              min={100}
              max={599}
              value={values.expected_status_code}
              onChange={(event) => update("expected_status_code", event.target.value)}
              disabled={disabled}
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
              Failure threshold
            </span>
            <input
              type="number"
              min={1}
              value={values.failure_threshold}
              onChange={(event) => update("failure_threshold", event.target.value)}
              disabled={disabled}
              className={fieldClass}
            />
          </label>
        </div>
      </div>

      {service ? (
        <div className="rounded-xl border border-stone-800/80 bg-stone-950/30 p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Last probe
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-stone-500">Status</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm text-stone-200">
                <ServiceStatusDot status={service.last_status} />
                {serviceStatusLabel(service.last_status)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Last checked</dt>
              <dd className="mt-1 text-sm text-stone-200">
                {formatServiceCheckedAt(service.last_checked_at)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Response time</dt>
              <dd className="mt-1 text-sm text-stone-200">
                {formatServiceResponseTime(service.response_time_ms)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Status code</dt>
              <dd className="mt-1 text-sm text-stone-200">
                {formatServiceStatusCode(service.status_code)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Consecutive failures</dt>
              <dd className="mt-1 text-sm text-stone-200">{service.consecutive_failures}</dd>
            </div>
            {service.error_message ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-stone-500">Error</dt>
                <dd className="mt-1 text-sm text-red-300">{service.error_message}</dd>
              </div>
            ) : null}
          </dl>
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
