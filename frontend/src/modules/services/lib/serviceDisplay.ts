// keel_web/src/modules/services/lib/serviceDisplay.ts

import type { Service, ServiceStatus, ServiceType } from "../api";

export const SERVICE_TYPE_OPTIONS: Array<{ value: ServiceType; label: string }> = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
];

export function formatServiceType(value: ServiceType): string {
  return SERVICE_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function serviceTypePillClass(value: ServiceType): string {
  if (value === "frontend") {
    return "bg-sky-400/15 text-sky-300 ring-sky-400/30";
  }
  return "bg-violet-400/15 text-violet-300 ring-violet-400/30";
}

export type ServiceElapsedParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function getServiceElapsedSinceCheck(
  lastCheckedAt: string | null,
  now: Date = new Date(),
): ServiceElapsedParts | null {
  if (!lastCheckedAt) {
    return null;
  }

  const checkedMs = new Date(lastCheckedAt).getTime();
  if (Number.isNaN(checkedMs)) {
    return null;
  }

  const totalSeconds = Math.max(0, Math.floor((now.getTime() - checkedMs) / 1000));
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function formatServiceElapsedClock(parts: ServiceElapsedParts): string {
  return [parts.hours, parts.minutes, parts.seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

export function formatServiceCheckedAt(value: string | null): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatServiceResponseTime(value: number | null): string {
  if (value == null) {
    return "—";
  }
  return `${value} ms`;
}

export function formatServiceStatusCode(value: number | null): string {
  if (value == null) {
    return "—";
  }
  return String(value);
}

export function serviceStatusLabel(status: ServiceStatus | null): string {
  if (status === "up") {
    return "Up";
  }
  if (status === "caution") {
    return "Caution";
  }
  if (status === "down") {
    return "Down";
  }
  return "Not checked";
}

export function serviceStatusDotClass(status: ServiceStatus | null): string {
  if (status === "up") {
    return "bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.55)]";
  }
  if (status === "caution") {
    return "bg-amber-400 shadow-[0_0_10px_2px_rgba(251,191,36,0.55)]";
  }
  if (status === "down") {
    return "bg-red-400 shadow-[0_0_10px_2px_rgba(248,113,113,0.55)]";
  }
  return "bg-stone-600 shadow-[0_0_6px_1px_rgba(120,113,108,0.35)]";
}

export function isServiceFormValid(values: {
  service_name: string;
  url: string;
  expected_status_code: string;
  failure_threshold: string;
}): boolean {
  const name = values.service_name.trim();
  const url = values.url.trim();
  const expected = Number.parseInt(values.expected_status_code, 10);
  const threshold = Number.parseInt(values.failure_threshold, 10);
  if (!name || !url) {
    return false;
  }
  if (!/^https?:\/\//i.test(url)) {
    return false;
  }
  if (!Number.isFinite(expected) || expected < 100 || expected > 599) {
    return false;
  }
  if (!Number.isFinite(threshold) || threshold < 1) {
    return false;
  }
  return true;
}

export function serviceToFormValues(service: Service) {
  return {
    service_name: service.service_name,
    url: service.url,
    service_type: service.service_type,
    description: service.description ?? "",
    check_enabled: service.check_enabled,
    expected_status_code: String(service.expected_status_code),
    failure_threshold: String(service.failure_threshold),
  };
}

export type ServiceFormValues = ReturnType<typeof emptyServiceFormValues>;

export function emptyServiceFormValues() {
  return {
    service_name: "",
    url: "",
    service_type: "frontend" as ServiceType,
    description: "",
    check_enabled: true,
    expected_status_code: "200",
    failure_threshold: "3",
  };
}

export function formValuesToCreatePayload(values: ServiceFormValues) {
  const description = values.description.trim();
  return {
    service_name: values.service_name.trim(),
    url: values.url.trim(),
    service_type: values.service_type,
    description: description.length > 0 ? description : null,
    check_enabled: values.check_enabled,
    expected_status_code: Number.parseInt(values.expected_status_code, 10),
    failure_threshold: Number.parseInt(values.failure_threshold, 10),
  };
}

export function formValuesToUpdatePayload(values: ServiceFormValues) {
  return formValuesToCreatePayload(values);
}
