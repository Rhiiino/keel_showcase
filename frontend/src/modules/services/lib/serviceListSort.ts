// keel_web/src/modules/services/lib/serviceListSort.ts

import type { ListColumnSortState } from "../../../views/list/primitives/listColumnSort";
import type { Service, ServiceStatus } from "../api";

export type ServiceSortColumn =
  | "service_name"
  | "service_type"
  | "status"
  | "last_check"
  | "status_code";

export const SERVICE_DEFAULT_SORT: ListColumnSortState<ServiceSortColumn> = {
  column: "last_check",
  direction: "desc",
};

const STATUS_SORT_RANK: Record<ServiceStatus, number> = {
  down: 0,
  caution: 1,
  up: 2,
};

export function getServiceSortValue(
  service: Service,
  column: ServiceSortColumn,
): string | number | null {
  switch (column) {
    case "service_name":
      return service.service_name;
    case "service_type":
      return service.service_type;
    case "status":
      return service.last_status == null ? null : STATUS_SORT_RANK[service.last_status];
    case "last_check":
      return service.last_checked_at;
    case "status_code":
      return service.status_code;
    default:
      return null;
  }
}
