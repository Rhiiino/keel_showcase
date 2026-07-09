// keel_web/src/modules/services/api.ts

import { apiFetch } from "../../lib/api";

const credentials: RequestCredentials = "include";

export type ServiceStatus = "up" | "down" | "caution";
export type ServiceType = "frontend" | "backend";

export type Service = {
  id: number;
  user_id: number;
  service_name: string;
  url: string;
  service_type: ServiceType;
  description: string | null;
  check_enabled: boolean;
  expected_status_code: number;
  failure_threshold: number;
  last_status: ServiceStatus | null;
  last_checked_at: string | null;
  response_time_ms: number | null;
  status_code: number | null;
  error_message: string | null;
  consecutive_failures: number;
  created_at: string;
  updated_at: string;
};

export type ServiceCreatePayload = {
  service_name: string;
  url: string;
  service_type?: ServiceType;
  description?: string | null;
  check_enabled?: boolean;
  expected_status_code?: number;
  failure_threshold?: number;
};

export type ServiceUpdatePayload = {
  service_name?: string;
  url?: string;
  service_type?: ServiceType;
  description?: string | null;
  check_enabled?: boolean;
  expected_status_code?: number;
  failure_threshold?: number;
};

export const servicesQueryKeys = {
  all: ["services"] as const,
  list: () => [...servicesQueryKeys.all, "list"] as const,
  detail: (serviceId: number | string) =>
    [...servicesQueryKeys.all, "detail", String(serviceId)] as const,
};

export async function fetchServices(): Promise<Service[]> {
  return apiFetch<Service[]>("/services", { credentials });
}

export async function fetchService(serviceId: number | string): Promise<Service> {
  return apiFetch<Service>(`/services/${serviceId}`, { credentials });
}

export async function createService(payload: ServiceCreatePayload): Promise<Service> {
  return apiFetch<Service>("/services", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export async function updateService(
  serviceId: number | string,
  payload: ServiceUpdatePayload,
): Promise<Service> {
  return apiFetch<Service>(`/services/${serviceId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export async function deleteService(serviceId: number | string): Promise<void> {
  await apiFetch<void>(`/services/${serviceId}`, {
    method: "DELETE",
    credentials,
  });
}

export async function checkServiceNow(serviceId: number | string): Promise<Service> {
  return apiFetch<Service>(`/services/${serviceId}/check`, {
    method: "POST",
    credentials,
  });
}

export function servicePath(service: Pick<Service, "id">): string {
  return `/services/${service.id}`;
}
