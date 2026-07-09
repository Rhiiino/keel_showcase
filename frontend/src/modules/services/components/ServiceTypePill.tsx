// keel_web/src/modules/services/components/ServiceTypePill.tsx

import type { ServiceType } from "../api";
import { formatServiceType, serviceTypePillClass } from "../lib/serviceDisplay";

type ServiceTypePillProps = {
  serviceType: ServiceType;
};

export function ServiceTypePill({ serviceType }: ServiceTypePillProps) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
        serviceTypePillClass(serviceType),
      ].join(" ")}
    >
      {formatServiceType(serviceType)}
    </span>
  );
}
