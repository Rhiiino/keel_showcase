// keel_web/src/modules/services/components/ServicesListView.tsx

import { ListView } from "../../../views/list/ListView";
import type { ListColumnDef } from "../../../views/list/types";
import type { Service } from "../api";
import {
  getServiceSortValue,
  SERVICE_DEFAULT_SORT,
  type ServiceSortColumn,
} from "../lib/serviceListSort";
import {
  SERVICES_LIST_GRID_CLASS,
  SERVICES_LIST_TABLE_WIDTH_CLASS,
  ServicesListRow,
} from "./ServicesListRow";

const SERVICE_COLUMNS: ListColumnDef<ServiceSortColumn | "actions">[] = [
  { id: "status", label: "Status" },
  { id: "service_type", label: "Type" },
  { id: "service_name", label: "Service" },
  { id: "last_check", label: "Last check" },
  { id: "status_code", label: "Code" },
  { id: "actions", label: "", sortable: false, headerClassName: "px-1 py-3" },
];

type ServicesListViewProps = {
  services: Service[];
  onDelete?: (serviceId: number) => void;
  onCheckNow?: (serviceId: number) => void;
  deleteDisabled?: boolean;
  checkDisabled?: boolean;
  checkingServiceId?: number | null;
  emptyMessage?: string;
  paginationResetKey?: unknown;
};

export function ServicesListView({
  services,
  onDelete,
  onCheckNow,
  deleteDisabled = false,
  checkDisabled = false,
  checkingServiceId = null,
  emptyMessage = "No services yet.",
  paginationResetKey,
}: ServicesListViewProps) {
  return (
    <ListView
      items={services}
      columns={SERVICE_COLUMNS}
      getSortValue={(service, column) =>
        column === "actions" ? null : getServiceSortValue(service, column)
      }
      defaultSort={SERVICE_DEFAULT_SORT}
      gridClassName={SERVICES_LIST_GRID_CLASS}
      tableWidthClassName={SERVICES_LIST_TABLE_WIDTH_CLASS}
      renderRow={(service) => (
        <ServicesListRow
          service={service}
          onDelete={onDelete}
          onCheckNow={onCheckNow}
          deleteDisabled={deleteDisabled}
          checkDisabled={checkDisabled}
          checking={checkingServiceId === service.id}
        />
      )}
      getRowKey={(service) => service.id}
      emptyMessage={emptyMessage}
      paginationResetKey={paginationResetKey}
    />
  );
}
