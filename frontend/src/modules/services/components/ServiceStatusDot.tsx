// keel_web/src/modules/services/components/ServiceStatusDot.tsx

import type { ServiceStatus } from "../api";
import { serviceStatusDotClass, serviceStatusLabel } from "../lib/serviceDisplay";

type ServiceStatusDotProps = {
  status: ServiceStatus | null;
  sizeClass?: string;
};

export function ServiceStatusDot({
  status,
  sizeClass = "h-3 w-3",
}: ServiceStatusDotProps) {
  return (
    <span
      role="img"
      aria-label={serviceStatusLabel(status)}
      className={[
        "inline-block shrink-0 rounded-full",
        sizeClass,
        serviceStatusDotClass(status),
      ].join(" ")}
    />
  );
}
