// keel_web/src/modules/services/components/ServicesListRow.tsx

import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

import { CardMenu } from "../../../components/CardMenu";
import { useConfirmDeleteAction } from "../../../hooks/useConfirmDeleteAction";
import type { Service } from "../api";
import { servicePath } from "../api";
import {
  formatServiceCheckedAt,
  formatServiceResponseTime,
  formatServiceStatusCode,
} from "../lib/serviceDisplay";
import { ServiceElapsedClockCell } from "./ServiceElapsedClockCell";
import { ServiceStatusDot } from "./ServiceStatusDot";
import { ServiceTypePill } from "./ServiceTypePill";

export const SERVICES_LIST_TABLE_WIDTH_CLASS = "w-full min-w-[48rem]";

export const SERVICES_LIST_GRID_CLASS =
  "grid w-full grid-cols-[4rem_7rem_1fr_1fr_4.5rem_2.75rem] items-center";

type ServicesListRowProps = {
  service: Service;
  onDelete?: (serviceId: number) => void;
  onCheckNow?: (serviceId: number) => void;
  deleteDisabled?: boolean;
  checkDisabled?: boolean;
  checking?: boolean;
};

export function ServicesListRow({
  service,
  onDelete,
  onCheckNow,
  deleteDisabled = false,
  checkDisabled = false,
  checking = false,
}: ServicesListRowProps) {
  const navigate = useNavigate();
  const { confirmPending, containerRef, handleClick } = useConfirmDeleteAction(service.id);

  const handleRowClick = (clickEvent: MouseEvent<HTMLDivElement>) => {
    if ((clickEvent.target as HTMLElement).closest("[data-no-row-nav]")) {
      return;
    }
    navigate(servicePath(service));
  };

  const menuItems = [
    {
      id: "check-now",
      label: checking ? "Checking…" : "Check now",
      disabled: checkDisabled || checking || !onCheckNow,
      onSelect: () => {
        onCheckNow?.(service.id);
      },
    },
    {
      id: "delete",
      label: confirmPending ? "Confirm delete" : "Delete",
      tone: "danger" as const,
      disabled: deleteDisabled || !onDelete,
      onSelect: () => {
        handleClick(() => onDelete?.(service.id));
      },
    },
  ];

  return (
    <div
      onClick={handleRowClick}
      className={[
        "grid w-full cursor-pointer border-b border-stone-800/80 transition last:border-b-0 hover:bg-stone-900/40",
        SERVICES_LIST_GRID_CLASS,
        checking ? "opacity-70" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-center px-4 py-3.5 align-middle">
        <ServiceStatusDot status={service.last_status} />
      </div>

      <div className="flex items-center px-4 py-3.5 align-middle">
        <ServiceTypePill serviceType={service.service_type} />
      </div>

      <div className="min-w-0 px-4 py-3.5 align-middle">
        <p className="truncate text-sm font-medium text-stone-100" title={service.service_name}>
          {service.service_name}
        </p>
      </div>

      <div className="min-w-0 px-4 py-3.5 align-middle">
        <p className="text-sm text-stone-300">{formatServiceCheckedAt(service.last_checked_at)}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-xs text-stone-500">{formatServiceResponseTime(service.response_time_ms)}</p>
          <ServiceElapsedClockCell lastCheckedAt={service.last_checked_at} />
        </div>
      </div>

      <div className="flex items-center self-stretch px-4 py-3.5">
        <p className="text-sm text-stone-300">{formatServiceStatusCode(service.status_code)}</p>
      </div>

      <div
        ref={containerRef}
        data-no-row-nav
        className="relative z-10 flex shrink-0 items-center justify-center px-1 py-3.5"
      >
        <CardMenu
          ariaLabel={`Options for ${service.service_name}`}
          disabled={deleteDisabled && checkDisabled}
          items={menuItems}
        />
      </div>
    </div>
  );
}
